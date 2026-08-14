import { TRPCError } from "@trpc/server";

export function assertCartStock(isInStock: boolean, stockQuantity: number, requestedQuantity: number) {
  if (!isInStock || stockQuantity < 1) throw new TRPCError({ code: "BAD_REQUEST", message: "This product is out of stock." });
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > stockQuantity) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Requested quantity exceeds available stock." });
  }
}

export function nextCartQuantity(existingQuantity: number, addedQuantity: number, stockQuantity: number, isInStock: boolean) {
  const next = existingQuantity + addedQuantity;
  assertCartStock(isInStock, stockQuantity, next);
  return next;
}

export function shouldRemoveCartItem(quantity: number) {
  return quantity === 0;
}

export function mergedQuantities(current: Array<{ productId: number; quantity: number }>, guest: Array<{ productId: number; quantity: number }>) {
  const quantities = new Map<number, number>();
  [...current, ...guest].forEach((item) => quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity));
  return Array.from(quantities, ([productId, quantity]) => ({ productId, quantity }));
}
