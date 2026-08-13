import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import { categories, productImages, products } from "../drizzle/schema";
import { getDb } from "./db";

export type CatalogueFilters = {
  query?: string;
  featured?: boolean;
  categorySlug?: string;
};

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Catalogue is temporarily unavailable." });
  return db;
}

function buildConditions(filters: CatalogueFilters) {
  const conditions = [];
  if (filters.featured !== undefined) conditions.push(eq(products.featured, filters.featured));
  if (filters.categorySlug) conditions.push(eq(categories.slug, filters.categorySlug));
  if (filters.query) {
    const term = `%${filters.query.trim()}%`;
    conditions.push(or(like(products.name, term), like(products.fabric, term), like(products.color, term)));
  }
  return conditions;
}

async function attachImages<T extends { id: number }>(db: Awaited<ReturnType<typeof requireDb>>, productRows: T[]) {
  if (productRows.length === 0) return [];
  const productIds = productRows.map((product) => product.id);
  const images = await db.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.position));
  return productRows.map((product) => ({ ...product, images: images.filter((image) => image.productId === product.id) }));
}

export async function listCatalogue(filters: CatalogueFilters = {}) {
  const db = await requireDb();
  const conditions = buildConditions(filters);
  const whereClause = conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : and(...conditions);
  const rows = await db
    .select({
      id: products.id,
      legacyId: products.legacyId,
      name: products.name,
      slug: products.slug,
      details: products.details,
      fabric: products.fabric,
      color: products.color,
      priceTaka: products.priceTaka,
      oldPriceTaka: products.oldPriceTaka,
      discountPercent: products.discountPercent,
      stockQuantity: products.stockQuantity,
      isInStock: products.isInStock,
      featured: products.featured,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause)
    .orderBy(desc(products.featured), asc(products.legacyId));
  return attachImages(db, rows);
}

export async function getCatalogueProduct(slug: string) {
  const db = await requireDb();
  const rows = await db
    .select({
      id: products.id,
      legacyId: products.legacyId,
      name: products.name,
      slug: products.slug,
      details: products.details,
      fabric: products.fabric,
      color: products.color,
      priceTaka: products.priceTaka,
      oldPriceTaka: products.oldPriceTaka,
      discountPercent: products.discountPercent,
      stockQuantity: products.stockQuantity,
      isInStock: products.isInStock,
      featured: products.featured,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  const [product] = await attachImages(db, rows);
  if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
  return product;
}
