import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReview extends Document {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId?: Types.ObjectId;
  rating: number;
  review: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true, trim: true },
    isVisible: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ productId: 1, isVisible: 1, createdAt: -1 });

export const ReviewModel: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

