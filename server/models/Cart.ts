import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICartItem {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICart extends Document {
  userId?: Types.ObjectId;
  anonymousToken?: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  {
    timestamps: true,
  }
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", sparse: true, index: true },
    anonymousToken: { type: String, sparse: true, index: true },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

export const CartModel: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>("Cart", CartSchema);

