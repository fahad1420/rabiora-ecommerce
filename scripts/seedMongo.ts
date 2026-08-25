import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectMongo } from "../server/config/db";
import { CategoryModel, ProductModel, UserModel } from "../server/models";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface RawProduct {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  discount: number;
  cover: string;
  gallery: string[];
  category: string;
  fabric: string;
  color: string;
  stock: boolean;
  featured: boolean;
  details: string;
}

interface ImageMapping {
  oldPath: string;
  newPath: string;
  key: string;
  fileName: string;
  bytes: number;
}

async function seed() {
  console.log("[Seed] Connecting to MongoDB...");
  await connectMongo();

  // Load migration mappings
  const mapPath = path.resolve(process.cwd(), "data", "image-migration-map.json");
  let mappings: ImageMapping[] = [];
  if (fs.existsSync(mapPath)) {
    const data = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
    mappings = data.mappings || [];
  }

  const findImageByBase = (imgRef: string): string => {
    const base = path.basename(imgRef, path.extname(imgRef)); // e.g. "dress1" or "dress1_1"
    const match = mappings.find((m) => {
      const stem = m.fileName.replace(/\.[^/.]+$/, "");
      return stem === base || stem.startsWith(`${base}_`);
    });
    if (match) {
      return match.newPath;
    }
    return `/uploads/images/products/${path.basename(imgRef)}`;
  };

  // Load raw product catalogue
  const productFilePath = path.resolve(process.cwd(), "data", "product.js");
  let rawProducts: RawProduct[] = [];

  if (fs.existsSync(productFilePath)) {
    const code = fs.readFileSync(productFilePath, "utf-8");
    // Extract array definition safely
    const cleanCode = code.replace(/const products\s*=/, "return ");
    const fn = new Function(cleanCode);
    rawProducts = fn();
  }

  console.log(`[Seed] Loaded ${rawProducts.length} products from data/product.js`);

  // Distinct categories
  const categoryNames = Array.from(
    new Set(rawProducts.map((p) => p.category.trim()).filter(Boolean))
  );

  if (categoryNames.length === 0) {
    categoryNames.push("Pakistani Three Piece", "Cotton Collection", "Lawn Collection");
  }

  console.log("[Seed] Seeding categories:", categoryNames);
  const categoryMap = new Map<string, mongoose.Types.ObjectId>();

  for (const name of categoryNames) {
    const slug = slugify(name);
    const doc = await CategoryModel.findOneAndUpdate(
      { slug },
      { $set: { name, slug } },
      { upsert: true, new: true }
    );
    categoryMap.set(name, doc._id as mongoose.Types.ObjectId);
    categoryMap.set(slug, doc._id as mongoose.Types.ObjectId);
  }

  console.log("[Seed] Seeding 24 products with migrated images...");

  for (const raw of rawProducts) {
    const categoryName = raw.category.trim();
    const categorySlug = slugify(categoryName);
    const categoryId = categoryMap.get(categoryName) || categoryMap.get(categorySlug);

    const slug = `${slugify(raw.name)}-${raw.id}`;
    const coverUrl = findImageByBase(raw.cover);

    const images = [
      {
        storageKey: `products/${path.basename(coverUrl)}`,
        storageUrl: coverUrl,
        altText: `${raw.name} Cover`,
        position: 0,
        isCover: true,
      },
    ];

    (raw.gallery || []).forEach((galImg, idx) => {
      const galUrl = findImageByBase(galImg);
      images.push({
        storageKey: `products/${path.basename(galUrl)}`,
        storageUrl: galUrl,
        altText: `${raw.name} View ${idx + 1}`,
        position: idx + 1,
        isCover: false,
      });
    });

    const stockQuantity = raw.stock ? 15 : 0;

    await ProductModel.findOneAndUpdate(
      { legacyId: raw.id },
      {
        $set: {
          legacyId: raw.id,
          categoryId,
          categoryName,
          categorySlug,
          name: raw.name.trim(),
          slug,
          sku: `RAB-D${raw.id}`,
          details: raw.details.trim(),
          fabric: raw.fabric.trim(),
          color: raw.color.trim(),
          priceTaka: raw.price,
          oldPriceTaka: raw.oldPrice || undefined,
          discountPercent: raw.discount || 0,
          stockQuantity,
          isInStock: raw.stock,
          featured: raw.featured || false,
          images,
        },
      },
      { upsert: true, new: true }
    );
  }

  console.log("[Seed] Seeding default admin user...");
  const adminPasswordHash = await bcrypt.hash("admin12345", 12);
  await UserModel.findOneAndUpdate(
    { openId: "admin:default" },
    {
      $set: {
        openId: "admin:default",
        name: "Rabiora Admin",
        phone: "+8801700000000",
        email: "admin@rabiora.com",
        passwordHash: adminPasswordHash,
        loginMethod: "password",
        role: "admin",
        lastSignedIn: new Date(),
      },
    },
    { upsert: true }
  );

  console.log("[Seed] Successfully seeded all 24 products, categories, and admin account!");
}

if (process.argv[1] && process.argv[1].includes("seedMongo")) {
  seed()
    .then(() => {
      console.log("[Seed] Completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Seed] Failed:", err);
      process.exit(1);
    });
}

export { seed };
