import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  openId: string;
  name?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  loginMethod?: string;
  role: "user" | "admin";
  lastSignedIn: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    openId: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    email: { type: String, sparse: true, index: true, lowercase: true, trim: true },
    phone: { type: String, sparse: true, index: true, trim: true },
    passwordHash: { type: String },
    loginMethod: { type: String, default: "local" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    lastSignedIn: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

