import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const orderStatusValues = ORDER_STATUSES;

export const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Cash on Delivery"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const paymentMethodValues = PAYMENT_METHODS;

export interface IOrderItem {
  _id?: Types.ObjectId;
  productId?: Types.ObjectId;
  productName: string;
  sku?: string;
  imageUrl?: string;
  unitPriceTaka: number;
  quantity: number;
  lineTotalTaka: number;
}

export interface IPaymentRecord {
  _id?: Types.ObjectId;
  method: PaymentMethod;
  expectedAmountTaka: number;
  submittedAmountTaka?: number;
  transactionId?: string;
  createdAt: Date;
}

export interface IOrderStatusHistory {
  _id?: Types.ObjectId;
  previousStatus?: OrderStatus;
  nextStatus: OrderStatus;
  actorUserId?: Types.ObjectId;
  adminNote?: string;
  createdAt: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId?: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  districtArea: string;
  upazila?: string;
  thana?: string;
  fullAddress: string;
  subtotalTaka: number;
  deliveryChargeTaka: number;
  totalTaka: number;
  couponCode?: string;
  originalSubtotalTaka?: number;
  discountPercent?: number;
  discountAmountTaka?: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  adminNote?: string;
  items: IOrderItem[];
  payments: IPaymentRecord[];
  statusHistory: IOrderStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String, required: true },
    sku: { type: String },
    imageUrl: { type: String },
    unitPriceTaka: { type: Number, required: true },
    quantity: { type: Number, required: true },
    lineTotalTaka: { type: Number, required: true },
  },
  { _id: true }
);

const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    expectedAmountTaka: { type: Number, required: true },
    submittedAmountTaka: { type: Number },
    transactionId: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    previousStatus: { type: String, enum: ORDER_STATUSES },
    nextStatus: { type: String, enum: ORDER_STATUSES, required: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
    adminNote: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", sparse: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true, index: true },
    districtArea: { type: String, required: true },
    upazila: { type: String, trim: true },
    thana: { type: String, trim: true },
    fullAddress: { type: String, required: true },
    subtotalTaka: { type: Number, required: true },
    deliveryChargeTaka: { type: Number, required: true },
    totalTaka: { type: Number, required: true },
    couponCode: { type: String, trim: true },
    originalSubtotalTaka: { type: Number },
    discountPercent: { type: Number },
    discountAmountTaka: { type: Number },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    adminNote: { type: String },
    items: [OrderItemSchema],
    payments: [PaymentRecordSchema],
    statusHistory: [OrderStatusHistorySchema],
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

