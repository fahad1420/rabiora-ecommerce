import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IWishlistItem extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

WishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const WishlistItemModel: Model<IWishlistItem> =
  mongoose.models.WishlistItem ||
  mongoose.model<IWishlistItem>("WishlistItem", WishlistItemSchema);

