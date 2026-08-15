import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import mysql from "mysql2/promise";

type SourceProduct = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  cover: string;
  gallery?: string[];
  category: string;
  fabric: string;
  color: string;
  stock: boolean | string;
  featured?: boolean;
  details: string;
};

type MigrationMap = {
  mappings: Array<{
    oldPath: string;
    newPath: string;
    key: string;
    fileName: string;
  }>;
  productImageCount: number;
};

function loadProducts(filePath: string): SourceProduct[] {
  const source = fs.readFileSync(filePath, "utf8");
  const context: Record<string, unknown> = {};
  vm.createContext(context);
  vm.runInContext(`${source}\n;globalThis.__rabioraProducts = products;`, context);

  const products = context.__rabioraProducts;

  if (!Array.isArray(products)) {
    throw new Error("Could not load products from data/product.js");
  }

  return products as SourceProduct[];
}

function normalizeSourceImageName(name: string) {
  return path.basename(name).replace(/_[0-9a-f]{8}(?=\.[^.]+$)/i, "");
}

function slugify(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }

  const root = process.cwd();
  const productFile = path.join(root, "data", "product.js");
  const mapFile = path.join(root, "data", "image-migration-map.json");

  if (!fs.existsSync(productFile)) {
    throw new Error(`Missing ${productFile}`);
  }

  if (!fs.existsSync(mapFile)) {
    throw new Error(`Missing ${mapFile}`);
  }

  const products = loadProducts(productFile);
  const migration = JSON.parse(
    fs.readFileSync(mapFile, "utf8"),
  ) as MigrationMap;

  if (products.length !== 24) {
    throw new Error(
      `Expected 24 source products, found ${products.length}.`,
    );
  }

  const imageMap = new Map<string, string>();

  for (const item of migration.mappings) {
    if (!item.oldPath.startsWith("/manus-storage/")) continue;

    imageMap.set(
      normalizeSourceImageName(item.oldPath),
      item.newPath,
    );
  }

  const allImageSources = products.flatMap((product) => [
    product.cover,
    ...(product.gallery ?? []),
  ]);

  const missing = allImageSources.filter(
    (source) => !imageMap.has(path.basename(source)),
  );

  if (missing.length > 0) {
    console.warn(
      `Warning: ${missing.length} source image(s) have no local mapping and will be skipped:`,
    );

    for (const source of missing) {
      console.warn(`  - ${source}`);
    }
  }

  const mappedImageSources = allImageSources.filter((source) =>
    imageMap.has(path.basename(source)),
  );

  if (mappedImageSources.length !== migration.productImageCount) {
    throw new Error(
      `Image count mismatch: mapped source references=${mappedImageSources.length}, ` +
        `migration map says=${migration.productImageCount}.`,
    );
  }

  const featuredCount = products.filter(
    (product) => product.featured === true,
  ).length;

  if (featuredCount !== 9) {
    throw new Error(
      `Expected 9 featured products, found ${featuredCount}.`,
    );
  }

  const url = new URL(process.env.DATABASE_URL);

  const connection = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\/+/, ""),
  });

  try {
    await connection.beginTransaction();

    const [[productCount]] = await connection.query<any[]>(
      "SELECT COUNT(*) AS count FROM products",
    );

    const [[imageCount]] = await connection.query<any[]>(
      "SELECT COUNT(*) AS count FROM product_images",
    );

    const [[categoryCount]] = await connection.query<any[]>(
      "SELECT COUNT(*) AS count FROM categories",
    );

    if (
      Number(productCount.count) !== 0 ||
      Number(imageCount.count) !== 0 ||
      Number(categoryCount.count) !== 0
    ) {
      throw new Error(
        "Import aborted: categories/products/product_images are not empty. " +
          "This script refuses to overwrite existing catalogue data.",
      );
    }

    const categoryNames = [
      ...new Set(products.map((product) => product.category)),
    ];

    const categoryIds = new Map<string, number>();

    for (const categoryName of categoryNames) {
      const categorySlug = slugify(categoryName);

      const [result] = await connection.execute<any>(
        `INSERT INTO categories (name, slug)
         VALUES (?, ?)`,
        [categoryName, categorySlug],
      );

      categoryIds.set(
        categoryName,
        Number(result.insertId),
      );
    }

    let importedImageCount = 0;
    let skippedImageCount = 0;

    for (const product of products) {
      const categoryId = categoryIds.get(product.category);

      if (!categoryId) {
        throw new Error(
          `Category not found: ${product.category}`,
        );
      }

      const slug = `${slugify(product.name)}-${product.id}`;
      const stockQuantity = product.stock ? 1 : 0;

      const [result] = await connection.execute<any>(
        `INSERT INTO products
          (legacyId, categoryId, name, slug, sku, details, fabric, color,
           priceTaka, oldPriceTaka, discountPercent, stockQuantity,
           isInStock, featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          categoryId,
          product.name,
          slug,
          null,
          product.details,
          product.fabric,
          product.color,
          product.price,
          product.oldPrice ?? null,
          product.discount ?? 0,
          stockQuantity,
          Boolean(product.stock),
          Boolean(product.featured),
        ],
      );

      const productId = Number(result.insertId);

      const sources = [
        product.cover,
        ...(product.gallery ?? []),
      ];

      for (let position = 0; position < sources.length; position++) {
        const source = sources[position];

        const storageUrl = imageMap.get(
          path.basename(source),
        );

        if (!storageUrl) {
          console.warn(
            `Skipping missing image for ${product.name}: ${source}`,
          );
          skippedImageCount++;
          continue;
        }

        const storageKey = storageUrl.replace(
          "/uploads/images/products/",
          "",
        );

        const absoluteFile = path.join(
          root,
          "uploads",
          "images",
          "products",
          storageKey,
        );

        if (!fs.existsSync(absoluteFile)) {
          throw new Error(
            `Physical image file missing: ${absoluteFile}`,
          );
        }

        await connection.execute(
          `INSERT INTO product_images
            (productId, storageKey, storageUrl, altText, position, isCover)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            productId,
            storageKey,
            storageUrl,
            `${product.name} - image ${position + 1}`,
            position,
            position === 0,
          ],
        );

        importedImageCount++;
      }
    }

    await connection.commit();

    console.log("========================================");
    console.log("Rabiora catalogue import completed");
    console.log("========================================");
    console.log(`Products:       ${products.length}`);
    console.log(`Featured:       ${featuredCount}`);
    console.log(`Categories:     ${categoryNames.length}`);
    console.log(`Image records:  ${importedImageCount}`);
    console.log(`Skipped images: ${skippedImageCount}`);
    console.log(
      "Storage:        local /uploads/images/products/",
    );
    console.log("========================================");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("\nIMPORT FAILED:");
  console.error(
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});