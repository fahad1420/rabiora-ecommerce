import { TRPCError } from "@trpc/server";
import { connectMongo } from "./config/db";
import { CartModel, OrderModel, ProductModel, UserModel, findOrderQuery, findProductQuery, findUserQuery } from "./models";
import type { CartIdentity } from "./cartService";
import { nanoid } from "nanoid";

export const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Cash on Delivery"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function calculateDeliveryCharge(districtArea: string) {
  return /dhaka/i.test(districtArea) ? 0 : 120;
}

export function manualPaymentRequired(method: PaymentMethod) {
  return method === "bKash" || method === "Nagad" || method === "Rocket";
}

export function assertManualPaymentEvidence(
  method: PaymentMethod,
  transactionId?: string,
  submittedAmountTaka?: number
) {
  if (manualPaymentRequired(method) && (!transactionId?.trim() || !submittedAmountTaka || submittedAmountTaka < 1)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Transaction ID and submitted amount are required for this payment method.",
    });
  }
}

export function validateOrderStock(
  lines: Array<{ productId: number | string; quantity: number }>,
  currentProducts: Array<{ id?: number | string; _id?: any; legacyId?: number; isInStock: boolean; stockQuantity: number }>
) {
  const productsById = new Map(
    currentProducts.flatMap((product) => {
      const entries: [string, typeof product][] = [];
      if (product.id !== undefined) entries.push([String(product.id), product]);
      if (product.legacyId !== undefined) entries.push([String(product.legacyId), product]);
      if (product._id !== undefined) entries.push([String(product._id), product]);
      return entries;
    })
  );

  for (const line of lines) {
    const product = productsById.get(String(line.productId));
    if (!product || !product.isInStock || product.stockQuantity < line.quantity) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "One or more cart items no longer have enough stock.",
      });
    }
  }
}

function generateOrderNumber() {
  return `RAB-${Date.now().toString(36).toUpperCase()}-${nanoid(5).toUpperCase()}`;
}

