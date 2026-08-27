import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  discountType: "percentage";
  discountValue: number;
  isActive: boolean;
  expiryDate?: Date | null;
  minOrderAmount?: number;
  usageLimit?: number | null;
  usedCount: number;
  allowedPaymentMethods: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ["percentage"], default: "percentage" },
    discountValue: { type: Number, required: true, min: 1, max: 100 },
    isActive: { type: Boolean, default: true, index: true },
    expiryDate: { type: Date, default: null },
    minOrderAmount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    allowedPaymentMethods: {
      type: [String],
      default: ["bKash", "Nagad", "Rocket"],
    },
  },
  {
    timestamps: true,
  }
);

export const CouponModel: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);
