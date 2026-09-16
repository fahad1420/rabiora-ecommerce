import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFlashSale extends Document {
  key: string;
  campaignName: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  ctaText?: string;
  ctaLink?: string;
  productIds: Array<Types.ObjectId | string>;
  createdAt: Date;
  updatedAt: Date;
}

const FlashSaleSchema = new Schema<IFlashSale>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    campaignName: { type: String, default: "Rabiora Flash Sale" },
    title: { type: String, default: "⚡ Exclusive Flash Sale — Up to 20% OFF on Selected Luxury Pieces" },
    subtitle: { type: String, default: "Limited time offer on handcrafted Pakistani Lawn & Silk Three-Piece sets" },
    badgeText: { type: String, default: "⚡ FLASH SALE DEAL" },
    isActive: { type: Boolean, default: true },
    startTime: { type: Date },
    endTime: { type: Date },
    ctaText: { type: String, default: "Shop Flash Sale" },
    ctaLink: { type: String, default: "/#products" },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
  }
);

export const FlashSaleModel: Model<IFlashSale> =
  mongoose.models.FlashSale || mongoose.model<IFlashSale>("FlashSale", FlashSaleSchema);

