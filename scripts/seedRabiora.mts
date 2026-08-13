import fs from "node:fs";
import vm from "node:vm";
import { eq } from "drizzle-orm";
import { categories, productImages, products } from "../drizzle/schema";
import { getDb } from "../server/db";

type LegacyProduct = {
  id: number;
  name: string;
  price: number;
  oldPrice: number;
  discount: number;
  cover: string;
  gallery: string[];
  category: string;
  fabric: string;
  color: string;
  stock: boolean;
  featured: boolean;
  details: string;
};

const sourcePath = process.env.RABIORA_LEGACY_CATALOGUE_PATH ?? "/home/ubuntu/rabiora_review/Rabiora/data/product.js";
const uploadLogPath = process.env.RABIORA_ASSET_UPLOAD_LOG_PATH ?? "/home/ubuntu/rabiora_asset_uploads.txt";

function slugify(value: string, suffix: string | number) {
  const slug = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${slug || "rabiora"}-${suffix}`;
}

function loadLegacyProducts(): LegacyProduct[] {
  const source = fs.readFileSync(sourcePath, "utf8");
  const loaded = vm.runInNewContext(`${source}\nproducts`, Object.create(null)) as LegacyProduct[];
  if (!Array.isArray(loaded) || loaded.length !== 24) throw new Error("Expected exactly 24 products in the approved Rabiora catalogue.");
  return loaded;
}

function loadStorageUrls() {
  const uploadLog = fs.readFileSync(uploadLogPath, "utf8");
  const entries = [...uploadLog.matchAll(/Uploading file \(webdev private\): .*\/([^/\n]+) \(size: \d+ bytes\)\nFile uploaded successfully!\nStorage Path: (\/manus-storage\/[^\n]+)/g)];
  return new Map(entries.map(([, fileName, storageUrl]) => [fileName, storageUrl]));
}

async function seed() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is required to seed the Rabiora catalogue.");
  const storageUrls = loadStorageUrls();
  const missingReferences: string[] = [];

  await db.transaction(async (tx) => {
    for (const item of loadLegacyProducts()) {
      const categorySlug = slugify(item.category, "category");
      await tx.insert(categories).values({ name: item.category, slug: categorySlug }).onDuplicateKeyUpdate({ set: { name: item.category } });
      const [category] = await tx.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
      if (!category) throw new Error(`Category upsert failed for ${item.category}.`);

      const productValues = {
        legacyId: item.id,
        categoryId: category.id,
        name: item.name,
        slug: slugify(item.name, item.id),
        sku: `RAB-${String(item.id).padStart(3, "0")}`,
        details: item.details,
        fabric: item.fabric,
        color: item.color,
        priceTaka: item.price,
        oldPriceTaka: item.oldPrice,
        discountPercent: item.discount,
        stockQuantity: item.stock ? 10 : 0,
        isInStock: item.stock,
        featured: item.featured,
      };
      await tx.insert(products).values(productValues).onDuplicateKeyUpdate({ set: productValues });
      const [product] = await tx.select().from(products).where(eq(products.legacyId, item.id)).limit(1);
      if (!product) throw new Error(`Product upsert failed for legacy ID ${item.id}.`);

      await tx.delete(productImages).where(eq(productImages.productId, product.id));
      const imagePaths = [item.cover, ...item.gallery];
      const imageRows = imagePaths.flatMap((sourceImagePath, position) => {
        const fileName = sourceImagePath.split("/").pop()!;
        const storageUrl = storageUrls.get(fileName);
        if (!storageUrl) {
          missingReferences.push(sourceImagePath);
          return [];
        }
        return [{
          productId: product.id,
          storageKey: storageUrl.replace("/manus-storage/", ""),
          storageUrl,
          altText: `${item.name} — Rabiora`,
          position,
          isCover: position === 0,
        }];
      });
      if (!imageRows.some((image) => image.isCover)) throw new Error(`Missing supplied cover image for product ${item.id}.`);
      await tx.insert(productImages).values(imageRows);
    }
  });

  console.log(JSON.stringify({ productsImported: 24, missingSourceImageReferences: [...new Set(missingReferences)].sort() }, null, 2));
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
