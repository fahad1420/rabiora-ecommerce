import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPasswordResetToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  otpCode: string;
  purpose: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true },
    otpCode: { type: String, required: true },
    purpose: { type: String, default: "password_reset" },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    usedAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const PasswordResetTokenModel: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema);

