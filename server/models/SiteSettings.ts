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
  },
  {
    timestamps: true,
  }
);

export const SiteSettingsModel: Model<ISiteSettings> =
  mongoose.models.SiteSettings || mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