export async function createOrder(
  identity: CartIdentity,
  input: {
    customerName: string;
    customerPhone: string;
    districtArea: string;
    fullAddress: string;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    submittedAmountTaka?: number;
  }
) {
  await connectMongo();

  let userDoc = null;
  let cartQuery: Record<string, unknown> = {};

  if (identity.userId) {
    userDoc = await UserModel.findOne(findUserQuery(identity.userId));
    cartQuery = userDoc ? { userId: userDoc._id } : { userId: identity.userId };
  } else if (identity.anonymousToken) {
    cartQuery = { anonymousToken: identity.anonymousToken };
  } else {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Your cart is empty." });
  }

  const cart = await CartModel.findOne(cartQuery).populate("items.productId");
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Your cart is empty." });
  }

  const orderItems = [];
  let subtotalTaka = 0;

  for (const item of cart.items) {
    const product: any = item.productId;
    if (!product || !product.isInStock || (product.stockQuantity || 0) < item.quantity) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Product ${product?.name || "in cart"} is out of stock.`,
      });
    }

    const coverImage = (product.images || []).find((img: any) => img.isCover) || (product.images || [])[0];
    const unitPrice = product.priceTaka || 0;
    const lineTotal = unitPrice * item.quantity;
    subtotalTaka += lineTotal;

    orderItems.push({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      imageUrl: coverImage ? coverImage.storageUrl : "",
      unitPriceTaka: unitPrice,
      quantity: item.quantity,
      lineTotalTaka: lineTotal,
    });
  }

  const deliveryChargeTaka = calculateDeliveryCharge(input.districtArea);
  const totalTaka = subtotalTaka + deliveryChargeTaka;

  assertManualPaymentEvidence(input.paymentMethod, input.transactionId, input.submittedAmountTaka);

  const orderNum = generateOrderNumber();

  const paymentRecord = {
    method: input.paymentMethod,
    expectedAmountTaka: totalTaka,
    submittedAmountTaka: manualPaymentRequired(input.paymentMethod) ? input.submittedAmountTaka : undefined,
    transactionId: manualPaymentRequired(input.paymentMethod) ? input.transactionId?.trim() : undefined,
    createdAt: new Date(),
  };

  const statusHistoryRecord = {
    previousStatus: undefined,
    nextStatus: "pending" as const,
    actorUserId: userDoc ? userDoc._id : undefined,
    adminNote: "Order placed",
    createdAt: new Date(),
  };

  const order = await OrderModel.create({
    orderNumber: orderNum,
    userId: userDoc ? userDoc._id : undefined,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    districtArea: input.districtArea,
    fullAddress: input.fullAddress,
    subtotalTaka,
    deliveryChargeTaka,
    totalTaka,
    paymentMethod: input.paymentMethod,
    status: "pending",
    items: orderItems,
    payments: [paymentRecord],
    statusHistory: [statusHistoryRecord],
  });

  // Decrement product stocks
  for (const item of cart.items) {
    const product: any = item.productId;
    const nextStock = Math.max(0, (product.stockQuantity || 0) - item.quantity);
    await ProductModel.updateOne(
      { _id: product._id },
      {
        $set: {
          stockQuantity: nextStock,
          isInStock: nextStock > 0,
        },
      }
    );
  }

  // Clear cart items
  cart.items = [];
  await cart.save();

  return {
    orderNumber: order.orderNumber,
    totalTaka: order.totalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    paymentMethod: input.paymentMethod,
    items: orderItems.map((line) => ({
      name: line.productName,
      quantity: line.quantity,
      lineTotalTaka: line.lineTotalTaka,
    })),
  };
}

export async function getOrderConfirmation(orderNumberValue: string) {
  await connectMongo();
  const order = await OrderModel.findOne(findOrderQuery(orderNumberValue)).lean();
  if (!order) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
  }

  return {
    orderNumber: order.orderNumber,
    totalTaka: order.totalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt,
  };
}

export async function getCustomerOrderConfirmation(userId: string | number, orderNumberValue: string) {
  await connectMongo();
  const user = await UserModel.findOne(findUserQuery(userId));

  const order = await OrderModel.findOne({
    orderNumber: orderNumberValue,
    ...(user ? { userId: user._id } : {}),
  }).lean();

  if (!order) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
  }

  return {
    orderNumber: order.orderNumber,
    totalTaka: order.totalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt,
  };
}

export async function getCustomerOrderDetail(userId: string | number, orderNumberValue: string) {
  await connectMongo();
  const user = await UserModel.findOne(findUserQuery(userId));

  const order = await OrderModel.findOne({
    orderNumber: orderNumberValue,
    ...(user ? { userId: user._id } : {}),
  }).lean();

  if (!order) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
  }

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    districtArea: order.districtArea,
    fullAddress: order.fullAddress,
    subtotalTaka: order.subtotalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    totalTaka: order.totalTaka,
    paymentMethod: order.paymentMethod,
    status: order.status,
    adminNote: order.adminNote,
    createdAt: order.createdAt,
    items: (order.items || []).map((item, idx) => ({
      id: item._id ? item._id.toString() : idx + 1,
      productId: item.productId?.toString(),
      productName: item.productName,
      sku: item.sku,
      imageUrl: item.imageUrl,
      unitPriceTaka: item.unitPriceTaka,
      quantity: item.quantity,
      lineTotalTaka: item.lineTotalTaka,
    })),
    payment: order.payments && order.payments[0] ? order.payments[0] : null,
    statusHistory: (order.statusHistory || []).map((sh, idx) => ({
      id: sh._id ? sh._id.toString() : idx + 1,
      nextStatus: sh.nextStatus,
      adminNote: sh.adminNote,
      createdAt: sh.createdAt,
    })),
  };
}

export async function listCustomerOrders(userId: string | number) {
  await connectMongo();
  const user = await UserModel.findOne(findUserQuery(userId));

  if (!user) return [];

  const customerOrders = await OrderModel.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .lean();

  return customerOrders.map((order) => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    districtArea: order.districtArea,
    fullAddress: order.fullAddress,
    subtotalTaka: order.subtotalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    totalTaka: order.totalTaka,
    paymentMethod: order.paymentMethod,
    status: order.status,
    adminNote: order.adminNote,
    createdAt: order.createdAt,
    items: (order.items || []).map((item, idx) => ({
      id: item._id ? item._id.toString() : idx + 1,
      orderId: order._id.toString(),
      productId: item.productId?.toString(),
      productName: item.productName,
      sku: item.sku,
      imageUrl: item.imageUrl,
      unitPriceTaka: item.unitPriceTaka,
      quantity: item.quantity,
      lineTotalTaka: item.lineTotalTaka,
    })),
  }));
}
