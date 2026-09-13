import { TRPCError } from "@trpc/server";
import { connectMongo } from "./config/db";
import { SiteSettingsModel, SubscriberModel, OfferBannerModel } from "./models";
import { normalizeBangladeshPhone } from "./customerSession";
import { saveProductImage } from "./storage";

export async function getPublicSiteSettings() {
  await connectMongo();
  let settings = await SiteSettingsModel.findOne({ key: "default" }).lean();
  if (!settings) {
    settings = await SiteSettingsModel.create({
      key: "default",
      bkashNumber: "+8801349529274",
      nagadNumber: "+8801349529274",
      rocketNumber: "+8801349529274",
      deliveryChargeDhaka: 0,
      deliveryChargeOutsideDhaka: 120,
      featuredProductId: "",
      featuredPictureUrl: "",
      featuredPictureLink: "/#products",
      featuredTitle: "Featured Collection",
      heroBadge: "Premium Collection",
      heroHeading: "RABIORA",
      heroTagline: "Elegance • Comfort • Confidence",
      heroImageUrl: "",
    });
  }

  return {
    bkashNumber: settings.bkashNumber || "+8801349529274",
    nagadNumber: settings.nagadNumber || "+8801349529274",
    rocketNumber: settings.rocketNumber || "+8801349529274",
    deliveryChargeDhaka: settings.deliveryChargeDhaka ?? 0,
    deliveryChargeOutsideDhaka: settings.deliveryChargeOutsideDhaka ?? 120,
    featuredProductId: settings.featuredProductId || "",
    featuredPictureUrl: settings.featuredPictureUrl || "",
    featuredPictureLink: settings.featuredPictureLink || "/#products",
    featuredTitle: settings.featuredTitle || "Featured Collection",
    heroBadge: settings.heroBadge || "Premium Collection",
    heroHeading: settings.heroHeading || "RABIORA",
    heroTagline: settings.heroTagline || "Elegance • Comfort • Confidence",
    heroImageUrl: settings.heroImageUrl || "",
  };
}

export async function updateAdminSiteSettings(input: {
  bkashNumber?: string;
  nagadNumber?: string;
  rocketNumber?: string;
  deliveryChargeDhaka?: number;
  deliveryChargeOutsideDhaka?: number;
  featuredProductId?: string;
  featuredPictureUrl?: string;
  featuredPictureLink?: string;
  featuredTitle?: string;
  heroBadge?: string;
  heroHeading?: string;
  heroTagline?: string;
  heroImageUrl?: string;
}) {
  await connectMongo();
  const updated = await SiteSettingsModel.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        ...(input.bkashNumber !== undefined && { bkashNumber: input.bkashNumber.trim() }),
        ...(input.nagadNumber !== undefined && { nagadNumber: input.nagadNumber.trim() }),
        ...(input.rocketNumber !== undefined && { rocketNumber: input.rocketNumber.trim() }),
        ...(input.deliveryChargeDhaka !== undefined && { deliveryChargeDhaka: Math.max(0, Number(input.deliveryChargeDhaka)) }),
        ...(input.deliveryChargeOutsideDhaka !== undefined && { deliveryChargeOutsideDhaka: Math.max(0, Number(input.deliveryChargeOutsideDhaka)) }),
        ...(input.featuredProductId !== undefined && { featuredProductId: input.featuredProductId.trim() }),
        ...(input.featuredPictureUrl !== undefined && { featuredPictureUrl: input.featuredPictureUrl.trim() }),
        ...(input.featuredPictureLink !== undefined && { featuredPictureLink: input.featuredPictureLink.trim() }),
        ...(input.featuredTitle !== undefined && { featuredTitle: input.featuredTitle.trim() }),
        ...(input.heroBadge !== undefined && { heroBadge: input.heroBadge.trim() }),
        ...(input.heroHeading !== undefined && { heroHeading: input.heroHeading.trim() }),
        ...(input.heroTagline !== undefined && { heroTagline: input.heroTagline.trim() }),
        ...(input.heroImageUrl !== undefined && { heroImageUrl: input.heroImageUrl.trim() }),
      },
    },
    { upsert: true, new: true }
  ).lean();

  return {
    bkashNumber: updated.bkashNumber,
    nagadNumber: updated.nagadNumber,
    rocketNumber: updated.rocketNumber,
    deliveryChargeDhaka: updated.deliveryChargeDhaka ?? 0,
    deliveryChargeOutsideDhaka: updated.deliveryChargeOutsideDhaka ?? 120,
    featuredProductId: updated.featuredProductId || "",
    featuredPictureUrl: updated.featuredPictureUrl || "",
    featuredPictureLink: updated.featuredPictureLink || "/#products",
    featuredTitle: updated.featuredTitle || "Featured Collection",
    heroBadge: updated.heroBadge,
    heroHeading: updated.heroHeading,
    heroTagline: updated.heroTagline,
    heroImageUrl: updated.heroImageUrl,
  };
}

