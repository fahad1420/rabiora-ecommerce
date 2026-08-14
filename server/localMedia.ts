import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { TRPCError } from "@trpc/server";

export function getLocalImagesRoot() {
  return path.resolve(process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads", "images"));
}

function getProductRoot() {
  return path.join(getLocalImagesRoot(), "products");
}
const allowedExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function safeStem(fileName: string) {
  const stem = path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
  return stem || "product-image";
}

export async function saveLocalProductImage(productId: number, bytes: Buffer, mimeType: string, fileName: string) {
  const extension = allowedExtensions[mimeType];
  if (!extension) throw new TRPCError({ code: "BAD_REQUEST", message: "Use a JPEG, PNG, or WebP image." });
  const fileNameWithId = `${safeStem(fileName)}-${crypto.randomUUID().slice(0, 12)}${extension}`;
  const directory = path.join(getProductRoot(), String(productId));
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, fileNameWithId), bytes);
  const storageKey = `products/${productId}/${fileNameWithId}`;
  return { key: storageKey, url: `/uploads/images/${storageKey}` };
}

export async function removeLocalProductImage(storageKey: string) {
  if (!storageKey.startsWith("products/")) return;
  const normalized = path.posix.normalize(storageKey).replace(/^\.\.\//, "");
  if (normalized !== storageKey || normalized.includes("..")) return;
  const productRoot = getProductRoot();
  const absolutePath = path.resolve(getLocalImagesRoot(), normalized);
  if (!absolutePath.startsWith(productRoot)) return;
  await fs.unlink(absolutePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
