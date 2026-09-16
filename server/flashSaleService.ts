import { TRPCError } from "@trpc/server";
import { connectMongo } from "./config/db";
import { FlashSaleModel, ProductModel, findProductQuery } from "./models";

export async function getPublicFlashSale() {
  await connectMongo();
  let flashSale = await FlashSaleModel.findOne({ key: "default" }).populate("productIds").lean();

  if (!flashSale) {
    const defaultSale = await FlashSaleModel.create({
      key: "default",
      campaignName: "Rabiora Flash Sale",
      title: "⚡ Exclusive Flash Sale — Up to 20% OFF on Selected Luxury Pieces",
      subtitle: "Limited time offer on handcrafted Pakistani Lawn & Silk Three-Piece sets",
      badgeText: "⚡ FLASH SALE DEAL",
      isActive: true,
      ctaText: "Shop Flash Sale",
      ctaLink: "/#products",
      productIds: [],
    });
    flashSale = defaultSale.toObject();
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

  const productsList = (flashSale.productIds || []).map((p: any) => {
    if (!p || typeof p !== "object") return null;
    const coverImage = (p.images || []).find((img: any) => img.isCover) || (p.images || [])[0];
    return {
      id: p._id.toString(),
      legacyId: p.legacyId,
      name: p.name,
      slug: p.slug,
      priceTaka: p.priceTaka,
      oldPriceTaka: p.oldPriceTaka,
      discountPercent: p.discountPercent,
      isInStock: p.isInStock !== false,
      stockQuantity: p.stockQuantity ?? 0,
      imageUrl: coverImage ? coverImage.storageUrl : "",
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
    endTime: flashSale.endTime ? new Date(flashSale.endTime).toISOString() : null,
    ctaText: flashSale.ctaText || "Shop Flash Sale",
    ctaLink: flashSale.ctaLink || "/#products",
    products: productsList,
    productCount: productsList.length,
  };
}

export async function getAdminFlashSale() {
  await connectMongo();
  let flashSale: any = await FlashSaleModel.findOne({ key: "default" }).populate("productIds").lean();

  if (!flashSale) {
    flashSale = await FlashSaleModel.create({
      key: "default",
      campaignName: "Rabiora Flash Sale",
      title: "⚡ Exclusive Flash Sale — Up to 20% OFF on Selected Luxury Pieces",
      subtitle: "Limited time offer on handcrafted Pakistani Lawn & Silk Three-Piece sets",
      badgeText: "⚡ FLASH SALE DEAL",
      isActive: true,
      ctaText: "Shop Flash Sale",
      ctaLink: "/#products",
      productIds: [],
    });
    flashSale = flashSale.toObject();
  }

  const attachedProducts = (flashSale.productIds || []).map((p: any) => {
    if (!p || typeof p !== "object") return null;
    const coverImage = (p.images || []).find((img: any) => img.isCover) || (p.images || [])[0];
    return {
      id: p._id.toString(),
      legacyId: p.legacyId,
      name: p.name,
      slug: p.slug,
      priceTaka: p.priceTaka,
      oldPriceTaka: p.oldPriceTaka,
      discountPercent: p.discountPercent,
      isInStock: p.isInStock !== false,
      stockQuantity: p.stockQuantity ?? 0,
      imageUrl: coverImage ? coverImage.storageUrl : "",
    };
  }).filter(Boolean) as Array<{
    id: string;
    legacyId?: number;
    name: string;
    slug: string;
    priceTaka: number;
    oldPriceTaka?: number;
    discountPercent?: number;
    isInStock: boolean;
    stockQuantity: number;
    imageUrl: string;
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
    ctaLink: flashSale.ctaLink || "/#products",
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
    updateFields.productIds = input.productIds;
  }

  const updated = await FlashSaleModel.findOneAndUpdate(
    { key: "default" },
    { $set: updateFields },
    { upsert: true, new: true }
  ).populate("productIds").lean();

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
  if (product) {
    await FlashSaleModel.findOneAndUpdate(
      { key: "default" },
      { $pull: { productIds: product._id } }
    );
  } else {
    // Attempt removal by raw string id
    await FlashSaleModel.findOneAndUpdate(
      { key: "default" },
      { $pull: { productIds: productId } }
    );
  }

  return getAdminFlashSale();
}

