import { v2 as cloudinary } from "cloudinary";
import path from "node:path";
import { TRPCError } from "@trpc/server";
import { saveLocalProductImage, removeLocalProductImage } from "./localMedia";

export interface StorageUploadResult {
  key: string;
  url: string;
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

export function getCloudinaryConfig(): boolean {
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  if (cloudinaryUrl) {
    try {
      const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
      if (match) {
        cloudinary.config({
          api_key: match[1],
          api_secret: match[2],
          cloud_name: match[3],
          secure: true,
        });
        return true;
      }
    } catch {
      // Fallback
    }
  }

  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME)?.trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY)?.trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET)?.trim();

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }
  return false;
}

async function uploadToCloudinary(
  bytes: Buffer,
  mimeType: string,
  fileName: string,
  productId: number | string
): Promise<StorageUploadResult> {
  const base64Data = `data:${mimeType};base64,${bytes.toString("base64")}`;
  const publicId = `${safeStem(fileName)}_${Date.now().toString(36)}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Data,
      {
        folder: "rabiora/products",
        public_id: publicId,
        resource_type: "image",
        tags: [`product_${productId}`, "rabiora_catalogue"],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        resolve({
          key: result.public_id,
          url: result.secure_url,
        });
      }
    );
  });
}

export async function saveProductImage(
  productId: number | string,
  bytes: Buffer,
  mimeType: string,
  fileName: string
): Promise<StorageUploadResult> {
  const extension = allowedExtensions[mimeType];
  if (!extension) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Use a JPEG, PNG, or WebP image.",
    });
  }

  // 1. Cloudinary in production or whenever configured
  const hasCloudinary = getCloudinaryConfig();
  if (hasCloudinary) {
    try {
      return await uploadToCloudinary(bytes, mimeType, fileName, productId);
    } catch (error) {
      console.error("[Storage] Cloudinary upload failed:", error);
      if (process.env.NODE_ENV === "production") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload image to Cloudinary storage.",
        });
      }
    }
  }

  // 2. Fallback to local storage for local development
  return saveLocalProductImage(typeof productId === "number" ? productId : 1, bytes, mimeType, fileName);
}

export async function removeProductImage(storageKey: string): Promise<void> {
  if (!storageKey) return;

  const hasCloudinary = getCloudinaryConfig();
  if (
    hasCloudinary &&
    (storageKey.startsWith("rabiora/") || (!storageKey.startsWith("/uploads/") && !storageKey.startsWith("products/")))
  ) {
    try {
      await cloudinary.uploader.destroy(storageKey, { resource_type: "image" });
      return;
    } catch (error) {
      console.error("[Storage] Failed to delete from Cloudinary:", error);
    }
  }

  // Local filesystem cleanup for local dev keys
  return removeLocalProductImage(storageKey);
}
