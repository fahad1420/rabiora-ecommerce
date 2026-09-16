import { TRPCError } from "@trpc/server";
import { Types } from "mongoose";
import { connectMongo } from "./config/db";
import { FlashSaleModel, ProductModel, findProductQuery } from "./models";

export async function getPublicFlashSale() {
  await connectMongo();
  let flashSale = await FlashSaleModel.findOne({ key: "default" }).populate("productIds").lean();

  // If no default flash sale exists, or if productIds is empty / endTime is missing, ensure active initial data
  if (!flashSale) {
    // Pick first 4 existing products as initial flash sale items
    const sampleProducts = await ProductModel.find().limit(4).lean();
    const defaultEndTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

    const defaultSale = await FlashSaleModel.create({
      key: "default",
      campaignName: "Rabiora Flash Sale",
      title: "⚡ Exclusive Flash Sale — Up to 20% OFF on Selected Luxury Pieces",
      subtitle: "Limited time offer on handcrafted Pakistani Lawn & Silk Three-Piece sets",
      badgeText: "⚡ FLASH SALE DEAL",
      isActive: true,
      endTime: defaultEndTime,
      ctaText: "Shop Flash Sale",
      ctaLink: "/#flash-sale",
      productIds: sampleProducts.map((p) => p._id),
    });
    flashSale = defaultSale.toObject();
  } else {
    // If productIds is empty, seed with real products so the section is populated
    if (!flashSale.productIds || flashSale.productIds.length === 0) {
      const sampleProducts = await ProductModel.find().limit(4).lean();
      if (sampleProducts.length > 0) {
        await FlashSaleModel.findOneAndUpdate(
          { key: "default" },
          { $set: { productIds: sampleProducts.map((p) => p._id) } }
        );
        flashSale.productIds = sampleProducts as any;
      }
    }

    // If endTime is missing or in the past while isActive is true, set a default 48h active timer
    const now = new Date();
    if (!flashSale.endTime || new Date(flashSale.endTime) < now) {
      const defaultEndTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await FlashSaleModel.findOneAndUpdate(
        { key: "default" },
        { $set: { endTime: defaultEndTime } }
      );
      flashSale.endTime = defaultEndTime;
    }
  }

  // Check start and end time expiration if configured
  const now = new Date();
  let isExpired = false;
  if (flashSale.endTime && new Date(flashSale.endTime) < now) {
    isExpired = true;
  }
  if (flashSale.startTime && new Date(flashSale.startTime) > now) {
    isExpired = true;
  }

  let rawProductList: any[] = flashSale.productIds || [];
  const needsManualQuery = rawProductList.some((p) => p && (typeof p === "string" || !p.name));
  if (needsManualQuery && rawProductList.length > 0) {
    const ids = rawProductList.map((p) => (typeof p === "object" && p._id ? p._id : p));
    const foundProducts = await ProductModel.find({ _id: { $in: ids } }).lean();
    const productMap = new Map(foundProducts.map((p) => [p._id.toString(), p]));
    rawProductList = ids.map((id) => productMap.get(id.toString())).filter(Boolean);
  }

  const productsList = rawProductList.map((p: any) => {
    if (!p || typeof p !== "object" || !p.name) return null;
    const coverImage = (p.images || []).find((img: any) => img.isCover) || (p.images || [])[0];
    return {
      id: p._id.toString(),
      legacyId: p.legacyId,
      name: p.name,
      slug: p.slug,
      priceTaka: p.priceTaka,
      oldPriceTaka: p.oldPriceTaka || Math.round(p.priceTaka * 1.2),
      discountPercent: p.discountPercent || 15,
      categoryName: p.categoryName || "Pakistani Three Piece",
      details: p.details || "",
      fabric: p.fabric || "",
      isInStock: p.isInStock !== false,
      stockQuantity: p.stockQuantity ?? 0,
      imageUrl: coverImage ? coverImage.storageUrl : "",
      images: (p.images || []).map((img: any) => ({
        storageUrl: img.storageUrl,
        altText: img.altText || p.name,
        isCover: Boolean(img.isCover),
      })),
    };
  }).filter(Boolean);

  return {
    id: flashSale._id.toString(),
    campaignName: flashSale.campaignName,
    title: flashSale.title,
    subtitle: flashSale.subtitle || "",
    badgeText: flashSale.badgeText || "⚡ FLASH SALE DEAL",
    isActive: flashSale.isActive && !isExpired,
    isScheduleActive: flashSale.isActive,
    startTime: flashSale.startTime ? new Date(flashSale.startTime).toISOString() : null,
    endTime: flashSale.endTime ? new Date(flashSale.endTime).toISOString() : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    ctaText: flashSale.ctaText || "Shop Flash Sale",
    ctaLink: flashSale.ctaLink || "/#flash-sale",
    products: productsList,
    productCount: productsList.length,
  };
}

