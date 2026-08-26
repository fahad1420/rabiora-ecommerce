import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscriber extends Document {
  email: string;
  phone: string;
  residency: "inside_bangladesh" | "outside_bangladesh";
  status: "active" | "unsubscribed";
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true },
    residency: {
      type: String,
      enum: ["inside_bangladesh", "outside_bangladesh"],
      default: "inside_bangladesh",
    },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

SubscriberSchema.index({ email: 1, phone: 1 }, { unique: true });

export const SubscriberModel: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);