export async function subscribeCustomer(input: {
  email: string;
  phone: string;
  residency: "inside_bangladesh" | "outside_bangladesh";
}) {
  await connectMongo();
  const email = input.email.trim().toLowerCase();
  const phoneInput = input.phone.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Please enter a valid email address.",
    });
  }

  let normalizedPhone = phoneInput;
  if (input.residency === "inside_bangladesh") {
    const bd = normalizeBangladeshPhone(phoneInput);
    if (!bd) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please enter a valid 11-digit Bangladesh mobile number.",
      });
    }
    normalizedPhone = bd;
  } else {
    if (phoneInput.length < 7 || phoneInput.length > 20) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please enter a valid international mobile number.",
      });
    }
  }

  const existing = await SubscriberModel.findOne({ email }).lean();
  if (existing) {
    if (existing.status === "unsubscribed") {
      await SubscriberModel.updateOne(
        { _id: existing._id },
        { $set: { status: "active", phone: normalizedPhone, residency: input.residency } }
      );
      return { success: true, message: "Thank you! Your subscription has been reactivated." };
    }
    return { success: true, message: "You are already subscribed to Rabiora updates!" };
  }

  await SubscriberModel.create({
    email,
    phone: normalizedPhone,
    residency: input.residency,
    status: "active",
  });

  return { success: true, message: "Thank you for subscribing to Rabiora!" };
}

export async function listAdminSubscribers() {
  await connectMongo();
  const subscribers = await SubscriberModel.find().sort({ createdAt: -1 }).lean();
  return subscribers.map((s) => ({
    id: s._id.toString(),
    email: s.email,
    phone: s.phone,
    residency: s.residency,
    status: s.status,
    createdAt: s.createdAt,
  }));
}

export async function deleteAdminSubscriber(id: string) {
  await connectMongo();
  await SubscriberModel.findByIdAndDelete(id);
  return { success: true };
}

export async function listActiveOfferBanners() {
  await connectMongo();
  const totalCount = await OfferBannerModel.countDocuments();
  if (totalCount === 0) {
    // If database is brand new, seed an initial persistent banner
    const defaultBanner = await OfferBannerModel.create({
      offerType: "text",
      title: "10% OFF on bKash Payment",
      subtitle: "Exclusive Rabiora Discount on all Three-Piece Collections",
      badge: "Special Offer",
      discountCode: "BKASH10",
      imageUrl: "",
      linkUrl: "/#products",
      isActive: true,
      displayOrder: 0,
    });
    return [
      {
        id: defaultBanner._id.toString(),
        offerType: defaultBanner.offerType || "text",
        title: defaultBanner.title,
        subtitle: defaultBanner.subtitle || "",
        badge: defaultBanner.badge || "Special Offer",
        discountCode: defaultBanner.discountCode || "",
        imageUrl: defaultBanner.imageUrl || "",
        linkUrl: defaultBanner.linkUrl || "/#products",
        isActive: defaultBanner.isActive,
        displayOrder: defaultBanner.displayOrder,
      },
    ];
  }

  const banners = await OfferBannerModel.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).lean();
  return banners.map((b) => ({
    id: b._id.toString(),
    offerType: (b.offerType || "text") as "text" | "image_banner",
    title: b.title,
    subtitle: b.subtitle || "",
    badge: b.badge || "Special Offer",
    discountCode: b.discountCode || "",
    imageUrl: b.imageUrl || "",
    linkUrl: b.linkUrl || "/#products",
    isActive: b.isActive,
    displayOrder: b.displayOrder,
  }));
}

