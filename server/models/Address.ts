import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAddress extends Document {
  userId: Types.ObjectId;
  recipientName: string;
  phone: string;
  districtArea: string;
  fullAddress: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    districtArea: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const AddressModel: Model<IAddress> =
  mongoose.models.Address || mongoose.model<IAddress>("Address", AddressSchema);

