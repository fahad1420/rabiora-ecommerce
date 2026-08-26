import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOfferBanner extends Document {
  title: string;
  subtitle?: string;
  badge?: string;
  discountCode?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const OfferBannerSchema = new Schema<IOfferBanner>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    badge: { type: String, trim: true, default: "Special Offer" },
    discountCode: { type: String, trim: true, default: "" },
    imageUrl: { type: String, required: true, trim: true },
    linkUrl: { type: String, trim: true, default: "/#products" },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
  },
  {
    timestamps: true,
  }
);

export const OfferBannerModel: Model<IOfferBanner> =
  mongoose.models.OfferBanner || mongoose.model<IOfferBanner>("OfferBanner", OfferBannerSchema);

