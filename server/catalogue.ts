import { TRPCError } from "@trpc/server";
import { connectMongo } from "./config/db";
import { ProductModel, CategoryModel } from "./models";

export type CatalogueFilters = {
  query?: string;
  featured?: boolean;
  categorySlug?: string;
};

export async function listCatalogue(filters: CatalogueFilters = {}) {
  await connectMongo();

  const filterQuery: Record<string, unknown> = {};

  if (filters.featured !== undefined) {
    filterQuery.featured = filters.featured;
  }

  if (filters.categorySlug) {
    const category = await CategoryModel.findOne({ slug: filters.categorySlug });
    if (category) {
      filterQuery.categoryId = category._id;
    } else {
      filterQuery.categorySlug = filters.categorySlug;
    }
  }

  if (filters.query && filters.query.trim()) {
    const regex = new RegExp(filters.query.trim(), "i");
    filterQuery.$or = [
      { name: regex },
      { fabric: regex },
      { color: regex },
      { details: regex },
    ];
  }

  const products = await ProductModel.find(filterQuery)
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  return products.map((p) => ({
    id: p.legacyId ?? p._id.toString(),
    _id: p._id.toString(),
    legacyId: p.legacyId ?? 0,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    details: p.details,
    fabric: p.fabric,
    color: p.color,
    priceTaka: p.priceTaka,
    oldPriceTaka: p.oldPriceTaka,
    discountPercent: p.discountPercent,
    stockQuantity: p.stockQuantity,
    isInStock: p.isInStock,
    featured: p.featured,
    categoryName: p.categoryName || "",
    categorySlug: p.categorySlug || "",
    images: (p.images || []).map((img, idx) => ({
      id: idx + 1,
      productId: p.legacyId ?? 0,
      storageKey: img.storageKey,
      storageUrl: img.storageUrl,
      altText: img.altText,
      position: img.position,
      isCover: img.isCover,
    })),
  }));
}

export async function getCatalogueProduct(slug: string) {
  await connectMongo();

  let p = await ProductModel.findOne({ slug }).lean();
  if (!p && !isNaN(Number(slug))) {
    p = await ProductModel.findOne({ legacyId: Number(slug) }).lean();
  }
  if (!p && slug && slug.match(/^[0-9a-fA-F]{24}$/)) {
    p = await ProductModel.findById(slug).lean();
  }

  if (!p) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
  }

  return {
    id: p.legacyId ?? p._id.toString(),
    _id: p._id.toString(),
    legacyId: p.legacyId ?? 0,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    details: p.details,
    fabric: p.fabric,
    color: p.color,
    priceTaka: p.priceTaka,
    oldPriceTaka: p.oldPriceTaka,
    discountPercent: p.discountPercent,
    stockQuantity: p.stockQuantity,
    isInStock: p.isInStock,
    featured: p.featured,
    categoryName: p.categoryName || "",
    categorySlug: p.categorySlug || "",
    images: (p.images || []).map((img, idx) => ({
      id: idx + 1,
      productId: p.legacyId ?? 0,
      storageKey: img.storageKey,
      storageUrl: img.storageUrl,
      altText: img.altText,
      position: img.position,
      isCover: img.isCover,
    })),
  };
}
