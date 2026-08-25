import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProductImage {
  _id?: Types.ObjectId;
  storageKey: string;
  storageUrl: string;
  altText: string;
  position: number;
  isCover: boolean;
}

export interface IProduct extends Document {
  legacyId?: number;
  categoryId: Types.ObjectId;
  categoryName?: string;
  categorySlug?: string;
  name: string;
  slug: string;
  sku?: string;
  details: string;
  fabric: string;
  color: string;
  priceTaka: number;
  oldPriceTaka?: number;
  discountPercent: number;
  stockQuantity: number;
  isInStock: boolean;
  featured: boolean;
  images: IProductImage[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    storageKey: { type: String, required: true },
    storageUrl: { type: String, required: true },
    altText: { type: String, default: "" },
    position: { type: Number, default: 0 },
    isCover: { type: Boolean, default: false },
  },
  { _id: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    legacyId: { type: Number, sparse: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    categoryName: { type: String },
    categorySlug: { type: String },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    sku: { type: String, trim: true },
    details: { type: String, required: true },
    fabric: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    priceTaka: { type: Number, required: true, min: 0 },
    oldPriceTaka: { type: Number, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    isInStock: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    images: [ProductImageSchema],
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ featured: -1, legacyId: 1 });
ProductSchema.index({ name: "text", details: "text", fabric: "text", color: "text" });

export const ProductModel: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