export async function listAdminOfferBanners() {
  await connectMongo();
  const banners = await OfferBannerModel.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
  return banners.map((b) => ({
    id: b._id.toString(),
    offerType: (b.offerType || "text") as "text" | "image_banner",
    title: b.title,
    subtitle: b.subtitle || "",
    badge: b.badge || "Special Offer",
    discountCode: b.discountCode || "",
    imageUrl: b.imageUrl || "",
    linkUrl: b.linkUrl || "/#products",
    isActive: b.isActive,
    displayOrder: b.displayOrder,
    createdAt: b.createdAt,
  }));
}

export async function createAdminOfferBanner(input: {
  offerType?: "text" | "image_banner";
  title: string;
  subtitle?: string;
  badge?: string;
  discountCode?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}) {
  await connectMongo();
  const offerType = input.offerType || "image_banner";
  if (offerType === "image_banner" && !input.imageUrl?.trim()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "An image is required for Image Banner offers." });
  }

  const created = await OfferBannerModel.create({
    offerType,
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || "",
    badge: input.badge?.trim() || "Special Offer",
    discountCode: input.discountCode?.trim() || "",
    imageUrl: input.imageUrl?.trim() || "",
    linkUrl: input.linkUrl?.trim() || "/#products",
    isActive: input.isActive ?? true,
    displayOrder: input.displayOrder ?? 0,
  });

  return {
    id: created._id.toString(),
    offerType: created.offerType,
    title: created.title,
    subtitle: created.subtitle,
    badge: created.badge,
    discountCode: created.discountCode,
    imageUrl: created.imageUrl,
    linkUrl: created.linkUrl,
    isActive: created.isActive,
    displayOrder: created.displayOrder,
  };
}

export async function updateAdminOfferBanner(
  id: string,
  input: {
    offerType?: "text" | "image_banner";
    title?: string;
    subtitle?: string;
    badge?: string;
    discountCode?: string;
    imageUrl?: string;
    linkUrl?: string;
    isActive?: boolean;
    displayOrder?: number;
  }
) {
  await connectMongo();
  if (input.offerType === "image_banner" && input.imageUrl !== undefined && !input.imageUrl.trim()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "An image is required for Image Banner offers." });
  }

  const updated = await OfferBannerModel.findByIdAndUpdate(
    id,
    {
      $set: {
        ...(input.offerType !== undefined && { offerType: input.offerType }),
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.subtitle !== undefined && { subtitle: input.subtitle.trim() }),
        ...(input.badge !== undefined && { badge: input.badge.trim() }),
        ...(input.discountCode !== undefined && { discountCode: input.discountCode.trim() }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl.trim() }),
        ...(input.linkUrl !== undefined && { linkUrl: input.linkUrl.trim() }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Offer banner not found." });
  }

  return {
    id: updated._id.toString(),
    offerType: updated.offerType || "text",
    title: updated.title,
    subtitle: updated.subtitle,
    badge: updated.badge,
    discountCode: updated.discountCode,
    imageUrl: updated.imageUrl || "",
    linkUrl: updated.linkUrl,
    isActive: updated.isActive,
    displayOrder: updated.displayOrder,
  };
}

export async function deleteAdminOfferBanner(id: string) {
  await connectMongo();
  await OfferBannerModel.findByIdAndDelete(id);
  return { success: true };
}

export async function uploadAdminOfferImage(
  dataUri: string,
  fileName?: string
) {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image format." });
  }
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const upload = await saveProductImage("offers", buffer, mimeType, fileName || "offer-banner.jpg");
  return { storageUrl: upload.url, storageKey: upload.key };
}
