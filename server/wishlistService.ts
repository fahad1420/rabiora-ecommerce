import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { productImages, products, wishlistItems } from "../drizzle/schema";
import { getDb } from "./db";

export async function getWishlist(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Wishlist is temporarily unavailable." });
  return db.select({
    productId: products.id,
    name: products.name,
    slug: products.slug,
    priceTaka: products.priceTaka,
    imageUrl: productImages.storageUrl,
  }).from(wishlistItems)
    .innerJoin(products, eq(wishlistItems.productId, products.id))
    .leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isCover, true)))
    .where(eq(wishlistItems.userId, userId));
}

export async function addWishlistItem(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Wishlist is temporarily unavailable." });
  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
  if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
  await db.insert(wishlistItems).values({ userId, productId }).onDuplicateKeyUpdate({ set: { productId } });
  return getWishlist(userId);
}

export async function removeWishlistItem(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Wishlist is temporarily unavailable." });
  await db.delete(wishlistItems).where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
  return getWishlist(userId);
}