export async function getAdminFlashSale() {
  await connectMongo();
  let flashSale: any = await FlashSaleModel.findOne({ key: "default" }).populate("productIds").lean();

  if (!flashSale) {
    const sampleProducts = await ProductModel.find().limit(4).lean();
    const defaultEndTime = new Date(Date.now() + 48 * 60 * 60 * 1000);

    flashSale = await FlashSaleModel.create({
      key: "default",
      campaignName: "Rabiora Flash Sale",
      title: "⚡ Exclusive Flash Sale — Up to 20% OFF on Selected Luxury Pieces",
      subtitle: "Limited time offer on handcrafted Pakistani Lawn & Silk Three-Piece sets",
      badgeText: "⚡ FLASH SALE DEAL",
      isActive: true,
      endTime: defaultEndTime,
      ctaText: "Shop Flash Sale",
      ctaLink: "/#flash-sale",
      productIds: sampleProducts.map((p) => p._id),
    });
    flashSale = flashSale.toObject();
  }

  let rawProductList: any[] = flashSale.productIds || [];
  const needsManualQuery = rawProductList.some((p) => p && (typeof p === "string" || !p.name));
  if (needsManualQuery && rawProductList.length > 0) {
    const ids = rawProductList.map((p) => (typeof p === "object" && p._id ? p._id : p));
    const foundProducts = await ProductModel.find({ _id: { $in: ids } }).lean();
    const productMap = new Map(foundProducts.map((p) => [p._id.toString(), p]));
    rawProductList = ids.map((id) => productMap.get(id.toString())).filter(Boolean);
  }

  const attachedProducts = rawProductList.map((p: any) => {
    if (!p || typeof p !== "object" || !p.name) return null;
    const coverImage = (p.images || []).find((img: any) => img.isCover) || (p.images || [])[0];
    return {
      id: p._id.toString(),
      legacyId: p.legacyId,
      name: p.name,
      slug: p.slug,
      priceTaka: p.priceTaka,
      oldPriceTaka: p.oldPriceTaka,
      discountPercent: p.discountPercent,
      categoryName: p.categoryName || "Pakistani Three Piece",
      isInStock: p.isInStock !== false,
      stockQuantity: p.stockQuantity ?? 0,
      imageUrl: coverImage ? coverImage.storageUrl : "",
      images: (p.images || []).map((img: any) => ({
        storageUrl: img.storageUrl,
        altText: img.altText || p.name,
        isCover: Boolean(img.isCover),
      })),
    };
  }).filter(Boolean) as Array<{
    id: string;
    legacyId?: number;
    name: string;
    slug: string;
    priceTaka: number;
    oldPriceTaka?: number;
    discountPercent?: number;
    categoryName?: string;
    isInStock: boolean;
    stockQuantity: number;
    imageUrl: string;
    images: { storageUrl: string; altText: string; isCover: boolean }[];
  }>;

  return {
    id: flashSale._id.toString(),
    campaignName: flashSale.campaignName,
    title: flashSale.title,
    subtitle: flashSale.subtitle || "",
    badgeText: flashSale.badgeText || "⚡ FLASH SALE DEAL",
    isActive: flashSale.isActive,
    startTime: flashSale.startTime ? new Date(flashSale.startTime).toISOString() : "",
    endTime: flashSale.endTime ? new Date(flashSale.endTime).toISOString() : "",
    ctaText: flashSale.ctaText || "Shop Flash Sale",
    ctaLink: flashSale.ctaLink || "/#flash-sale",
    productIds: attachedProducts.map((p: { id: string }) => p.id),
    products: attachedProducts,
  };
}

export async function updateAdminFlashSale(input: {
  campaignName?: string;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  isActive?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  ctaText?: string;
  ctaLink?: string;
  productIds?: string[];
}) {
  await connectMongo();

  const updateFields: Record<string, any> = {};

  if (input.campaignName !== undefined) updateFields.campaignName = input.campaignName.trim();
  if (input.title !== undefined) updateFields.title = input.title.trim();
  if (input.subtitle !== undefined) updateFields.subtitle = input.subtitle.trim();
  if (input.badgeText !== undefined) updateFields.badgeText = input.badgeText.trim();
  if (input.isActive !== undefined) updateFields.isActive = input.isActive;
  if (input.startTime !== undefined) {
    updateFields.startTime = input.startTime ? new Date(input.startTime) : null;
  }
  if (input.endTime !== undefined) {
    updateFields.endTime = input.endTime ? new Date(input.endTime) : null;
  }
  if (input.ctaText !== undefined) updateFields.ctaText = input.ctaText.trim();
  if (input.ctaLink !== undefined) updateFields.ctaLink = input.ctaLink.trim();
  if (input.productIds !== undefined) {
    const validObjectIds = input.productIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    updateFields.productIds = validObjectIds;
  }

  await FlashSaleModel.findOneAndUpdate(
    { key: "default" },
    { $set: updateFields },
    { upsert: true, new: true }
  );

  return getAdminFlashSale();
}

export async function addProductToFlashSale(productId: string) {
  await connectMongo();
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
  }

  await FlashSaleModel.findOneAndUpdate(
    { key: "default" },
    { $addToSet: { productIds: product._id } },
    { upsert: true }
  );

  return getAdminFlashSale();
}

export async function removeProductFromFlashSale(productId: string) {
  await connectMongo();
  const product = await ProductModel.findOne(findProductQuery(productId));
  const targetId = product ? product._id : Types.ObjectId.isValid(productId) ? new Types.ObjectId(productId) : productId;

  await FlashSaleModel.findOneAndUpdate(
    { key: "default" },
    { $pull: { productIds: targetId } }
  );

  return getAdminFlashSale();
}
