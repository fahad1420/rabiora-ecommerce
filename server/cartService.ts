import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { cartItems, carts, productImages, products, users } from "../drizzle/schema";
import { getDb } from "./db";
import { getCustomerFromRequest, type RabioraCustomer } from "./customerSession";
import type { Request } from "express";

export type CartIdentity = { userId?: number; anonymousToken?: string };

function unavailable() {
  return new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Cart is temporarily unavailable." });
}

export async function resolveCartIdentity(req: Request, manuscriptUser: { id: number; openId: string; name: string | null; email: string | null; phone: string | null; role: "user" | "admin" } | null, anonymousToken?: string): Promise<CartIdentity> {
  if (manuscriptUser) return { userId: manuscriptUser.id };
  const customer = await getCustomerFromRequest(req);
  if (customer) return { userId: customer.id };
  if (!anonymousToken || !/^[a-zA-Z0-9_-]{20,128}$/.test(anonymousToken)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A valid guest-cart token is required." });
  }
  return { anonymousToken };
}

async function getOrCreateCart(identity: CartIdentity) {
  const db = await getDb();
  if (!db) throw unavailable();
  const condition = identity.userId ? eq(carts.userId, identity.userId) : eq(carts.anonymousToken, identity.anonymousToken!);
  const [existing] = await db.select().from(carts).where(condition).limit(1);
  if (existing) return { db, cart: existing };
  await db.insert(carts).values(identity.userId ? { userId: identity.userId } : { anonymousToken: identity.anonymousToken! });
  const [created] = await db.select().from(carts).where(condition).limit(1);
  if (!created) throw unavailable();
  return { db, cart: created };
}

export async function getCart(identity: CartIdentity) {
  const { db, cart } = await getOrCreateCart(identity);
  const rows = await db.select({
    itemId: cartItems.id,
    quantity: cartItems.quantity,
    productId: products.id,
    slug: products.slug,
    name: products.name,
    priceTaka: products.priceTaka,
    stockQuantity: products.stockQuantity,
    isInStock: products.isInStock,
    imageUrl: productImages.storageUrl,
  }).from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isCover, true)))
    .where(eq(cartItems.cartId, cart.id));
  const items = rows.map((item) => ({ ...item, lineTotalTaka: item.priceTaka * item.quantity }));
  return { id: cart.id, items, subtotalTaka: items.reduce((sum, item) => sum + item.lineTotalTaka, 0) };
}

export async function addCartItem(identity: CartIdentity, productId: number, requestedQuantity = 1) {
  const { db, cart } = await getOrCreateCart(identity);
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product || !product.isInStock || product.stockQuantity < 1) throw new TRPCError({ code: "BAD_REQUEST", message: "This product is out of stock." });
  const [existing] = await db.select().from(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId))).limit(1);
  const nextQuantity = (existing?.quantity ?? 0) + requestedQuantity;
  if (nextQuantity > product.stockQuantity) throw new TRPCError({ code: "BAD_REQUEST", message: "Requested quantity exceeds available stock." });
  if (existing) await db.update(cartItems).set({ quantity: nextQuantity }).where(eq(cartItems.id, existing.id));
  else await db.insert(cartItems).values({ cartId: cart.id, productId, quantity: requestedQuantity });
  return getCart(identity);
}

export async function updateCartItem(identity: CartIdentity, productId: number, quantity: number) {
  const { db, cart } = await getOrCreateCart(identity);
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product || !product.isInStock || quantity > product.stockQuantity) throw new TRPCError({ code: "BAD_REQUEST", message: "Requested quantity exceeds available stock." });
  const condition = and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId));
  if (quantity === 0) await db.delete(cartItems).where(condition);
  else await db.update(cartItems).set({ quantity }).where(condition);
  return getCart(identity);
}

export async function mergeGuestCart(userId: number, anonymousToken?: string) {
  if (!anonymousToken || !/^[a-zA-Z0-9_-]{20,128}$/.test(anonymousToken)) return;
  const db = await getDb();
  if (!db) throw unavailable();
  const [guestCart] = await db.select().from(carts).where(eq(carts.anonymousToken, anonymousToken)).limit(1);
  if (!guestCart) return;
  const userIdentity = { userId };
  const userCart = await getOrCreateCart(userIdentity);
  const guestItems = await db.select().from(cartItems).where(eq(cartItems.cartId, guestCart.id));
  for (const item of guestItems) {
    try { await addCartItem(userIdentity, item.productId, item.quantity); } catch { /* Skip unavailable items rather than lose the remaining guest cart. */ }
  }
  await db.delete(carts).where(eq(carts.id, guestCart.id));
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, userCart.cart.id));
}
