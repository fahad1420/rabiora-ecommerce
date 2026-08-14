import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { cartItems, carts, orderItems, orderStatusHistory, orders, payments, productImages, products } from "../drizzle/schema";
import { getDb } from "./db";
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

export function assertManualPaymentEvidence(method: PaymentMethod, transactionId?: string, submittedAmountTaka?: number) {
  if (manualPaymentRequired(method) && (!transactionId?.trim() || !submittedAmountTaka || submittedAmountTaka < 1)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Transaction ID and submitted amount are required for this payment method." });
  }
}

export function validateOrderStock(
  lines: Array<{ productId: number; quantity: number }>,
  currentProducts: Array<{ id: number; isInStock: boolean; stockQuantity: number }>,
) {
  const productsById = new Map(currentProducts.map((product) => [product.id, product]));
  for (const line of lines) {
    const product = productsById.get(line.productId);
    if (!product || !product.isInStock || product.stockQuantity < line.quantity) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "One or more cart items no longer have enough stock." });
    }
  }
}

function orderNumber() {
  return `RAB-${Date.now().toString(36).toUpperCase()}-${nanoid(5).toUpperCase()}`;
}

export async function createOrder(identity: CartIdentity, input: {
  customerName: string; customerPhone: string; districtArea: string; fullAddress: string;
  paymentMethod: PaymentMethod; transactionId?: string; submittedAmountTaka?: number;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Checkout is temporarily unavailable." });
  const [cart] = await db.select().from(carts).where(identity.userId ? eq(carts.userId, identity.userId) : eq(carts.anonymousToken, identity.anonymousToken!)).limit(1);
  if (!cart) throw new TRPCError({ code: "BAD_REQUEST", message: "Your cart is empty." });

  const result = await db.transaction(async (tx) => {
    const lines = await tx.select({ productId: cartItems.productId, quantity: cartItems.quantity }).from(cartItems).where(eq(cartItems.cartId, cart.id));
    if (lines.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Your cart is empty." });
    const productIds = lines.map((line) => line.productId);
    const currentProducts = await tx.select().from(products).where(inArray(products.id, productIds));
    validateOrderStock(lines, currentProducts);
    const productsById = new Map(currentProducts.map((product) => [product.id, product]));
    const subtotalTaka = lines.reduce((sum, line) => sum + (productsById.get(line.productId)?.priceTaka ?? 0) * line.quantity, 0);
    const deliveryChargeTaka = calculateDeliveryCharge(input.districtArea);
    const totalTaka = subtotalTaka + deliveryChargeTaka;
    assertManualPaymentEvidence(input.paymentMethod, input.transactionId, input.submittedAmountTaka);
    const nextOrderNumber = orderNumber();
    await tx.insert(orders).values({
      orderNumber: nextOrderNumber, userId: identity.userId ?? null, customerName: input.customerName, customerPhone: input.customerPhone,
      districtArea: input.districtArea, fullAddress: input.fullAddress, subtotalTaka, deliveryChargeTaka, totalTaka,
      paymentMethod: input.paymentMethod, status: "pending",
    });
    const [order] = await tx.select().from(orders).where(eq(orders.orderNumber, nextOrderNumber)).limit(1);
    if (!order) throw new Error("Order creation did not return a record.");
    const imageRows = await tx.select({ productId: productImages.productId, imageUrl: productImages.storageUrl }).from(productImages)
      .where(and(inArray(productImages.productId, productIds), eq(productImages.isCover, true)));
    const coverByProduct = new Map(imageRows.map((image) => [image.productId, image.imageUrl]));
    await tx.insert(orderItems).values(lines.map((line) => {
      const product = productsById.get(line.productId)!;
      return { orderId: order.id, productId: product.id, productName: product.name, sku: product.sku, imageUrl: coverByProduct.get(product.id) ?? null, unitPriceTaka: product.priceTaka, quantity: line.quantity, lineTotalTaka: product.priceTaka * line.quantity };
    }));
    await tx.insert(payments).values({ orderId: order.id, method: input.paymentMethod, expectedAmountTaka: totalTaka, submittedAmountTaka: manualPaymentRequired(input.paymentMethod) ? input.submittedAmountTaka ?? null : null, transactionId: manualPaymentRequired(input.paymentMethod) ? input.transactionId?.trim() ?? null : null });
    await tx.insert(orderStatusHistory).values({ orderId: order.id, previousStatus: null, nextStatus: "pending", actorUserId: identity.userId ?? null, adminNote: "Order placed" });
    for (const line of lines) {
      const product = productsById.get(line.productId)!;
      const nextStock = product.stockQuantity - line.quantity;
      await tx.update(products).set({ stockQuantity: nextStock, isInStock: nextStock > 0 }).where(eq(products.id, product.id));
    }
    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    return {
      order,
      lines: lines.map((line) => ({
        ...line,
        name: productsById.get(line.productId)!.name,
        lineTotalTaka: productsById.get(line.productId)!.priceTaka * line.quantity,
      })),
      totalTaka,
      deliveryChargeTaka,
    };
  });
  return {
    orderNumber: result.order.orderNumber,
    totalTaka: result.totalTaka,
    deliveryChargeTaka: result.deliveryChargeTaka,
    paymentMethod: input.paymentMethod,
    items: result.lines.map((line) => ({ name: line.name, quantity: line.quantity, lineTotalTaka: line.lineTotalTaka })),
  };
}

export async function getOrderConfirmation(orderNumberValue: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Order lookup is temporarily unavailable." });
  const [order] = await db.select({ orderNumber: orders.orderNumber, totalTaka: orders.totalTaka, deliveryChargeTaka: orders.deliveryChargeTaka, paymentMethod: orders.paymentMethod, status: orders.status, createdAt: orders.createdAt }).from(orders).where(eq(orders.orderNumber, orderNumberValue)).limit(1);
  if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
  return order;
}

export async function getCustomerOrderConfirmation(userId: number, orderNumberValue: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Order lookup is temporarily unavailable." });
  const [order] = await db.select({ orderNumber: orders.orderNumber, totalTaka: orders.totalTaka, deliveryChargeTaka: orders.deliveryChargeTaka, paymentMethod: orders.paymentMethod, status: orders.status, createdAt: orders.createdAt })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.orderNumber, orderNumberValue)))
    .limit(1);
  if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
  return order;
}

export async function getCustomerOrderDetail(userId: number, orderNumberValue: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Order details are temporarily unavailable." });
  const [order] = await db.select().from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.orderNumber, orderNumberValue)))
    .limit(1);
  if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
  const [items, paymentRows, statusHistory] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(payments).where(eq(payments.orderId, order.id)).limit(1),
    db.select({ id: orderStatusHistory.id, nextStatus: orderStatusHistory.nextStatus, adminNote: orderStatusHistory.adminNote, createdAt: orderStatusHistory.createdAt })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(asc(orderStatusHistory.createdAt)),
  ]);
  return { ...order, items, payment: paymentRows[0] ?? null, statusHistory };
}

export async function listCustomerOrders(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Order history is temporarily unavailable." });
  const customerOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  if (customerOrders.length === 0) return [];
  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, customerOrders.map((order) => order.id)));
  return customerOrders.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) }));
}
