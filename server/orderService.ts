import { TRPCError } from "@trpc/server";
import { connectMongo } from "./config/db";
import { CartModel, OrderModel, ProductModel, UserModel, SiteSettingsModel, findOrderQuery, findProductQuery, findUserQuery } from "./models";
import type { CartIdentity } from "./cartService";
import { nanoid } from "nanoid";
import { validateCoupon, incrementCouponUsage } from "./couponService";

export const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Cash on Delivery"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export async function calculateDeliveryChargeAsync(districtArea: string) {
  try {
    await connectMongo();
    const settings = await SiteSettingsModel.findOne({ key: "default" }).lean();
    const isDhaka = /dhaka|gazipur|narayanganj/i.test(districtArea);
    if (settings) {
      return isDhaka ? (settings.deliveryChargeDhaka ?? 0) : (settings.deliveryChargeOutsideDhaka ?? 120);
    }
  } catch {}
  return /dhaka|gazipur|narayanganj/i.test(districtArea) ? 0 : 120;
}

export function calculateDeliveryCharge(districtArea: string) {
  return /dhaka|gazipur|narayanganj/i.test(districtArea) ? 0 : 120;
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
    upazila?: string;
    thana?: string;
    area?: string;
    fullAddress: string;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    submittedAmountTaka?: number;
    couponCode?: string;
    buyNowItem?: { productId: number | string; quantity: number };
  }
) {
  await connectMongo();

  let userDoc = null;
  if (identity.userId) {
    userDoc = await UserModel.findOne(findUserQuery(identity.userId));
  }

  const orderItems = [];
  let rawSubtotalTaka = 0;

  if (input.buyNowItem) {
    const product: any = await ProductModel.findOne(findProductQuery(input.buyNowItem.productId));
    const qty = Math.max(1, input.buyNowItem.quantity || 1);
    if (!product || !product.isInStock || (product.stockQuantity || 0) < qty) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Product ${product?.name || "selected"} is out of stock.`,
      });
    }

    const coverImage = (product.images || []).find((img: any) => img.isCover) || (product.images || [])[0];
    const unitPrice = product.priceTaka || 0;
    const lineTotal = unitPrice * qty;
    rawSubtotalTaka += lineTotal;

    orderItems.push({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      imageUrl: coverImage ? coverImage.storageUrl : "",
      unitPriceTaka: unitPrice,
      quantity: qty,
      lineTotalTaka: lineTotal,
    });
  } else {
    let cartQuery: Record<string, unknown> = {};
    if (userDoc) {
      cartQuery = { userId: userDoc._id };
    } else if (identity.anonymousToken) {
      cartQuery = { anonymousToken: identity.anonymousToken };
    } else {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Your cart is empty." });
    }

    const cart = await CartModel.findOne(cartQuery).populate("items.productId");
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Your cart is empty." });
    }

    for (const item of cart.items) {
      const product: any = item.productId;
      if (!product || !product.isInStock || (product.stockQuantity || 0) < item.quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Product ${product?.name || "in cart"} is out of stock or does not have enough quantity.`,
        });
      }

      const coverImage = (product.images || []).find((img: any) => img.isCover) || (product.images || [])[0];
      const unitPrice = product.priceTaka || 0;
      const lineTotal = unitPrice * item.quantity;
      rawSubtotalTaka += lineTotal;

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
  }

  // 1. Coupon validation and discount calculation
  let appliedCouponCode: string | undefined = undefined;
  let originalSubtotalTaka: number | undefined = undefined;
  let discountPercent: number | undefined = undefined;
  let discountAmountTaka: number | undefined = undefined;
  let finalSubtotalTaka = rawSubtotalTaka;

  if (input.couponCode && input.couponCode.trim()) {
    const couponValidation = await validateCoupon(
      input.couponCode,
      rawSubtotalTaka,
      input.paymentMethod
    );
    appliedCouponCode = couponValidation.code;
    originalSubtotalTaka = rawSubtotalTaka;
    discountPercent = couponValidation.discountPercent;
    discountAmountTaka = couponValidation.discountAmount;
    finalSubtotalTaka = couponValidation.payableSubtotal;
    await incrementCouponUsage(couponValidation.code);
  }

  const deliveryChargeTaka = await calculateDeliveryChargeAsync(input.districtArea);
  const totalTaka = finalSubtotalTaka + deliveryChargeTaka;

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
    upazila: input.upazila,
    thana: input.thana || input.area,
    area: input.area || input.thana,
    fullAddress: input.fullAddress,
    subtotalTaka: finalSubtotalTaka,
    deliveryChargeTaka,
    totalTaka,
    couponCode: appliedCouponCode,
    originalSubtotalTaka,
    discountPercent,
    discountAmountTaka,
    paymentMethod: input.paymentMethod,
    status: "pending",
    items: orderItems,
    payments: [paymentRecord],
    statusHistory: [statusHistoryRecord],
  });

  // Decrement product stocks
  if (input.buyNowItem) {
    const qty = Math.max(1, input.buyNowItem.quantity || 1);
    const prod = await ProductModel.findOne(findProductQuery(input.buyNowItem.productId));
    if (prod) {
      const nextStock = Math.max(0, (prod.stockQuantity || 0) - qty);
      prod.stockQuantity = nextStock;
      prod.isInStock = nextStock > 0;
      await prod.save();
    }
  } else {
    let cartQuery: Record<string, unknown> = {};
    if (userDoc) {
      cartQuery = { userId: userDoc._id };
    } else if (identity.anonymousToken) {
      cartQuery = { anonymousToken: identity.anonymousToken };
    }
    const cart = await CartModel.findOne(cartQuery).populate("items.productId");
    if (cart) {
      for (const item of cart.items) {
        const product: any = item.productId;
        if (product) {
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
      }
      cart.items = [];
      await cart.save();
    }
  }

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
    subtotalTaka: order.subtotalTaka,
    totalTaka: order.totalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    couponCode: order.couponCode,
    originalSubtotalTaka: order.originalSubtotalTaka,
    discountPercent: order.discountPercent,
    discountAmountTaka: order.discountAmountTaka,
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
    subtotalTaka: order.subtotalTaka,
    totalTaka: order.totalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    couponCode: order.couponCode,
    originalSubtotalTaka: order.originalSubtotalTaka,
    discountPercent: order.discountPercent,
    discountAmountTaka: order.discountAmountTaka,
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
    couponCode: order.couponCode,
    originalSubtotalTaka: order.originalSubtotalTaka,
    discountPercent: order.discountPercent,
    discountAmountTaka: order.discountAmountTaka,
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
    couponCode: order.couponCode,
    originalSubtotalTaka: order.originalSubtotalTaka,
    discountPercent: order.discountPercent,
    discountAmountTaka: order.discountAmountTaka,
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
