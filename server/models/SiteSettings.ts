import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISiteSettings extends Document {
  key: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  deliveryChargeDhaka: number;
  deliveryChargeOutsideDhaka: number;
  featuredProductId?: string;
  featuredPictureUrl?: string;
  featuredPictureLink?: string;
  featuredTitle?: string;
  heroBadge?: string;
  heroHeading?: string;
  heroTagline?: string;
  heroImageUrl?: string;
  // Promotional Countdown Bar
  promoActive?: boolean;
  promoText?: string;
  promoDiscountText?: string;
  promoCountdownEnd?: string;
  promoCountdownActive?: boolean;
  promoButtonText?: string;
  promoLink?: string;
  promoProductIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    bkashNumber: { type: String, default: "+8801349529274" },
    nagadNumber: { type: String, default: "+8801349529274" },
    rocketNumber: { type: String, default: "+8801349529274" },
    deliveryChargeDhaka: { type: Number, default: 0 },
    deliveryChargeOutsideDhaka: { type: Number, default: 120 },
    featuredProductId: { type: String, default: "" },
    featuredPictureUrl: { type: String, default: "" },
    featuredPictureLink: { type: String, default: "/#products" },
    featuredTitle: { type: String, default: "Featured Collection" },
    heroBadge: { type: String, default: "Premium Collection" },
    heroHeading: { type: String, default: "RABIORA" },
    heroTagline: { type: String, default: "Elegance • Comfort • Confidence" },
    heroImageUrl: { type: String, default: "" },
    // Promotional Countdown Bar
    promoActive: { type: Boolean, default: false },
    promoText: { type: String, default: "Flash Sale — Special Discount on Pakistani Lawn & Silk" },
    promoDiscountText: { type: String, default: "10% OFF" },
    promoCountdownEnd: { type: String, default: "" },
    promoCountdownActive: { type: Boolean, default: true },
    promoButtonText: { type: String, default: "Shop Flash Sale" },
    promoLink: { type: String, default: "/#products" },
    promoProductIds: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export const SiteSettingsModel: Model<ISiteSettings> =
  mongoose.models.SiteSettings || mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

