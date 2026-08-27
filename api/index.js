var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/config/db.ts
import dns from "node:dns";
import mongoose from "mongoose";
function getMongoUri() {
  const candidates = [
    process.env.MONGODB_URI,
    process.env.DATABASE_URL,
    process.env.MONGO_URI,
    process.env.MONGODB_URL,
    process.env.MONGO_URL,
    process.env.MONGODB_CONNECTION_STRING,
    process.env.MONGO_CONNECTION_STRING,
    process.env.VITE_MONGODB_URI,
    process.env.NEXT_PUBLIC_MONGODB_URI
  ];
  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim()) {
      return c.trim();
    }
  }
  for (const [key, val] of Object.entries(process.env)) {
    const cleanKey = key.trim().toUpperCase();
    if ((cleanKey.includes("MONGO") || cleanKey.includes("DATABASE_URL") || cleanKey.includes("DB_URI")) && typeof val === "string" && val.trim().length > 0) {
      const trimmedVal = val.trim();
      if (trimmedVal.startsWith("mongodb://") || trimmedVal.startsWith("mongodb+srv://")) {
        return trimmedVal;
      }
    }
  }
  return "";
}
async function connectMongo() {
  const uri = getMongoUri();
  if (!uri) {
    throw new Error("[MongoDB] MONGODB_URI environment variable is not configured in environment.");
  }
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8e3,
      connectTimeoutMS: 8e3,
      socketTimeoutMS: 15e3
    };
    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log("[MongoDB] Successfully connected to database");
      return m;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("[MongoDB] Connection error:", e);
    throw e;
  }
  return cached.conn;
}
var cached;
var init_db = __esm({
  "server/config/db.ts"() {
    "use strict";
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      try {
        dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
      } catch {
      }
    }
    cached = global.mongooseCache;
    if (!cached) {
      cached = global.mongooseCache = { conn: null, promise: null };
    }
  }
});

// server/models/User.ts
import mongoose2, { Schema } from "mongoose";
var UserSchema, UserModel;
var init_User = __esm({
  "server/models/User.ts"() {
    "use strict";
    UserSchema = new Schema(
      {
        openId: { type: String, required: true, unique: true, index: true },
        name: { type: String },
        email: { type: String, sparse: true, index: true, lowercase: true, trim: true },
        phone: { type: String, sparse: true, index: true, trim: true },
        passwordHash: { type: String },
        loginMethod: { type: String, default: "local" },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        lastSignedIn: { type: Date, default: Date.now }
      },
      {
        timestamps: true
      }
    );
    UserModel = mongoose2.models.User || mongoose2.model("User", UserSchema);
  }
});

// server/models/Category.ts
import mongoose3, { Schema as Schema2 } from "mongoose";
var CategorySchema, CategoryModel;
var init_Category = __esm({
  "server/models/Category.ts"() {
    "use strict";
    CategorySchema = new Schema2(
      {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true }
      },
      {
        timestamps: true
      }
    );
    CategoryModel = mongoose3.models.Category || mongoose3.model("Category", CategorySchema);
  }
});

// server/models/Product.ts
import mongoose4, { Schema as Schema3 } from "mongoose";
var ProductImageSchema, ProductSchema, ProductModel;
var init_Product = __esm({
  "server/models/Product.ts"() {
    "use strict";
    ProductImageSchema = new Schema3(
      {
        storageKey: { type: String, required: true },
        storageUrl: { type: String, required: true },
        altText: { type: String, default: "" },
        position: { type: Number, default: 0 },
        isCover: { type: Boolean, default: false }
      },
      { _id: true }
    );
    ProductSchema = new Schema3(
      {
        legacyId: { type: Number, sparse: true, index: true },
        categoryId: { type: Schema3.Types.ObjectId, ref: "Category", required: true, index: true },
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
        images: [ProductImageSchema]
      },
      {
        timestamps: true
      }
    );
    ProductSchema.index({ featured: -1, legacyId: 1 });
    ProductSchema.index({ name: "text", details: "text", fabric: "text", color: "text" });
    ProductModel = mongoose4.models.Product || mongoose4.model("Product", ProductSchema);
  }
});

// server/models/Cart.ts
import mongoose5, { Schema as Schema4 } from "mongoose";
var CartItemSchema, CartSchema, CartModel;
var init_Cart = __esm({
  "server/models/Cart.ts"() {
    "use strict";
    CartItemSchema = new Schema4(
      {
        productId: { type: Schema4.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1 }
      },
      {
        timestamps: true
      }
    );
    CartSchema = new Schema4(
      {
        userId: { type: Schema4.Types.ObjectId, ref: "User", sparse: true, index: true },
        anonymousToken: { type: String, sparse: true, index: true },
        items: [CartItemSchema]
      },
      {
        timestamps: true
      }
    );
    CartModel = mongoose5.models.Cart || mongoose5.model("Cart", CartSchema);
  }
});

// server/models/Order.ts
import mongoose6, { Schema as Schema5 } from "mongoose";
var ORDER_STATUSES, PAYMENT_METHODS, OrderItemSchema, PaymentRecordSchema, OrderStatusHistorySchema, OrderSchema, OrderModel;
var init_Order = __esm({
  "server/models/Order.ts"() {
    "use strict";
    ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered"];
    PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Cash on Delivery"];
    OrderItemSchema = new Schema5(
      {
        productId: { type: Schema5.Types.ObjectId, ref: "Product" },
        productName: { type: String, required: true },
        sku: { type: String },
        imageUrl: { type: String },
        unitPriceTaka: { type: Number, required: true },
        quantity: { type: Number, required: true },
        lineTotalTaka: { type: Number, required: true }
      },
      { _id: true }
    );
    PaymentRecordSchema = new Schema5(
      {
        method: { type: String, enum: PAYMENT_METHODS, required: true },
        expectedAmountTaka: { type: Number, required: true },
        submittedAmountTaka: { type: Number },
        transactionId: { type: String },
        createdAt: { type: Date, default: Date.now }
      },
      { _id: true }
    );
    OrderStatusHistorySchema = new Schema5(
      {
        previousStatus: { type: String, enum: ORDER_STATUSES },
        nextStatus: { type: String, enum: ORDER_STATUSES, required: true },
        actorUserId: { type: Schema5.Types.ObjectId, ref: "User" },
        adminNote: { type: String },
        createdAt: { type: Date, default: Date.now }
      },
      { _id: true }
    );
    OrderSchema = new Schema5(
      {
        orderNumber: { type: String, required: true, unique: true, index: true },
        userId: { type: Schema5.Types.ObjectId, ref: "User", sparse: true, index: true },
        customerName: { type: String, required: true },
        customerPhone: { type: String, required: true, index: true },
        districtArea: { type: String, required: true },
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
        statusHistory: [OrderStatusHistorySchema]
      },
      {
        timestamps: true
      }
    );
    OrderSchema.index({ status: 1, createdAt: -1 });
    OrderSchema.index({ userId: 1, createdAt: -1 });
    OrderModel = mongoose6.models.Order || mongoose6.model("Order", OrderSchema);
  }
});

// server/models/Review.ts
import mongoose7, { Schema as Schema6 } from "mongoose";
var ReviewSchema, ReviewModel;
var init_Review = __esm({
  "server/models/Review.ts"() {
    "use strict";
    ReviewSchema = new Schema6(
      {
        productId: { type: Schema6.Types.ObjectId, ref: "Product", required: true, index: true },
        userId: { type: Schema6.Types.ObjectId, ref: "User", required: true, index: true },
        orderId: { type: Schema6.Types.ObjectId, ref: "Order" },
        rating: { type: Number, required: true, min: 1, max: 5 },
        review: { type: String, required: true, trim: true },
        isVisible: { type: Boolean, default: true, index: true }
      },
      {
        timestamps: true
      }
    );
    ReviewSchema.index({ productId: 1, isVisible: 1, createdAt: -1 });
    ReviewModel = mongoose7.models.Review || mongoose7.model("Review", ReviewSchema);
  }
});

// server/models/Address.ts
import mongoose8, { Schema as Schema7 } from "mongoose";
var AddressSchema, AddressModel;
var init_Address = __esm({
  "server/models/Address.ts"() {
    "use strict";
    AddressSchema = new Schema7(
      {
        userId: { type: Schema7.Types.ObjectId, ref: "User", required: true, index: true },
        recipientName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        districtArea: { type: String, required: true, trim: true },
        fullAddress: { type: String, required: true, trim: true },
        isDefault: { type: Boolean, default: false }
      },
      {
        timestamps: true
      }
    );
    AddressModel = mongoose8.models.Address || mongoose8.model("Address", AddressSchema);
  }
});

// server/models/PasswordResetToken.ts
import mongoose9, { Schema as Schema8 } from "mongoose";
var PasswordResetTokenSchema, PasswordResetTokenModel;
var init_PasswordResetToken = __esm({
  "server/models/PasswordResetToken.ts"() {
    "use strict";
    PasswordResetTokenSchema = new Schema8(
      {
        userId: { type: Schema8.Types.ObjectId, ref: "User", required: true, index: true },
        tokenHash: { type: String, required: true },
        otpCode: { type: String, required: true },
        purpose: { type: String, default: "password_reset" },
        expiresAt: { type: Date, required: true, index: { expires: 0 } },
        usedAt: { type: Date }
      },
      {
        timestamps: { createdAt: true, updatedAt: false }
      }
    );
    PasswordResetTokenModel = mongoose9.models.PasswordResetToken || mongoose9.model("PasswordResetToken", PasswordResetTokenSchema);
  }
});

// server/models/Wishlist.ts
import mongoose10, { Schema as Schema9 } from "mongoose";
var WishlistItemSchema, WishlistItemModel;
var init_Wishlist = __esm({
  "server/models/Wishlist.ts"() {
    "use strict";
    WishlistItemSchema = new Schema9(
      {
        userId: { type: Schema9.Types.ObjectId, ref: "User", required: true, index: true },
        productId: { type: Schema9.Types.ObjectId, ref: "Product", required: true, index: true }
      },
      {
        timestamps: { createdAt: true, updatedAt: false }
      }
    );
    WishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });
    WishlistItemModel = mongoose10.models.WishlistItem || mongoose10.model("WishlistItem", WishlistItemSchema);
  }
});

// server/models/SiteSettings.ts
import mongoose11, { Schema as Schema10 } from "mongoose";
var SiteSettingsSchema, SiteSettingsModel;
var init_SiteSettings = __esm({
  "server/models/SiteSettings.ts"() {
    "use strict";
    SiteSettingsSchema = new Schema10(
      {
        key: { type: String, required: true, unique: true, default: "default" },
        bkashNumber: { type: String, default: "+8801349529274" },
        nagadNumber: { type: String, default: "+8801349529274" },
        rocketNumber: { type: String, default: "+8801349529274" },
        heroBadge: { type: String, default: "Premium Collection" },
        heroHeading: { type: String, default: "RABIORA" },
        heroTagline: { type: String, default: "Elegance \u2022 Comfort \u2022 Confidence" },
        heroImageUrl: { type: String, default: "" }
      },
      {
        timestamps: true
      }
    );
    SiteSettingsModel = mongoose11.models.SiteSettings || mongoose11.model("SiteSettings", SiteSettingsSchema);
  }
});

// server/models/Subscriber.ts
import mongoose12, { Schema as Schema11 } from "mongoose";
var SubscriberSchema, SubscriberModel;
var init_Subscriber = __esm({
  "server/models/Subscriber.ts"() {
    "use strict";
    SubscriberSchema = new Schema11(
      {
        email: { type: String, required: true, trim: true, lowercase: true, index: true },
        phone: { type: String, required: true, trim: true },
        residency: {
          type: String,
          enum: ["inside_bangladesh", "outside_bangladesh"],
          default: "inside_bangladesh"
        },
        status: {
          type: String,
          enum: ["active", "unsubscribed"],
          default: "active"
        }
      },
      {
        timestamps: true
      }
    );
    SubscriberSchema.index({ email: 1, phone: 1 }, { unique: true });
    SubscriberModel = mongoose12.models.Subscriber || mongoose12.model("Subscriber", SubscriberSchema);
  }
});

// server/models/OfferBanner.ts
import mongoose13, { Schema as Schema12 } from "mongoose";
var OfferBannerSchema, OfferBannerModel;
var init_OfferBanner = __esm({
  "server/models/OfferBanner.ts"() {
    "use strict";
    OfferBannerSchema = new Schema12(
      {
        offerType: {
          type: String,
          enum: ["text", "image_banner"],
          default: "text",
          index: true
        },
        title: { type: String, required: true, trim: true },
        subtitle: { type: String, trim: true, default: "" },
        badge: { type: String, trim: true, default: "Special Offer" },
        discountCode: { type: String, trim: true, default: "" },
        imageUrl: { type: String, trim: true, default: "" },
        linkUrl: { type: String, trim: true, default: "/#products" },
        isActive: { type: Boolean, default: true, index: true },
        displayOrder: { type: Number, default: 0, index: true }
      },
      {
        timestamps: true
      }
    );
    OfferBannerModel = mongoose13.models.OfferBanner || mongoose13.model("OfferBanner", OfferBannerSchema);
  }
});

// server/models/Coupon.ts
import mongoose14, { Schema as Schema13 } from "mongoose";
var CouponSchema, CouponModel;
var init_Coupon = __esm({
  "server/models/Coupon.ts"() {
    "use strict";
    CouponSchema = new Schema13(
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
          default: ["bKash", "Nagad", "Rocket"]
        }
      },
      {
        timestamps: true
      }
    );
    CouponModel = mongoose14.models.Coupon || mongoose14.model("Coupon", CouponSchema);
  }
});

// server/models/helpers.ts
import mongoose15, { Types as Types8 } from "mongoose";
function toObjectId(id) {
  if (typeof id !== "string") return id;
  return Types8.ObjectId.isValid(id) ? Types8.ObjectId.createFromHexString(id) : new Types8.ObjectId(id);
}
function isValidObjectId(id) {
  return typeof id === "string" && mongoose15.isValidObjectId(id);
}
function findProductQuery(idOrLegacy) {
  const conditions = [];
  const num = typeof idOrLegacy === "number" ? idOrLegacy : Number(idOrLegacy);
  if (!isNaN(num) && num > 0) {
    conditions.push({ legacyId: num });
  }
  if (typeof idOrLegacy === "string" && mongoose15.isValidObjectId(idOrLegacy)) {
    conditions.push({ _id: Types8.ObjectId.createFromHexString(idOrLegacy) });
  }
  if (conditions.length === 0) {
    conditions.push({ slug: String(idOrLegacy) });
  }
  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}
function findUserQuery(idOrOpenId) {
  const conditions = [{ openId: String(idOrOpenId) }];
  if (typeof idOrOpenId === "string" && mongoose15.isValidObjectId(idOrOpenId)) {
    conditions.push({ _id: Types8.ObjectId.createFromHexString(idOrOpenId) });
  }
  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}
function findOrderQuery(orderIdOrNumber) {
  const conditions = [{ orderNumber: String(orderIdOrNumber) }];
  if (typeof orderIdOrNumber === "string" && mongoose15.isValidObjectId(orderIdOrNumber)) {
    conditions.push({ _id: Types8.ObjectId.createFromHexString(orderIdOrNumber) });
  }
  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}
var init_helpers = __esm({
  "server/models/helpers.ts"() {
    "use strict";
  }
});

// server/models/index.ts
var init_models = __esm({
  "server/models/index.ts"() {
    "use strict";
    init_User();
    init_Category();
    init_Product();
    init_Cart();
    init_Order();
    init_Review();
    init_Address();
    init_PasswordResetToken();
    init_Wishlist();
    init_SiteSettings();
    init_Subscriber();
    init_OfferBanner();
    init_Coupon();
    init_helpers();
  }
});

// server/customerSession.ts
import bcrypt from "bcryptjs";
import crypto2 from "node:crypto";
import { parse } from "cookie";
import { SignJWT as SignJWT2, jwtVerify as jwtVerify2 } from "jose";
import { nanoid } from "nanoid";
function getJwtSecret() {
  const candidates = [
    process.env.JWT_SECRET,
    process.env.SESSION_SECRET,
    process.env.COOKIE_SECRET,
    process.env.AUTH_SECRET,
    process.env.SECRET_KEY,
    process.env.NEXTAUTH_SECRET
  ];
  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim()) {
      return c.trim();
    }
  }
  for (const [key, val] of Object.entries(process.env)) {
    const cleanKey = key.trim().toUpperCase();
    if (cleanKey.includes("JWT") || cleanKey.includes("SECRET") || cleanKey.includes("AUTH_KEY")) {
      if (val && typeof val === "string" && val.trim().length >= 8) {
        return val.trim();
      }
    }
  }
  return process.env.NODE_ENV === "production" ? "rabiora-prod-session-key-fallback-sec-2026-auth" : "rabiora-development-session-key-change-in-production";
}
function normalizeBangladeshPhone(value) {
  const digits = value.replace(/\D/g, "");
  if (/^8801[3-9]\d{8}$/.test(digits)) {
    return `+${digits}`;
  }
  if (/^01[3-9]\d{8}$/.test(digits)) {
    return `+88${digits}`;
  }
  return null;
}
function isValidCustomerPassword(value) {
  return value.length >= 8 && value.length <= 72;
}
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
async function signCustomerSession(user) {
  return new SignJWT2({
    type: "rabiora_customer",
    role: user.role
  }).setProtectedHeader({ alg: "HS256" }).setSubject(String(user.id)).setIssuedAt().setExpirationTime("14d").sign(sessionKey());
}
function getSessionCookieOptions2(req) {
  const isProduction = process.env.NODE_ENV === "production";
  const origin = req?.get("origin");
  const host = req?.get("host");
  const isSecure = req?.secure || req?.headers["x-forwarded-proto"] === "https" || isProduction;
  const isCrossSite = Boolean(origin && host && !origin.includes(host));
  if (isProduction || isSecure && isCrossSite) {
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/"
    };
  }
  return {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/"
  };
}
async function setCustomerSession(res, user, req) {
  const token = await signCustomerSession(user);
  const cookieOptions = getSessionCookieOptions2(req);
  res.cookie(CUSTOMER_COOKIE, token, {
    ...cookieOptions,
    maxAge: 14 * 24 * 60 * 60 * 1e3
  });
}
function clearCustomerSession(res, req) {
  const cookieOptions = getSessionCookieOptions2(req);
  res.clearCookie(CUSTOMER_COOKIE, {
    ...cookieOptions
  });
}
async function signOrderConfirmation(orderNumber) {
  return new SignJWT2({
    type: "rabiora_order_confirmation",
    orderNumber
  }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("6h").sign(sessionKey());
}
async function setGuestOrderConfirmation(res, orderNumber, req) {
  const token = await signOrderConfirmation(orderNumber);
  const cookieOptions = getSessionCookieOptions2(req);
  res.cookie(ORDER_CONFIRMATION_COOKIE, token, {
    ...cookieOptions,
    maxAge: 6 * 60 * 60 * 1e3
  });
}
async function hasGuestOrderConfirmationAccess(req, orderNumber) {
  const token = parse(req.headers.cookie ?? "")[ORDER_CONFIRMATION_COOKIE];
  if (!token) return false;
  try {
    const { payload } = await jwtVerify2(token, sessionKey());
    return payload.type === "rabiora_order_confirmation" && payload.orderNumber === orderNumber;
  } catch {
    return false;
  }
}
async function getCustomerFromRequest(req) {
  let token = parse(req.headers.cookie ?? "")[CUSTOMER_COOKIE];
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }
  if (!token) return null;
  try {
    const { payload } = await jwtVerify2(token, sessionKey());
    if (payload.type !== "rabiora_customer" || !payload.sub) {
      return null;
    }
    await connectMongo();
    const user = await UserModel.findOne(findUserQuery(payload.sub)).lean();
    if (!user) return null;
    return {
      id: user._id.toString(),
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      phone: user.phone ?? null,
      role: user.role
    };
  } catch {
    return null;
  }
}
async function createCustomer({
  name,
  phone,
  password
}) {
  await connectMongo();
  const passwordHash = await hashPassword(password);
  const normalizedPhone = normalizeBangladeshPhone(phone);
  if (!normalizedPhone) {
    throw new Error("A valid Bangladesh phone number is required.");
  }
  const existing = await UserModel.findOne({ phone: normalizedPhone });
  if (existing) {
    throw new Error("An account with this phone number already exists.");
  }
  const user = await UserModel.create({
    openId: `customer:${nanoid(24)}`,
    name,
    phone: normalizedPhone,
    passwordHash,
    loginMethod: "password",
    role: "user",
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  return {
    id: user._id.toString(),
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    phone: user.phone ?? null,
    role: user.role
  };
}
async function findCustomerByIdentifier(identifier) {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  await connectMongo();
  if (trimmed.includes("@")) {
    const byEmail = await UserModel.findOne({ email: trimmed.toLowerCase() }).lean();
    if (byEmail) return byEmail;
  }
  const normalizedPhone = normalizeBangladeshPhone(trimmed);
  if (normalizedPhone) {
    const byPhone = await UserModel.findOne({ phone: normalizedPhone }).lean();
    if (byPhone) return byPhone;
  }
  const fallback = await UserModel.findOne({
    $or: [
      { phone: trimmed },
      { email: trimmed.toLowerCase() },
      { openId: trimmed }
    ]
  }).lean();
  return fallback ?? null;
}
async function updateCustomerProfile(userId, {
  name,
  email
}) {
  await connectMongo();
  const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;
  const customer = await UserModel.findOneAndUpdate(
    findUserQuery(userId),
    {
      $set: {
        name: name.trim(),
        email: cleanEmail
      }
    },
    { new: true }
  ).lean();
  if (!customer) {
    throw new Error("Customer profile update failed.");
  }
  return {
    id: customer._id.toString(),
    openId: customer.openId,
    name: customer.name ?? null,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    role: customer.role
  };
}
async function createPasswordResetRequest(phone) {
  await connectMongo();
  const normalizedPhone = normalizeBangladeshPhone(phone);
  if (!normalizedPhone) {
    return { success: true };
  }
  const user = await UserModel.findOne({ phone: normalizedPhone });
  if (!user) {
    return { success: true };
  }
  const otpCode = String(crypto2.randomInt(1e5, 1e6));
  const rawToken = crypto2.randomBytes(32).toString("hex");
  const tokenHash = crypto2.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1e3);
  await PasswordResetTokenModel.updateMany(
    { userId: user._id, usedAt: { $exists: false } },
    { $set: { usedAt: /* @__PURE__ */ new Date() } }
  );
  await PasswordResetTokenModel.create({
    userId: user._id,
    tokenHash,
    otpCode,
    purpose: "password_reset",
    expiresAt
  });
  if (process.env.NODE_ENV !== "production") {
    return {
      success: true,
      devOtp: otpCode,
      devToken: rawToken
    };
  }
  return {
    success: true
  };
}
async function resetCustomerPassword({
  phone,
  otpCode,
  newPassword
}) {
  await connectMongo();
  const normalizedPhone = normalizeBangladeshPhone(phone);
  if (!normalizedPhone) {
    throw new Error("Invalid phone number.");
  }
  if (!/^\d{6}$/.test(otpCode)) {
    throw new Error("Invalid or expired reset code.");
  }
  if (!isValidCustomerPassword(newPassword)) {
    throw new Error("Password must contain 8\u201372 characters.");
  }
  const user = await UserModel.findOne({ phone: normalizedPhone });
  if (!user) {
    throw new Error("Invalid or expired reset code.");
  }
  const reset = await PasswordResetTokenModel.findOne({
    userId: user._id,
    otpCode,
    purpose: "password_reset",
    usedAt: { $exists: false },
    expiresAt: { $gt: /* @__PURE__ */ new Date() }
  });
  if (!reset) {
    throw new Error("Invalid or expired reset code.");
  }
  const passwordHash = await hashPassword(newPassword);
  user.passwordHash = passwordHash;
  user.loginMethod = "password";
  await user.save();
  reset.usedAt = /* @__PURE__ */ new Date();
  await reset.save();
  return {
    success: true
  };
}
var CUSTOMER_COOKIE, ORDER_CONFIRMATION_COOKIE, encoder, sessionKey, findCustomerByPhone;
var init_customerSession = __esm({
  "server/customerSession.ts"() {
    "use strict";
    init_db();
    init_models();
    CUSTOMER_COOKIE = "rabiora_customer_session";
    ORDER_CONFIRMATION_COOKIE = "rabiora_order_confirmation";
    encoder = new TextEncoder();
    sessionKey = () => encoder.encode(getJwtSecret());
    findCustomerByPhone = findCustomerByIdentifier;
  }
});

// server/cartRules.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
function assertCartStock(isInStock, stockQuantity, requestedQuantity) {
  if (!isInStock || stockQuantity < 1) throw new TRPCError3({ code: "BAD_REQUEST", message: "This product is out of stock." });
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > stockQuantity) {
    throw new TRPCError3({ code: "BAD_REQUEST", message: "Requested quantity exceeds available stock." });
  }
}
function nextCartQuantity(existingQuantity, addedQuantity, stockQuantity, isInStock) {
  const next = existingQuantity + addedQuantity;
  assertCartStock(isInStock, stockQuantity, next);
  return next;
}
function shouldRemoveCartItem(quantity) {
  return quantity === 0;
}
var init_cartRules = __esm({
  "server/cartRules.ts"() {
    "use strict";
  }
});

// server/cartService.ts
var cartService_exports = {};
__export(cartService_exports, {
  addCartItem: () => addCartItem,
  getCart: () => getCart,
  mergeGuestCart: () => mergeGuestCart,
  resolveCartIdentity: () => resolveCartIdentity,
  updateCartItem: () => updateCartItem
});
import { TRPCError as TRPCError4 } from "@trpc/server";
function unavailable() {
  return new TRPCError4({ code: "SERVICE_UNAVAILABLE", message: "Cart is temporarily unavailable." });
}
async function resolveCartIdentity(req, manuscriptUser, anonymousToken) {
  if (manuscriptUser) return { userId: String(manuscriptUser.id || manuscriptUser.openId) };
  const customer = await getCustomerFromRequest(req);
  if (customer) return { userId: String(customer.id) };
  if (!anonymousToken || !/^[a-zA-Z0-9_-]{20,128}$/.test(anonymousToken)) {
    throw new TRPCError4({ code: "BAD_REQUEST", message: "A valid guest-cart token is required." });
  }
  return { anonymousToken };
}
async function getOrCreateCart(identity) {
  await connectMongo();
  let query = {};
  if (identity.userId) {
    const userDoc = await UserModel.findOne(findUserQuery(identity.userId));
    if (userDoc) {
      query = { userId: userDoc._id };
    } else {
      query = { userId: identity.userId };
    }
  } else if (identity.anonymousToken) {
    query = { anonymousToken: identity.anonymousToken };
  } else {
    throw unavailable();
  }
  let cart = await CartModel.findOne(query);
  if (!cart) {
    cart = await CartModel.create({
      ...query,
      items: []
    });
  }
  return cart;
}
async function getCart(identity) {
  const cart = await getOrCreateCart(identity);
  await cart.populate({
    path: "items.productId",
    model: "Product"
  });
  const items = (cart.items || []).filter((item) => item.productId != null).map((item) => {
    const product = item.productId;
    const coverImage = (product.images || []).find((img) => img.isCover) || (product.images || [])[0];
    const priceTaka = product.priceTaka || 0;
    const quantity = item.quantity || 1;
    return {
      itemId: item._id ? item._id.toString() : product._id.toString(),
      productId: product.legacyId ?? product._id.toString(),
      slug: product.slug,
      name: product.name,
      priceTaka,
      stockQuantity: product.stockQuantity || 0,
      isInStock: product.isInStock ?? true,
      imageUrl: coverImage ? coverImage.storageUrl : "",
      quantity,
      lineTotalTaka: priceTaka * quantity
    };
  });
  const subtotalTaka = items.reduce((sum, item) => sum + item.lineTotalTaka, 0);
  return {
    id: cart._id.toString(),
    items,
    subtotalTaka
  };
}
async function addCartItem(identity, productId, requestedQuantity = 1) {
  await connectMongo();
  const cart = await getOrCreateCart(identity);
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) {
    throw new TRPCError4({ code: "NOT_FOUND", message: "Product not found." });
  }
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === product._id.toString()
  );
  const currentQty = existingItemIndex >= 0 ? cart.items[existingItemIndex].quantity : 0;
  const nextQuantity = nextCartQuantity(currentQty, requestedQuantity, product.stockQuantity, product.isInStock);
  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity = nextQuantity;
  } else {
    cart.items.push({
      productId: product._id,
      quantity: requestedQuantity,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
  }
  await cart.save();
  return getCart(identity);
}
async function updateCartItem(identity, productId, quantity) {
  await connectMongo();
  const cart = await getOrCreateCart(identity);
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) {
    throw new TRPCError4({ code: "NOT_FOUND", message: "Product not found." });
  }
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === product._id.toString()
  );
  if (existingItemIndex >= 0) {
    if (shouldRemoveCartItem(quantity)) {
      cart.items.splice(existingItemIndex, 1);
    } else {
      assertCartStock(product.isInStock, product.stockQuantity, quantity);
      cart.items[existingItemIndex].quantity = quantity;
    }
    await cart.save();
  }
  return getCart(identity);
}
async function mergeGuestCart(userId, anonymousToken) {
  if (!anonymousToken || !/^[a-zA-Z0-9_-]{20,128}$/.test(anonymousToken)) return;
  await connectMongo();
  const guestCart = await CartModel.findOne({ anonymousToken }).populate("items.productId");
  if (!guestCart || guestCart.items.length === 0) return;
  const userIdentity = { userId: String(userId) };
  for (const item of guestCart.items) {
    if (item.productId) {
      try {
        const prod = item.productId;
        await addCartItem(userIdentity, prod.legacyId ?? prod._id.toString(), item.quantity);
      } catch {
      }
    }
  }
  await CartModel.deleteOne({ _id: guestCart._id });
}
var init_cartService = __esm({
  "server/cartService.ts"() {
    "use strict";
    init_db();
    init_models();
    init_customerSession();
    init_cartRules();
  }
});

// server/app.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
init_db();
init_User();

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Retained only for the existing optional voice-transcription integration.
  // Product, payment, and administrator images use server/localMedia.ts instead.
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  await connectMongo();
  const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  const updateData = {
    role,
    lastSignedIn: user.lastSignedIn || /* @__PURE__ */ new Date()
  };
  if (user.name !== void 0) updateData.name = user.name;
  if (user.email !== void 0) updateData.email = user.email;
  if (user.phone !== void 0) updateData.phone = user.phone;
  if (user.loginMethod !== void 0) updateData.loginMethod = user.loginMethod;
  if (user.passwordHash !== void 0) updateData.passwordHash = user.passwordHash;
  const doc = await UserModel.findOneAndUpdate(
    { openId: user.openId },
    {
      $set: updateData,
      $setOnInsert: {
        openId: user.openId
      }
    },
    { new: true, upsert: true }
  );
  return doc;
}
async function getUserByOpenId(openId) {
  await connectMongo();
  return UserModel.findOne({ openId });
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || void 0,
          email: userInfo.email ?? void 0,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? void 0,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: "-1",
    openId: userInfo.openId,
    name: userInfo.name || "Scheduled Task",
    email: void 0,
    loginMethod: void 0,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query ? req.query[key] : void 0;
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get(["/api/oauth/callback", "/oauth/callback"], async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const cookieHeader = req.get("cookie") || (typeof req.headers.cookie === "string" ? req.headers.cookie : "");
    const expectedNonce = parseCookieHeader2(cookieHeader)[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || void 0,
        email: userInfo.email || void 0,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? void 0,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/cors.ts
var ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
var ALLOWED_HEADERS = "Content-Type, Authorization, X-Requested-With, X-TRPC-Source, Accept, Origin";
function configuredOrigins(value = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL) {
  const defaults = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"];
  const list = (value ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
  return /* @__PURE__ */ new Set([...defaults, ...list]);
}
function isAllowedCorsOrigin(origin, requestOrigin, explicitOrigins = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL) {
  if (!origin) return true;
  if (origin === requestOrigin) return true;
  if (configuredOrigins(explicitOrigins).has(origin)) return true;
  if (origin.endsWith(".vercel.app") || origin.includes("localhost") || origin.includes("127.0.0.1")) return true;
  return false;
}
function applyCorsPolicy(req, res, next) {
  const origin = req.get ? req.get("origin") : req.headers?.origin;
  const host = req.get ? req.get("host") : req.headers?.host || "localhost";
  const protocol = req.headers && req.headers["x-forwarded-proto"] || req.protocol || "https";
  const requestOrigin = `${protocol}://${host}`;
  if (origin && isAllowedCorsOrigin(origin, requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}

// server/localMedia.ts
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { TRPCError } from "@trpc/server";
function getLocalImagesRoot() {
  return path.resolve(process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads", "images"));
}
function getProductRoot() {
  return path.join(getLocalImagesRoot(), "products");
}
var allowedExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};
function safeStem(fileName) {
  const stem = path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
  return stem || "product-image";
}
async function saveLocalProductImage(productId, bytes, mimeType, fileName) {
  const extension = allowedExtensions[mimeType];
  if (!extension) throw new TRPCError({ code: "BAD_REQUEST", message: "Use a JPEG, PNG, or WebP image." });
  const fileNameWithId = `${safeStem(fileName)}-${crypto.randomUUID().slice(0, 12)}${extension}`;
  const subFolder = typeof productId === "number" ? path.join("products", String(productId)) : String(productId);
  const directory = path.join(getLocalImagesRoot(), subFolder);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, fileNameWithId), bytes);
  const storageKey = path.posix.join(...subFolder.split(path.sep), fileNameWithId);
  return { key: storageKey, url: `/uploads/images/${storageKey}` };
}
async function removeLocalProductImage(storageKey) {
  if (!storageKey.startsWith("products/")) return;
  const normalized = path.posix.normalize(storageKey).replace(/^\.\.\//, "");
  if (normalized !== storageKey || normalized.includes("..")) return;
  const productRoot = getProductRoot();
  const absolutePath = path.resolve(getLocalImagesRoot(), normalized);
  if (!absolutePath.startsWith(productRoot)) return;
  await fs.unlink(absolutePath).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

// server/routers.ts
import { z as z6 } from "zod";

// server/catalogue.ts
init_db();
init_models();
import { TRPCError as TRPCError2 } from "@trpc/server";
async function listCatalogue(filters = {}) {
  await connectMongo();
  const filterQuery = {};
  if (filters.featured !== void 0) {
    filterQuery.featured = filters.featured;
  }
  if (filters.categorySlug) {
    const category = await CategoryModel.findOne({ slug: filters.categorySlug });
    if (category) {
      filterQuery.categoryId = category._id;
    } else {
      filterQuery.categorySlug = filters.categorySlug;
    }
  }
  if (filters.query && filters.query.trim()) {
    const regex = new RegExp(filters.query.trim(), "i");
    filterQuery.$or = [
      { name: regex },
      { fabric: regex },
      { color: regex },
      { details: regex }
    ];
  }
  const products = await ProductModel.find(filterQuery).sort({ featured: -1, legacyId: 1, createdAt: -1 }).lean();
  return products.map((p) => ({
    id: p.legacyId ?? p._id.toString(),
    _id: p._id.toString(),
    legacyId: p.legacyId ?? 0,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    details: p.details,
    fabric: p.fabric,
    color: p.color,
    priceTaka: p.priceTaka,
    oldPriceTaka: p.oldPriceTaka,
    discountPercent: p.discountPercent,
    stockQuantity: p.stockQuantity,
    isInStock: p.isInStock,
    featured: p.featured,
    categoryName: p.categoryName || "",
    categorySlug: p.categorySlug || "",
    images: (p.images || []).map((img, idx) => ({
      id: idx + 1,
      productId: p.legacyId ?? 0,
      storageKey: img.storageKey,
      storageUrl: img.storageUrl,
      altText: img.altText,
      position: img.position,
      isCover: img.isCover
    }))
  }));
}
async function getCatalogueProduct(slug) {
  await connectMongo();
  const p = await ProductModel.findOne({ slug }).lean();
  if (!p) {
    throw new TRPCError2({ code: "NOT_FOUND", message: "Product not found." });
  }
  return {
    id: p.legacyId ?? p._id.toString(),
    _id: p._id.toString(),
    legacyId: p.legacyId ?? 0,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    details: p.details,
    fabric: p.fabric,
    color: p.color,
    priceTaka: p.priceTaka,
    oldPriceTaka: p.oldPriceTaka,
    discountPercent: p.discountPercent,
    stockQuantity: p.stockQuantity,
    isInStock: p.isInStock,
    featured: p.featured,
    categoryName: p.categoryName || "",
    categorySlug: p.categorySlug || "",
    images: (p.images || []).map((img, idx) => ({
      id: idx + 1,
      productId: p.legacyId ?? 0,
      storageKey: img.storageKey,
      storageUrl: img.storageUrl,
      altText: img.altText,
      position: img.position,
      isCover: img.isCover
    }))
  };
}

// server/routers/customer.ts
init_customerSession();
init_cartService();
import { TRPCError as TRPCError8 } from "@trpc/server";
import { z } from "zod";

// server/reviewService.ts
init_db();
init_models();
import { TRPCError as TRPCError5 } from "@trpc/server";
function failUnavailable() {
  throw new TRPCError5({
    code: "SERVICE_UNAVAILABLE",
    message: "The review database is temporarily unavailable."
  });
}
function normalizeReview(value) {
  return value.trim().replace(/\s+/g, " ");
}
async function canCustomerReviewProduct(userId, productId, orderId) {
  await connectMongo();
  const user = await UserModel.findOne(findUserQuery(userId));
  if (!user) return false;
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) return false;
  const order = await OrderModel.findOne({
    ...findOrderQuery(orderId),
    userId: user._id,
    status: "delivered"
  });
  if (!order) return false;
  const hasItem = (order.items || []).some(
    (item) => item.productId?.toString() === product._id.toString() || item.productName === product.name
  );
  return hasItem;
}
async function createProductReview(userId, input) {
  await connectMongo();
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new TRPCError5({
      code: "BAD_REQUEST",
      message: "Rating must be between 1 and 5."
    });
  }
  const reviewText = normalizeReview(input.review);
  if (reviewText.length < 3) {
    throw new TRPCError5({
      code: "BAD_REQUEST",
      message: "Review must contain at least 3 characters."
    });
  }
  if (reviewText.length > 2e3) {
    throw new TRPCError5({
      code: "BAD_REQUEST",
      message: "Review must not exceed 2000 characters."
    });
  }
  const user = await UserModel.findOne(findUserQuery(userId));
  if (!user) failUnavailable();
  const product = await ProductModel.findOne(findProductQuery(input.productId));
  if (!product) {
    throw new TRPCError5({
      code: "NOT_FOUND",
      message: "Product not found."
    });
  }
  const eligible = await canCustomerReviewProduct(userId, input.productId, input.orderId);
  if (!eligible) {
    throw new TRPCError5({
      code: "FORBIDDEN",
      message: "You can review a product only after purchasing and receiving it."
    });
  }
  const existing = await ReviewModel.findOne({
    productId: product._id,
    userId: user._id
  });
  if (existing) {
    throw new TRPCError5({
      code: "CONFLICT",
      message: "You have already reviewed this product for this order."
    });
  }
  let orderDoc = null;
  if (input.orderId) {
    orderDoc = await OrderModel.findOne(findOrderQuery(input.orderId));
  }
  const created = await ReviewModel.create({
    productId: product._id,
    userId: user._id,
    orderId: orderDoc ? orderDoc._id : void 0,
    rating: input.rating,
    review: reviewText,
    isVisible: true
  });
  return {
    id: created._id.toString(),
    productId: product.legacyId ?? product._id.toString(),
    userId: user._id.toString(),
    orderId: orderDoc ? orderDoc.orderNumber : String(input.orderId),
    rating: created.rating,
    review: created.review,
    isVisible: created.isVisible,
    createdAt: created.createdAt
  };
}
async function listProductReviews(productId) {
  await connectMongo();
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) return [];
  const reviews = await ReviewModel.find({
    productId: product._id,
    isVisible: true
  }).populate("userId", "name").sort({ createdAt: -1 }).lean();
  return reviews.map((r) => {
    const u = r.userId;
    return {
      id: r._id.toString(),
      orderId: r.orderId?.toString() || "",
      productId: product.legacyId ?? product._id.toString(),
      userId: u?._id?.toString(),
      rating: r.rating,
      review: r.review,
      isVisible: r.isVisible,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      customerName: u?.name || "Customer"
    };
  });
}
async function listAdminReviews() {
  await connectMongo();
  const reviews = await ReviewModel.find().populate("productId", "name legacyId").populate("userId", "name phone").sort({ createdAt: -1 }).lean();
  return reviews.map((r) => {
    const p = r.productId;
    const u = r.userId;
    return {
      id: r._id.toString(),
      orderId: r.orderId?.toString() || "",
      productId: p?.legacyId ?? p?._id?.toString(),
      productName: p?.name || "Product",
      userId: u?._id?.toString(),
      customerName: u?.name || "Customer",
      customerPhone: u?.phone || "",
      rating: r.rating,
      review: r.review,
      isVisible: r.isVisible,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    };
  });
}
async function setReviewVisibility(reviewId, isVisible) {
  await connectMongo();
  const review = await ReviewModel.findById(reviewId);
  if (!review) {
    throw new TRPCError5({
      code: "NOT_FOUND",
      message: "Review not found."
    });
  }
  review.isVisible = isVisible;
  await review.save();
  return {
    success: true,
    isVisible
  };
}
async function deleteProductReview(reviewId) {
  await connectMongo();
  await ReviewModel.findByIdAndDelete(reviewId);
  return {
    success: true
  };
}
async function getProductRatingSummary(productId) {
  await connectMongo();
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) {
    return { averageRating: 0, totalReviews: 0 };
  }
  const reviews = await ReviewModel.find({
    productId: product._id,
    isVisible: true
  }).lean();
  if (reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }
  const totalReviews = reviews.length;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  return {
    averageRating: Math.round(avg * 10) / 10,
    totalReviews
  };
}
async function listVisibleReviewsForHome() {
  await connectMongo();
  const reviews = await ReviewModel.find({ isVisible: true }).populate("productId", "name legacyId").populate("userId", "name").sort({ createdAt: -1 }).limit(6).lean();
  return reviews.map((r) => {
    const p = r.productId;
    const u = r.userId;
    return {
      id: r._id.toString(),
      productId: p?.legacyId ?? p?._id?.toString(),
      productName: p?.name || "Product",
      customerName: u?.name || "Verified Buyer",
      rating: r.rating,
      review: r.review,
      createdAt: r.createdAt,
      isVisible: r.isVisible
    };
  });
}

// server/authRateLimit.ts
import { TRPCError as TRPCError6 } from "@trpc/server";
var attempts = /* @__PURE__ */ new Map();
var WINDOW_MS = 15 * 60 * 1e3;
var LIMIT = 8;
function enforceAuthRateLimit(key) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (current.count >= LIMIT) {
    throw new TRPCError6({ code: "TOO_MANY_REQUESTS", message: "Too many account attempts. Please wait a few minutes and try again." });
  }
  current.count += 1;
}
function resetAuthRateLimit(key) {
  attempts.delete(key);
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError7 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError7({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError7({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/routers/customer.ts
var phoneSchema = z.string().trim().min(11).max(20).refine(
  (value) => Boolean(normalizeBangladeshPhone(value)),
  "Enter a valid Bangladesh phone number."
);
var guestTokenSchema = z.string().regex(/^[a-zA-Z0-9_-]{20,128}$/).optional();
var idSchema = z.union([z.number(), z.string()]);
var loginIdentifierSchema = z.string().trim().min(3).max(120).refine(
  (value) => Boolean(normalizeBangladeshPhone(value)) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.startsWith("admin_"),
  "Enter a valid Bangladesh phone number or email address."
);
var customerRouter = router({
  me: publicProcedure.query(
    async ({ ctx }) => ctx.user ?? getCustomerFromRequest(ctx.req)
  ),
  register: publicProcedure.input(
    z.object({
      name: z.string().trim().min(2).max(160),
      phone: phoneSchema,
      password: z.string().refine(
        isValidCustomerPassword,
        "Password must contain 8\u201372 characters."
      ),
      anonymousToken: guestTokenSchema
    })
  ).mutation(async ({ ctx, input }) => {
    const rateKey = `register:${ctx.req.ip ?? "unknown"}:${input.phone}`;
    enforceAuthRateLimit(rateKey);
    const existing = await findCustomerByPhone(input.phone);
    if (existing) {
      throw new TRPCError8({
        code: "CONFLICT",
        message: "An account already exists for this phone number."
      });
    }
    const customer = await createCustomer(input);
    await mergeGuestCart(
      customer.id,
      input.anonymousToken
    );
    await setCustomerSession(ctx.res, customer, ctx.req);
    resetAuthRateLimit(rateKey);
    return customer;
  }),
  login: publicProcedure.input(
    z.object({
      phone: loginIdentifierSchema,
      password: z.string().min(1).max(72),
      anonymousToken: guestTokenSchema
    })
  ).mutation(async ({ ctx, input }) => {
    const rateKey = `login:${ctx.req.ip ?? "unknown"}:${input.phone}`;
    enforceAuthRateLimit(rateKey);
    const customer = await findCustomerByIdentifier(
      input.phone
    );
    if (!customer?.passwordHash || !await verifyPassword(
      input.password,
      customer.passwordHash
    )) {
      throw new TRPCError8({
        code: "UNAUTHORIZED",
        message: "Phone number or password is incorrect."
      });
    }
    const customerId = customer._id ? customer._id.toString() : customer.openId;
    await mergeGuestCart(
      customerId,
      input.anonymousToken
    );
    const sessionCustomer = {
      id: customerId,
      openId: customer.openId,
      name: customer.name ?? null,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      role: customer.role
    };
    await setCustomerSession(
      ctx.res,
      sessionCustomer,
      ctx.req
    );
    const token = await signCustomerSession(sessionCustomer);
    resetAuthRateLimit(rateKey);
    return {
      ...sessionCustomer,
      token
    };
  }),
  logout: publicProcedure.mutation(({ ctx }) => {
    clearCustomerSession(ctx.res, ctx.req);
    return {
      success: true
    };
  }),
  updateProfile: publicProcedure.input(
    z.object({
      name: z.string().trim().min(2).max(160),
      email: z.string().trim().email().max(320).optional().or(z.literal(""))
    })
  ).mutation(async ({ ctx, input }) => {
    const customer = await getCustomerFromRequest(
      ctx.req
    );
    if (!customer) {
      throw new TRPCError8({
        code: "UNAUTHORIZED",
        message: "Sign in to update your profile."
      });
    }
    return updateCustomerProfile(
      customer.id,
      input
    );
  }),
  requestPasswordReset: publicProcedure.input(
    z.object({
      phone: phoneSchema
    })
  ).mutation(async ({ input }) => {
    return createPasswordResetRequest(
      input.phone
    );
  }),
  resetPassword: publicProcedure.input(
    z.object({
      phone: phoneSchema,
      otpCode: z.string().regex(
        /^\d{6}$/,
        "Enter the 6-digit verification code."
      ),
      newPassword: z.string().refine(
        isValidCustomerPassword,
        "Password must contain 8\u201372 characters."
      )
    })
  ).mutation(async ({ input }) => {
    return resetCustomerPassword({
      phone: input.phone,
      otpCode: input.otpCode,
      newPassword: input.newPassword
    });
  }),
  createReview: publicProcedure.input(
    z.object({
      productId: idSchema,
      orderId: idSchema,
      rating: z.number().int().min(1).max(5),
      review: z.string().trim().min(3).max(2e3)
    })
  ).mutation(async ({ ctx, input }) => {
    const customer = await getCustomerFromRequest(
      ctx.req
    );
    if (!customer) {
      throw new TRPCError8({
        code: "UNAUTHORIZED",
        message: "Sign in to write a review."
      });
    }
    return createProductReview(
      customer.id,
      input
    );
  }),
  productReviews: publicProcedure.input(
    z.object({
      productId: idSchema
    })
  ).query(
    ({ input }) => listProductReviews(input.productId)
  ),
  productRating: publicProcedure.input(
    z.object({
      productId: idSchema
    })
  ).query(
    ({ input }) => getProductRatingSummary(input.productId)
  ),
  homeReviews: publicProcedure.query(
    () => listVisibleReviewsForHome()
  )
});
var cartRouter = router({
  get: publicProcedure.input(
    z.object({
      anonymousToken: guestTokenSchema
    })
  ).query(async ({ ctx, input }) => {
    const identity = await resolveCartIdentity(
      ctx.req,
      ctx.user,
      input.anonymousToken
    );
    const { getCart: getCart2 } = await Promise.resolve().then(() => (init_cartService(), cartService_exports));
    return getCart2(identity);
  }),
  add: publicProcedure.input(
    z.object({
      anonymousToken: guestTokenSchema,
      productId: idSchema,
      quantity: z.number().int().min(1).max(20).default(1)
    })
  ).mutation(async ({ ctx, input }) => {
    const identity = await resolveCartIdentity(
      ctx.req,
      ctx.user,
      input.anonymousToken
    );
    const { addCartItem: addCartItem2 } = await Promise.resolve().then(() => (init_cartService(), cartService_exports));
    return addCartItem2(
      identity,
      input.productId,
      input.quantity
    );
  }),
  update: publicProcedure.input(
    z.object({
      anonymousToken: guestTokenSchema,
      productId: idSchema,
      quantity: z.number().int().min(0).max(20)
    })
  ).mutation(async ({ ctx, input }) => {
    const identity = await resolveCartIdentity(
      ctx.req,
      ctx.user,
      input.anonymousToken
    );
    const { updateCartItem: updateCartItem2 } = await Promise.resolve().then(() => (init_cartService(), cartService_exports));
    return updateCartItem2(
      identity,
      input.productId,
      input.quantity
    );
  })
});

// server/routers/wishlist.ts
init_customerSession();
import { TRPCError as TRPCError10 } from "@trpc/server";
import { z as z2 } from "zod";

// server/wishlistService.ts
init_db();
init_models();
import { TRPCError as TRPCError9 } from "@trpc/server";
async function getWishlist(userId) {
  await connectMongo();
  const user = await UserModel.findOne(findUserQuery(userId));
  if (!user) return [];
  const items = await WishlistItemModel.find({ userId: user._id }).populate("productId").lean();
  return items.filter((item) => item.productId != null).map((item) => {
    const product = item.productId;
    const cover = (product.images || []).find((i) => i.isCover) || (product.images || [])[0];
    return {
      productId: product.legacyId ?? product._id.toString(),
      name: product.name,
      slug: product.slug,
      priceTaka: product.priceTaka,
      imageUrl: cover ? cover.storageUrl : ""
    };
  });
}
async function addWishlistItem(userId, productId) {
  await connectMongo();
  const user = await UserModel.findOne(findUserQuery(userId));
  if (!user) {
    throw new TRPCError9({ code: "UNAUTHORIZED", message: "Please log in to manage your wishlist." });
  }
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) {
    throw new TRPCError9({ code: "NOT_FOUND", message: "Product not found." });
  }
  await WishlistItemModel.findOneAndUpdate(
    { userId: user._id, productId: product._id },
    { $setOnInsert: { userId: user._id, productId: product._id } },
    { upsert: true }
  );
  return getWishlist(userId);
}
async function removeWishlistItem(userId, productId) {
  await connectMongo();
  const user = await UserModel.findOne(findUserQuery(userId));
  if (!user) return [];
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (product) {
    await WishlistItemModel.deleteOne({ userId: user._id, productId: product._id });
  }
  return getWishlist(userId);
}

// server/routers/wishlist.ts
var idSchema2 = z2.union([z2.number(), z2.string()]);
async function requireWishlistUser(ctx) {
  const user = ctx.user ?? await getCustomerFromRequest(ctx.req);
  if (!user) throw new TRPCError10({ code: "UNAUTHORIZED", message: "Sign in to save this item to your wishlist." });
  return user;
}
var wishlistRouter = router({
  list: publicProcedure.query(async ({ ctx }) => getWishlist((await requireWishlistUser(ctx)).id)),
  add: publicProcedure.input(z2.object({ productId: idSchema2 })).mutation(async ({ ctx, input }) => addWishlistItem((await requireWishlistUser(ctx)).id, input.productId)),
  remove: publicProcedure.input(z2.object({ productId: idSchema2 })).mutation(async ({ ctx, input }) => removeWishlistItem((await requireWishlistUser(ctx)).id, input.productId)),
  mergeGuest: publicProcedure.input(z2.object({ productIds: z2.array(idSchema2).max(100) })).mutation(async ({ ctx, input }) => {
    const user = await requireWishlistUser(ctx);
    for (const productId of Array.from(new Set(input.productIds))) await addWishlistItem(user.id, productId);
    return getWishlist(user.id);
  })
});

// server/routers/orders.ts
import { z as z3 } from "zod";
import { TRPCError as TRPCError13 } from "@trpc/server";

// server/orderService.ts
init_db();
init_models();
import { TRPCError as TRPCError12 } from "@trpc/server";
import { nanoid as nanoid2 } from "nanoid";

// server/couponService.ts
init_db();
init_Coupon();
import { TRPCError as TRPCError11 } from "@trpc/server";
function isOnlinePayment(method) {
  const normalized = method.trim().toLowerCase();
  return normalized === "bkash" || normalized === "nagad" || normalized === "rocket";
}
function normalizePaymentMethodName(method) {
  const normalized = method.trim().toLowerCase();
  if (normalized === "bkash") return "bKash";
  if (normalized === "nagad") return "Nagad";
  if (normalized === "rocket") return "Rocket";
  if (normalized === "cash on delivery" || normalized === "cod") return "Cash on Delivery";
  return method.trim();
}
async function ensureDefaultCoupons() {
  const count = await CouponModel.countDocuments();
  if (count === 0) {
    await CouponModel.create([
      {
        code: "RABIORA10",
        discountType: "percentage",
        discountValue: 10,
        isActive: true,
        allowedPaymentMethods: ["bKash", "Nagad", "Rocket"],
        minOrderAmount: 0
      },
      {
        code: "BKASH10",
        discountType: "percentage",
        discountValue: 10,
        isActive: true,
        allowedPaymentMethods: ["bKash", "Nagad", "Rocket"],
        minOrderAmount: 0
      }
    ]);
  }
}
async function validateCoupon(code, subtotalTaka, paymentMethod) {
  await connectMongo();
  await ensureDefaultCoupons();
  const normalizedCode = (code || "").trim().toUpperCase();
  if (!normalizedCode) {
    throw new TRPCError11({ code: "BAD_REQUEST", message: "Please enter a coupon code." });
  }
  if (!isOnlinePayment(paymentMethod)) {
    throw new TRPCError11({
      code: "BAD_REQUEST",
      message: "Coupons are available exclusively for online payment methods (bKash, Nagad, Rocket)."
    });
  }
  const coupon = await CouponModel.findOne({ code: normalizedCode }).lean();
  if (!coupon) {
    throw new TRPCError11({ code: "BAD_REQUEST", message: "Invalid coupon code." });
  }
  if (!coupon.isActive) {
    throw new TRPCError11({ code: "BAD_REQUEST", message: "This coupon is currently inactive." });
  }
  if (coupon.expiryDate && /* @__PURE__ */ new Date() > new Date(coupon.expiryDate)) {
    throw new TRPCError11({ code: "BAD_REQUEST", message: "This coupon code has expired." });
  }
  if (coupon.minOrderAmount && subtotalTaka < coupon.minOrderAmount) {
    throw new TRPCError11({
      code: "BAD_REQUEST",
      message: `Minimum order amount of \u09F3${coupon.minOrderAmount.toLocaleString("en-BD")} required to use this coupon.`
    });
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new TRPCError11({
      code: "BAD_REQUEST",
      message: "This coupon has reached its maximum redemption limit."
    });
  }
  const normalizedMethod = normalizePaymentMethodName(paymentMethod);
  const allowed = coupon.allowedPaymentMethods || ["bKash", "Nagad", "Rocket"];
  const isMethodAllowed = allowed.some(
    (m) => m.toLowerCase() === normalizedMethod.toLowerCase()
  );
  if (!isMethodAllowed) {
    throw new TRPCError11({
      code: "BAD_REQUEST",
      message: `This coupon is only valid for: ${allowed.join(", ")}.`
    });
  }
  const discountPercent = coupon.discountValue;
  const discountAmount = Math.min(
    subtotalTaka,
    Math.round(subtotalTaka * discountPercent / 100)
  );
  const payableSubtotal = Math.max(0, subtotalTaka - discountAmount);
  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountPercent,
    discountAmount,
    payableSubtotal,
    message: `${discountPercent}% discount applied successfully!`
  };
}
async function incrementCouponUsage(code) {
  await connectMongo();
  const normalizedCode = (code || "").trim().toUpperCase();
  if (!normalizedCode) return;
  await CouponModel.updateOne(
    { code: normalizedCode },
    { $inc: { usedCount: 1 } }
  );
}
async function listAdminCoupons() {
  await connectMongo();
  await ensureDefaultCoupons();
  const coupons = await CouponModel.find().sort({ createdAt: -1 }).lean();
  return coupons.map((c) => ({
    id: c._id.toString(),
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue,
    isActive: c.isActive,
    expiryDate: c.expiryDate,
    minOrderAmount: c.minOrderAmount || 0,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount || 0,
    allowedPaymentMethods: c.allowedPaymentMethods || ["bKash", "Nagad", "Rocket"],
    createdAt: c.createdAt
  }));
}
async function createAdminCoupon(input) {
  await connectMongo();
  const normalizedCode = input.code.trim().toUpperCase();
  if (!normalizedCode) {
    throw new TRPCError11({ code: "BAD_REQUEST", message: "Coupon code is required." });
  }
  const existing = await CouponModel.findOne({ code: normalizedCode });
  if (existing) {
    throw new TRPCError11({ code: "BAD_REQUEST", message: `Coupon with code "${normalizedCode}" already exists.` });
  }
  if (input.discountValue < 1 || input.discountValue > 100) {
    throw new TRPCError11({ code: "BAD_REQUEST", message: "Discount percentage must be between 1 and 100." });
  }
  const created = await CouponModel.create({
    code: normalizedCode,
    discountType: input.discountType || "percentage",
    discountValue: input.discountValue,
    isActive: input.isActive ?? true,
    expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
    minOrderAmount: input.minOrderAmount ?? 0,
    usageLimit: input.usageLimit ?? null,
    allowedPaymentMethods: input.allowedPaymentMethods && input.allowedPaymentMethods.length > 0 ? input.allowedPaymentMethods : ["bKash", "Nagad", "Rocket"]
  });
  return {
    id: created._id.toString(),
    code: created.code,
    discountValue: created.discountValue,
    isActive: created.isActive
  };
}
async function updateAdminCoupon(id, input) {
  await connectMongo();
  const normalizedCode = input.code ? input.code.trim().toUpperCase() : void 0;
  if (normalizedCode) {
    const existing = await CouponModel.findOne({ code: normalizedCode, _id: { $ne: id } });
    if (existing) {
      throw new TRPCError11({ code: "BAD_REQUEST", message: `Another coupon with code "${normalizedCode}" already exists.` });
    }
  }
  if (input.discountValue !== void 0 && (input.discountValue < 1 || input.discountValue > 100)) {
    throw new TRPCError11({ code: "BAD_REQUEST", message: "Discount percentage must be between 1 and 100." });
  }
  const updated = await CouponModel.findByIdAndUpdate(
    id,
    {
      $set: {
        ...normalizedCode !== void 0 && { code: normalizedCode },
        ...input.discountType !== void 0 && { discountType: input.discountType },
        ...input.discountValue !== void 0 && { discountValue: input.discountValue },
        ...input.isActive !== void 0 && { isActive: input.isActive },
        ...input.expiryDate !== void 0 && { expiryDate: input.expiryDate ? new Date(input.expiryDate) : null },
        ...input.minOrderAmount !== void 0 && { minOrderAmount: input.minOrderAmount },
        ...input.usageLimit !== void 0 && { usageLimit: input.usageLimit },
        ...input.allowedPaymentMethods !== void 0 && { allowedPaymentMethods: input.allowedPaymentMethods }
      }
    },
    { new: true }
  ).lean();
  if (!updated) {
    throw new TRPCError11({ code: "NOT_FOUND", message: "Coupon not found." });
  }
  return {
    id: updated._id.toString(),
    code: updated.code,
    discountValue: updated.discountValue,
    isActive: updated.isActive
  };
}
async function deleteAdminCoupon(id) {
  await connectMongo();
  await CouponModel.findByIdAndDelete(id);
  return { success: true };
}

// server/orderService.ts
var PAYMENT_METHODS2 = ["bKash", "Nagad", "Rocket", "Cash on Delivery"];
function calculateDeliveryCharge(districtArea) {
  return /dhaka/i.test(districtArea) ? 0 : 120;
}
function manualPaymentRequired(method) {
  return method === "bKash" || method === "Nagad" || method === "Rocket";
}
function assertManualPaymentEvidence(method, transactionId, submittedAmountTaka) {
  if (manualPaymentRequired(method) && (!transactionId?.trim() || !submittedAmountTaka || submittedAmountTaka < 1)) {
    throw new TRPCError12({
      code: "BAD_REQUEST",
      message: "Transaction ID and submitted amount are required for this payment method."
    });
  }
}
function generateOrderNumber() {
  return `RAB-${Date.now().toString(36).toUpperCase()}-${nanoid2(5).toUpperCase()}`;
}
async function createOrder(identity, input) {
  await connectMongo();
  let userDoc = null;
  if (identity.userId) {
    userDoc = await UserModel.findOne(findUserQuery(identity.userId));
  }
  const orderItems = [];
  let rawSubtotalTaka = 0;
  if (input.buyNowItem) {
    const product = await ProductModel.findOne(findProductQuery(input.buyNowItem.productId));
    const qty = Math.max(1, input.buyNowItem.quantity || 1);
    if (!product || !product.isInStock || (product.stockQuantity || 0) < qty) {
      throw new TRPCError12({
        code: "BAD_REQUEST",
        message: `Product ${product?.name || "selected"} is out of stock.`
      });
    }
    const coverImage = (product.images || []).find((img) => img.isCover) || (product.images || [])[0];
    const unitPrice = product.priceTaka || 0;
    const lineTotal = unitPrice * qty;
    rawSubtotalTaka += lineTotal;
    orderItems.push({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      imageUrl: coverImage ? coverImage.storageUrl : "",
      unitPriceTaka: unitPrice,
      quantity: qty,
      lineTotalTaka: lineTotal
    });
  } else {
    let cartQuery = {};
    if (userDoc) {
      cartQuery = { userId: userDoc._id };
    } else if (identity.anonymousToken) {
      cartQuery = { anonymousToken: identity.anonymousToken };
    } else {
      throw new TRPCError12({ code: "BAD_REQUEST", message: "Your cart is empty." });
    }
    const cart = await CartModel.findOne(cartQuery).populate("items.productId");
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new TRPCError12({ code: "BAD_REQUEST", message: "Your cart is empty." });
    }
    for (const item of cart.items) {
      const product = item.productId;
      if (!product || !product.isInStock || (product.stockQuantity || 0) < item.quantity) {
        throw new TRPCError12({
          code: "BAD_REQUEST",
          message: `Product ${product?.name || "in cart"} is out of stock.`
        });
      }
      const coverImage = (product.images || []).find((img) => img.isCover) || (product.images || [])[0];
      const unitPrice = product.priceTaka || 0;
      const lineTotal = unitPrice * item.quantity;
      rawSubtotalTaka += lineTotal;
      orderItems.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        imageUrl: coverImage ? coverImage.storageUrl : "",
        unitPriceTaka: unitPrice,
        quantity: item.quantity,
        lineTotalTaka: lineTotal
      });
    }
  }
  let appliedCouponCode = void 0;
  let originalSubtotalTaka = void 0;
  let discountPercent = void 0;
  let discountAmountTaka = void 0;
  let finalSubtotalTaka = rawSubtotalTaka;
  if (input.couponCode && input.couponCode.trim()) {
    const couponValidation = await validateCoupon(
      input.couponCode,
      rawSubtotalTaka,
      input.paymentMethod
    );
    appliedCouponCode = couponValidation.code;
    originalSubtotalTaka = rawSubtotalTaka;
    discountPercent = couponValidation.discountPercent;
    discountAmountTaka = couponValidation.discountAmount;
    finalSubtotalTaka = couponValidation.payableSubtotal;
    await incrementCouponUsage(couponValidation.code);
  }
  const deliveryChargeTaka = calculateDeliveryCharge(input.districtArea);
  const totalTaka = finalSubtotalTaka + deliveryChargeTaka;
  assertManualPaymentEvidence(input.paymentMethod, input.transactionId, input.submittedAmountTaka);
  const orderNum = generateOrderNumber();
  const paymentRecord = {
    method: input.paymentMethod,
    expectedAmountTaka: totalTaka,
    submittedAmountTaka: manualPaymentRequired(input.paymentMethod) ? input.submittedAmountTaka : void 0,
    transactionId: manualPaymentRequired(input.paymentMethod) ? input.transactionId?.trim() : void 0,
    createdAt: /* @__PURE__ */ new Date()
  };
  const statusHistoryRecord = {
    previousStatus: void 0,
    nextStatus: "pending",
    actorUserId: userDoc ? userDoc._id : void 0,
    adminNote: "Order placed",
    createdAt: /* @__PURE__ */ new Date()
  };
  const order = await OrderModel.create({
    orderNumber: orderNum,
    userId: userDoc ? userDoc._id : void 0,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    districtArea: input.districtArea,
    fullAddress: input.fullAddress,
    subtotalTaka: finalSubtotalTaka,
    deliveryChargeTaka,
    totalTaka,
    couponCode: appliedCouponCode,
    originalSubtotalTaka,
    discountPercent,
    discountAmountTaka,
    paymentMethod: input.paymentMethod,
    status: "pending",
    items: orderItems,
    payments: [paymentRecord],
    statusHistory: [statusHistoryRecord]
  });
  if (input.buyNowItem) {
    const qty = Math.max(1, input.buyNowItem.quantity || 1);
    const prod = await ProductModel.findOne(findProductQuery(input.buyNowItem.productId));
    if (prod) {
      const nextStock = Math.max(0, (prod.stockQuantity || 0) - qty);
      prod.stockQuantity = nextStock;
      prod.isInStock = nextStock > 0;
      await prod.save();
    }
  } else {
    let cartQuery = {};
    if (userDoc) {
      cartQuery = { userId: userDoc._id };
    } else if (identity.anonymousToken) {
      cartQuery = { anonymousToken: identity.anonymousToken };
    }
    const cart = await CartModel.findOne(cartQuery).populate("items.productId");
    if (cart) {
      for (const item of cart.items) {
        const product = item.productId;
        if (product) {
          const nextStock = Math.max(0, (product.stockQuantity || 0) - item.quantity);
          await ProductModel.updateOne(
            { _id: product._id },
            {
              $set: {
                stockQuantity: nextStock,
                isInStock: nextStock > 0
              }
            }
          );
        }
      }
      cart.items = [];
      await cart.save();
    }
  }
  return {
    orderNumber: order.orderNumber,
    totalTaka: order.totalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    paymentMethod: input.paymentMethod,
    items: orderItems.map((line) => ({
      name: line.productName,
      quantity: line.quantity,
      lineTotalTaka: line.lineTotalTaka
    }))
  };
}
async function getOrderConfirmation(orderNumberValue) {
  await connectMongo();
  const order = await OrderModel.findOne(findOrderQuery(orderNumberValue)).lean();
  if (!order) {
    throw new TRPCError12({ code: "NOT_FOUND", message: "Order not found." });
  }
  return {
    orderNumber: order.orderNumber,
    subtotalTaka: order.subtotalTaka,
    totalTaka: order.totalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    couponCode: order.couponCode,
    originalSubtotalTaka: order.originalSubtotalTaka,
    discountPercent: order.discountPercent,
    discountAmountTaka: order.discountAmountTaka,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt
  };
}
async function getCustomerOrderConfirmation(userId, orderNumberValue) {
  await connectMongo();
  const user = await UserModel.findOne(findUserQuery(userId));
  const order = await OrderModel.findOne({
    orderNumber: orderNumberValue,
    ...user ? { userId: user._id } : {}
  }).lean();
  if (!order) {
    throw new TRPCError12({ code: "NOT_FOUND", message: "Order not found." });
  }
  return {
    orderNumber: order.orderNumber,
    subtotalTaka: order.subtotalTaka,
    totalTaka: order.totalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    couponCode: order.couponCode,
    originalSubtotalTaka: order.originalSubtotalTaka,
    discountPercent: order.discountPercent,
    discountAmountTaka: order.discountAmountTaka,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt
  };
}
async function getCustomerOrderDetail(userId, orderNumberValue) {
  await connectMongo();
  const user = await UserModel.findOne(findUserQuery(userId));
  const order = await OrderModel.findOne({
    orderNumber: orderNumberValue,
    ...user ? { userId: user._id } : {}
  }).lean();
  if (!order) {
    throw new TRPCError12({ code: "NOT_FOUND", message: "Order not found." });
  }
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    districtArea: order.districtArea,
    fullAddress: order.fullAddress,
    subtotalTaka: order.subtotalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    totalTaka: order.totalTaka,
    couponCode: order.couponCode,
    originalSubtotalTaka: order.originalSubtotalTaka,
    discountPercent: order.discountPercent,
    discountAmountTaka: order.discountAmountTaka,
    paymentMethod: order.paymentMethod,
    status: order.status,
    adminNote: order.adminNote,
    createdAt: order.createdAt,
    items: (order.items || []).map((item, idx) => ({
      id: item._id ? item._id.toString() : idx + 1,
      productId: item.productId?.toString(),
      productName: item.productName,
      sku: item.sku,
      imageUrl: item.imageUrl,
      unitPriceTaka: item.unitPriceTaka,
      quantity: item.quantity,
      lineTotalTaka: item.lineTotalTaka
    })),
    payment: order.payments && order.payments[0] ? order.payments[0] : null,
    statusHistory: (order.statusHistory || []).map((sh, idx) => ({
      id: sh._id ? sh._id.toString() : idx + 1,
      nextStatus: sh.nextStatus,
      adminNote: sh.adminNote,
      createdAt: sh.createdAt
    }))
  };
}
async function listCustomerOrders(userId) {
  await connectMongo();
  const user = await UserModel.findOne(findUserQuery(userId));
  if (!user) return [];
  const customerOrders = await OrderModel.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
  return customerOrders.map((order) => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    districtArea: order.districtArea,
    fullAddress: order.fullAddress,
    subtotalTaka: order.subtotalTaka,
    deliveryChargeTaka: order.deliveryChargeTaka,
    totalTaka: order.totalTaka,
    couponCode: order.couponCode,
    originalSubtotalTaka: order.originalSubtotalTaka,
    discountPercent: order.discountPercent,
    discountAmountTaka: order.discountAmountTaka,
    paymentMethod: order.paymentMethod,
    status: order.status,
    adminNote: order.adminNote,
    createdAt: order.createdAt,
    items: (order.items || []).map((item, idx) => ({
      id: item._id ? item._id.toString() : idx + 1,
      orderId: order._id.toString(),
      productId: item.productId?.toString(),
      productName: item.productName,
      sku: item.sku,
      imageUrl: item.imageUrl,
      unitPriceTaka: item.unitPriceTaka,
      quantity: item.quantity,
      lineTotalTaka: item.lineTotalTaka
    }))
  }));
}

// server/routers/orders.ts
init_customerSession();
init_cartService();

// server/whatsapp.ts
var RABIORA_OWNER_WHATSAPP = "8801349529274";
var clickToWhatsAppProvider = {
  createCustomerHandoff(order) {
    const itemLines = order.items.map((item) => `- ${item.quantity} \xD7 ${item.name} \u2014 \u09F3${item.lineTotalTaka.toLocaleString("en-BD")}`).join("\n");
    const message = [
      "Rabiora Order",
      `Order: ${order.orderNumber}`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `Delivery area: ${order.districtArea}`,
      `Address: ${order.fullAddress}`,
      "Products:",
      itemLines,
      `Payment: ${order.paymentMethod}`,
      `Total: \u09F3${order.totalTaka.toLocaleString("en-BD")}`
    ].join("\n");
    return { url: `https://wa.me/${RABIORA_OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`, message };
  }
};
function createCustomerHandoffSafely(provider, order) {
  try {
    return provider.createCustomerHandoff(order);
  } catch (error) {
    console.warn("[WhatsApp] Click-to-WhatsApp handoff generation failed after order creation.", error);
    return null;
  }
}

// server/routers/orders.ts
var guestToken = z3.string().regex(/^[a-zA-Z0-9_-]{20,128}$/).optional();
var orderRouter = router({
  checkout: publicProcedure.input(z3.object({
    anonymousToken: guestToken,
    customerName: z3.string().trim().min(2).max(160),
    customerPhone: z3.string().trim().min(11).max(20).refine((value) => Boolean(normalizeBangladeshPhone(value)), "Enter a valid Bangladesh phone number."),
    districtArea: z3.string().trim().min(2).max(180),
    fullAddress: z3.string().trim().min(8).max(1e3),
    paymentMethod: z3.enum(PAYMENT_METHODS2),
    transactionId: z3.string().trim().min(3).max(120).optional(),
    submittedAmountTaka: z3.number().int().positive().max(1e6).optional(),
    couponCode: z3.string().trim().max(50).optional(),
    buyNowItem: z3.object({
      productId: z3.union([z3.string(), z3.number()]),
      quantity: z3.number().int().positive().max(100)
    }).optional()
  })).mutation(async ({ ctx, input }) => {
    const customer = ctx.user ?? await getCustomerFromRequest(ctx.req);
    if (!customer) {
      throw new TRPCError13({
        code: "UNAUTHORIZED",
        message: "Please sign in to your Rabiora account to complete your order."
      });
    }
    const identity = await resolveCartIdentity(ctx.req, customer, input.anonymousToken);
    const normalizedPhone = normalizeBangladeshPhone(input.customerPhone);
    const created = await createOrder(identity, { ...input, customerPhone: normalizedPhone });
    if (!identity.userId) await setGuestOrderConfirmation(ctx.res, created.orderNumber);
    const clickToWhatsApp = createCustomerHandoffSafely(clickToWhatsAppProvider, {
      orderNumber: created.orderNumber,
      customerName: input.customerName,
      customerPhone: normalizedPhone,
      districtArea: input.districtArea,
      fullAddress: input.fullAddress,
      totalTaka: created.totalTaka,
      paymentMethod: created.paymentMethod,
      items: created.items
    });
    return { ...created, clickToWhatsAppUrl: clickToWhatsApp?.url ?? null };
  }),
  confirmation: publicProcedure.input(z3.object({ orderNumber: z3.string().trim().regex(/^RAB-[A-Z0-9_-]+$/) })).query(async ({ ctx, input }) => {
    const customer = ctx.user ?? await getCustomerFromRequest(ctx.req);
    if (customer) return getCustomerOrderConfirmation(customer.id, input.orderNumber);
    if (!await hasGuestOrderConfirmationAccess(ctx.req, input.orderNumber)) throw new TRPCError13({ code: "FORBIDDEN", message: "This order confirmation is not available in the current session." });
    return getOrderConfirmation(input.orderNumber);
  }),
  mine: publicProcedure.query(async ({ ctx }) => {
    const customer = ctx.user ?? await getCustomerFromRequest(ctx.req);
    if (!customer) throw new TRPCError13({ code: "UNAUTHORIZED", message: "Sign in to view order history." });
    return listCustomerOrders(customer.id);
  }),
  detail: publicProcedure.input(z3.object({ orderNumber: z3.string().trim().regex(/^RAB-[A-Z0-9_-]+$/) })).query(async ({ ctx, input }) => {
    const customer = ctx.user ?? await getCustomerFromRequest(ctx.req);
    if (!customer) throw new TRPCError13({ code: "UNAUTHORIZED", message: "Sign in to view order details." });
    return getCustomerOrderDetail(customer.id, input.orderNumber);
  }),
  paymentRules: publicProcedure.query(() => ({ methods: PAYMENT_METHODS2, manualPaymentRequired }))
});

// server/routers/admin.ts
import { z as z4 } from "zod";

// server/adminService.ts
init_db();
init_models();
import { TRPCError as TRPCError15 } from "@trpc/server";

// server/storage.ts
import { v2 as cloudinary } from "cloudinary";
import path2 from "node:path";
import { TRPCError as TRPCError14 } from "@trpc/server";
var allowedExtensions2 = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};
function safeStem2(fileName) {
  const stem = path2.basename(fileName, path2.extname(fileName)).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
  return stem || "product-image";
}
function getCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  if (cloudinaryUrl) {
    try {
      const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
      if (match) {
        cloudinary.config({
          api_key: match[1],
          api_secret: match[2],
          cloud_name: match[3],
          secure: true
        });
        return true;
      }
    } catch {
    }
  }
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME)?.trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY)?.trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET)?.trim();
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    return true;
  }
  return false;
}
async function uploadToCloudinary(bytes, mimeType, fileName, productId) {
  const base64Data = `data:${mimeType};base64,${bytes.toString("base64")}`;
  const publicId = `${safeStem2(fileName)}_${Date.now().toString(36)}`;
  const isOffer = productId === "offers";
  const folder = isOffer ? "rabiora/offers" : "rabiora/products";
  const tags = isOffer ? ["rabiora_offers"] : [`product_${productId}`, "rabiora_catalogue"];
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Data,
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        tags
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        resolve({
          key: result.public_id,
          url: result.secure_url
        });
      }
    );
  });
}
async function saveProductImage(productId, bytes, mimeType, fileName) {
  const extension = allowedExtensions2[mimeType];
  if (!extension) {
    throw new TRPCError14({
      code: "BAD_REQUEST",
      message: "Use a JPEG, PNG, or WebP image."
    });
  }
  const hasCloudinary = getCloudinaryConfig();
  if (hasCloudinary) {
    try {
      return await uploadToCloudinary(bytes, mimeType, fileName, productId);
    } catch (error) {
      console.error("[Storage] Cloudinary upload failed:", error);
      if (process.env.NODE_ENV === "production") {
        throw new TRPCError14({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload image to Cloudinary storage."
        });
      }
    }
  }
  return saveLocalProductImage(productId, bytes, mimeType, fileName);
}
async function removeProductImage(storageKey) {
  if (!storageKey) return;
  const hasCloudinary = getCloudinaryConfig();
  if (hasCloudinary && (storageKey.startsWith("rabiora/") || !storageKey.startsWith("/uploads/") && !storageKey.startsWith("products/"))) {
    try {
      await cloudinary.uploader.destroy(storageKey, { resource_type: "image" });
      return;
    } catch (error) {
      console.error("[Storage] Failed to delete from Cloudinary:", error);
    }
  }
  return removeLocalProductImage(storageKey);
}

// server/adminService.ts
var transitions = {
  pending: ["confirmed"],
  confirmed: ["shipped"],
  shipped: ["delivered"],
  delivered: []
};
function canAdvanceOrderStatus(current, next) {
  return transitions[current].includes(next);
}
function normalizedSlug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function discount(priceTaka, oldPriceTaka) {
  return oldPriceTaka && oldPriceTaka > priceTaka ? Math.round((oldPriceTaka - priceTaka) / oldPriceTaka * 100) : 0;
}
async function listAdminCategories() {
  await connectMongo();
  const cats = await CategoryModel.find().sort({ name: 1 }).lean();
  return cats.map((c) => ({
    id: c._id.toString(),
    _id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  }));
}
async function createAdminCategory(input) {
  await connectMongo();
  const name = input.name.trim();
  const slug = normalizedSlug(input.slug || name);
  if (!name || !slug) {
    throw new TRPCError15({
      code: "BAD_REQUEST",
      message: "Category name and slug are required."
    });
  }
  const existing = await CategoryModel.findOne({ slug });
  if (existing) {
    throw new TRPCError15({
      code: "CONFLICT",
      message: "A category with this URL slug already exists."
    });
  }
  const category = await CategoryModel.create({ name, slug });
  return {
    id: category._id.toString(),
    _id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };
}
async function updateAdminCategory(categoryId, input) {
  await connectMongo();
  const query = isValidObjectId(categoryId) ? { _id: toObjectId(String(categoryId)) } : { slug: String(categoryId) };
  const category = await CategoryModel.findOne(query);
  if (!category) {
    throw new TRPCError15({ code: "NOT_FOUND", message: "Category not found." });
  }
  const name = input.name.trim();
  const slug = normalizedSlug(input.slug || name);
  if (!name || !slug) {
    throw new TRPCError15({ code: "BAD_REQUEST", message: "Category name and slug are required." });
  }
  const existingSlug = await CategoryModel.findOne({ slug });
  if (existingSlug && existingSlug._id.toString() !== category._id.toString()) {
    throw new TRPCError15({ code: "CONFLICT", message: "Another category already uses this slug." });
  }
  category.name = name;
  category.slug = slug;
  await category.save();
  await ProductModel.updateMany(
    { categoryId: category._id },
    { $set: { categoryName: name, categorySlug: slug } }
  );
  return {
    id: category._id.toString(),
    _id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };
}
async function deleteAdminCategory(categoryId) {
  await connectMongo();
  const query = isValidObjectId(categoryId) ? { _id: toObjectId(String(categoryId)) } : { slug: String(categoryId) };
  const category = await CategoryModel.findOne(query);
  if (!category) {
    throw new TRPCError15({ code: "NOT_FOUND", message: "Category not found." });
  }
  let fallbackCategory = await CategoryModel.findOne({ _id: { $ne: category._id } });
  if (!fallbackCategory) {
    fallbackCategory = await CategoryModel.create({
      name: "General Collection",
      slug: "general-collection"
    });
  }
  await ProductModel.updateMany(
    { categoryId: category._id },
    {
      $set: {
        categoryId: fallbackCategory._id,
        categoryName: fallbackCategory.name,
        categorySlug: fallbackCategory.slug
      }
    }
  );
  await CategoryModel.deleteOne({ _id: category._id });
  return { success: true };
}
async function listAdminProducts() {
  await connectMongo();
  const products = await ProductModel.find().populate("categoryId").sort({ updatedAt: -1 }).lean();
  return products.map((p) => {
    const cat = p.categoryId;
    return {
      id: p.legacyId ?? p._id.toString(),
      _id: p._id.toString(),
      legacyId: p.legacyId ?? 0,
      categoryId: cat ? cat._id.toString() : p.categoryId?.toString(),
      categoryName: cat?.name || p.categoryName || "",
      categorySlug: cat?.slug || p.categorySlug || "",
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      details: p.details,
      fabric: p.fabric,
      color: p.color,
      priceTaka: p.priceTaka,
      oldPriceTaka: p.oldPriceTaka,
      discountPercent: p.discountPercent,
      stockQuantity: p.stockQuantity,
      isInStock: p.isInStock,
      featured: p.featured,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      images: (p.images || []).map((img, idx) => ({
        id: idx + 1,
        _id: img._id?.toString(),
        productId: p.legacyId ?? p._id.toString(),
        storageKey: img.storageKey,
        storageUrl: img.storageUrl,
        altText: img.altText,
        position: img.position,
        isCover: img.isCover
      }))
    };
  });
}
async function createAdminProduct(input) {
  await connectMongo();
  const currentCount = await ProductModel.countDocuments();
  const legacyId = currentCount + 1;
  const slug = normalizedSlug(input.slug || input.name);
  if (!slug) {
    throw new TRPCError15({
      code: "BAD_REQUEST",
      message: "Product slug is required."
    });
  }
  const existingSlug = await ProductModel.findOne({ slug });
  if (existingSlug) {
    throw new TRPCError15({
      code: "CONFLICT",
      message: "A product with this URL slug already exists."
    });
  }
  let categoryDoc = null;
  if (isValidObjectId(input.categoryId)) {
    categoryDoc = await CategoryModel.findById(input.categoryId);
  }
  if (!categoryDoc) {
    categoryDoc = await CategoryModel.findOne();
  }
  if (!categoryDoc) {
    categoryDoc = await CategoryModel.create({
      name: "General",
      slug: "general"
    });
  }
  const product = await ProductModel.create({
    legacyId,
    categoryId: categoryDoc._id,
    categoryName: categoryDoc.name,
    categorySlug: categoryDoc.slug,
    name: input.name.trim(),
    slug,
    sku: input.sku?.trim() || void 0,
    details: input.details.trim(),
    fabric: input.fabric.trim(),
    color: input.color.trim(),
    priceTaka: input.priceTaka,
    oldPriceTaka: input.oldPriceTaka || void 0,
    stockQuantity: input.stockQuantity,
    isInStock: input.stockQuantity > 0,
    featured: input.featured,
    discountPercent: discount(input.priceTaka, input.oldPriceTaka),
    images: []
  });
  const obj = product.toObject();
  return {
    ...obj,
    id: product.legacyId ?? product._id.toString(),
    _id: product._id.toString()
  };
}
async function updateAdminProduct(productId, input) {
  await connectMongo();
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) {
    throw new TRPCError15({
      code: "NOT_FOUND",
      message: "Product not found."
    });
  }
  const slug = normalizedSlug(input.slug || input.name);
  if (!slug) {
    throw new TRPCError15({
      code: "BAD_REQUEST",
      message: "Product slug is required."
    });
  }
  const slugOwner = await ProductModel.findOne({ slug });
  if (slugOwner && slugOwner._id.toString() !== product._id.toString()) {
    throw new TRPCError15({
      code: "CONFLICT",
      message: "Another product already uses this URL slug."
    });
  }
  let categoryDoc = null;
  if (isValidObjectId(input.categoryId)) {
    categoryDoc = await CategoryModel.findById(input.categoryId);
  }
  const stockQuantity = Math.max(0, Math.floor(input.stockQuantity));
  product.name = input.name.trim();
  product.slug = slug;
  product.sku = input.sku?.trim() || void 0;
  product.details = input.details.trim();
  product.fabric = input.fabric.trim();
  product.color = input.color.trim();
  product.priceTaka = input.priceTaka;
  product.oldPriceTaka = input.oldPriceTaka || void 0;
  product.stockQuantity = stockQuantity;
  product.isInStock = stockQuantity > 0;
  product.featured = input.featured;
  product.discountPercent = discount(input.priceTaka, input.oldPriceTaka);
  if (categoryDoc) {
    product.categoryId = categoryDoc._id;
    product.categoryName = categoryDoc.name;
    product.categorySlug = categoryDoc.slug;
  }
  await product.save();
  const obj = product.toObject();
  return {
    ...obj,
    id: product.legacyId ?? product._id.toString(),
    _id: product._id.toString()
  };
}
async function deleteAdminProduct(productId) {
  await connectMongo();
  await ProductModel.deleteOne(findProductQuery(productId));
  return {
    success: true
  };
}
async function uploadAdminProductImage(productId, input) {
  await connectMongo();
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) {
    throw new TRPCError15({
      code: "NOT_FOUND",
      message: "Product not found."
    });
  }
  const dataMatch = input.dataUrl.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
  );
  if (!dataMatch) {
    throw new TRPCError15({
      code: "BAD_REQUEST",
      message: "Use a JPEG, PNG, or WebP image."
    });
  }
  const bytes = Buffer.from(dataMatch[2], "base64");
  if (bytes.byteLength > 5 * 1024 * 1024) {
    throw new TRPCError15({
      code: "PAYLOAD_TOO_LARGE",
      message: "Images must be 5 MB or smaller."
    });
  }
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_") || "product-image";
  const uploaded = await saveProductImage(
    product.legacyId ?? product._id.toString(),
    bytes,
    dataMatch[1],
    safeName
  );
  if (input.isCover || product.images.length === 0) {
    product.images.forEach((img) => {
      img.isCover = false;
    });
  }
  product.images.push({
    storageKey: uploaded.key,
    storageUrl: uploaded.url,
    altText: input.altText || "Rabiora product image",
    position: product.images.length,
    isCover: input.isCover || product.images.length === 0
  });
  await product.save();
  return uploaded;
}
async function setAdminProductCover(productId, imageId) {
  await connectMongo();
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) {
    throw new TRPCError15({ code: "NOT_FOUND", message: "Product not found." });
  }
  const targetIdx = typeof imageId === "number" ? imageId - 1 : product.images.findIndex((img) => img._id?.toString() === String(imageId));
  if (targetIdx >= 0 && targetIdx < product.images.length) {
    product.images.forEach((img, idx) => {
      img.isCover = idx === targetIdx;
    });
    await product.save();
  }
  return { success: true };
}
async function removeAdminProductImage(productId, imageId) {
  await connectMongo();
  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) {
    throw new TRPCError15({ code: "NOT_FOUND", message: "Product not found." });
  }
  const targetIdx = typeof imageId === "number" ? imageId - 1 : product.images.findIndex((img) => img._id?.toString() === String(imageId));
  if (targetIdx >= 0 && targetIdx < product.images.length) {
    const [removed] = product.images.splice(targetIdx, 1);
    if (removed.isCover && product.images.length > 0) {
      product.images[0].isCover = true;
    }
    await product.save();
    await removeProductImage(removed.storageKey);
  }
  return { success: true };
}
async function listAdminOrders() {
  await connectMongo();
  const orders = await OrderModel.find().sort({ createdAt: -1 }).lean();
  return orders.map((o) => ({
    id: o._id.toString(),
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    districtArea: o.districtArea,
    fullAddress: o.fullAddress,
    subtotalTaka: o.subtotalTaka,
    deliveryChargeTaka: o.deliveryChargeTaka,
    totalTaka: o.totalTaka,
    couponCode: o.couponCode,
    originalSubtotalTaka: o.originalSubtotalTaka,
    discountPercent: o.discountPercent,
    discountAmountTaka: o.discountAmountTaka,
    paymentMethod: o.paymentMethod,
    status: o.status,
    adminNote: o.adminNote,
    createdAt: o.createdAt,
    items: (o.items || []).map((i, idx) => ({
      id: i._id ? i._id.toString() : idx + 1,
      orderId: o._id.toString(),
      productName: i.productName,
      sku: i.sku,
      imageUrl: i.imageUrl,
      unitPriceTaka: i.unitPriceTaka,
      quantity: i.quantity,
      lineTotalTaka: i.lineTotalTaka
    })),
    payment: o.payments && o.payments[0] ? o.payments[0] : null
  }));
}
async function listAdminCustomers() {
  await connectMongo();
  const users = await UserModel.find().sort({ createdAt: -1 }).lean();
  const customerList = await Promise.all(
    users.map(async (u) => {
      const orderCount = await OrderModel.countDocuments({ userId: u._id });
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt,
        totalOrders: orderCount
      };
    })
  );
  return customerList;
}
async function getAdminCustomerDetail(customerId) {
  await connectMongo();
  const customer = await UserModel.findOne(findUserQuery(customerId)).lean();
  if (!customer) {
    throw new TRPCError15({
      code: "NOT_FOUND",
      message: "Customer not found."
    });
  }
  const customerOrders = await OrderModel.find({ userId: customer._id }).sort({ createdAt: -1 }).lean();
  return {
    id: customer._id.toString(),
    openId: customer.openId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    role: customer.role,
    createdAt: customer.createdAt,
    orders: customerOrders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      districtArea: o.districtArea,
      fullAddress: o.fullAddress,
      paymentMethod: o.paymentMethod,
      totalTaka: o.totalTaka,
      status: o.status,
      createdAt: o.createdAt
    }))
  };
}
async function updateAdminCustomerRole(customerId, role) {
  await connectMongo();
  const query = findUserQuery(customerId);
  const updated = await UserModel.findOneAndUpdate(
    query,
    { $set: { role } },
    { new: true }
  ).lean();
  if (!updated) {
    throw new TRPCError15({
      code: "NOT_FOUND",
      message: "Customer not found."
    });
  }
  return {
    id: updated._id.toString(),
    name: updated.name,
    phone: updated.phone,
    email: updated.email,
    role: updated.role
  };
}
async function advanceOrderStatus(orderId, nextStatus, actorUserId, adminNote) {
  await connectMongo();
  const order = await OrderModel.findOne(findOrderQuery(orderId));
  if (!order) {
    throw new TRPCError15({
      code: "NOT_FOUND",
      message: "Order not found."
    });
  }
  if (!canAdvanceOrderStatus(order.status, nextStatus)) {
    throw new TRPCError15({
      code: "BAD_REQUEST",
      message: "Order statuses must move forward through pending, confirmed, shipped, and delivered."
    });
  }
  order.status = nextStatus;
  if (adminNote) order.adminNote = adminNote.trim();
  let actorDoc = null;
  if (actorUserId) {
    actorDoc = await UserModel.findOne(findUserQuery(actorUserId));
  }
  order.statusHistory.push({
    previousStatus: order.status,
    nextStatus,
    actorUserId: actorDoc ? actorDoc._id : void 0,
    adminNote: adminNote?.trim(),
    createdAt: /* @__PURE__ */ new Date()
  });
  await order.save();
  return {
    success: true,
    status: nextStatus
  };
}

// server/marketingService.ts
init_db();
init_models();
init_customerSession();
import { TRPCError as TRPCError16 } from "@trpc/server";
async function getPublicSiteSettings() {
  await connectMongo();
  let settings = await SiteSettingsModel.findOne({ key: "default" }).lean();
  if (!settings) {
    settings = await SiteSettingsModel.create({
      key: "default",
      bkashNumber: "+8801349529274",
      nagadNumber: "+8801349529274",
      rocketNumber: "+8801349529274",
      heroBadge: "Premium Collection",
      heroHeading: "RABIORA",
      heroTagline: "Elegance \u2022 Comfort \u2022 Confidence",
      heroImageUrl: ""
    });
  }
  return {
    bkashNumber: settings.bkashNumber || "+8801349529274",
    nagadNumber: settings.nagadNumber || "+8801349529274",
    rocketNumber: settings.rocketNumber || "+8801349529274",
    heroBadge: settings.heroBadge || "Premium Collection",
    heroHeading: settings.heroHeading || "RABIORA",
    heroTagline: settings.heroTagline || "Elegance \u2022 Comfort \u2022 Confidence",
    heroImageUrl: settings.heroImageUrl || ""
  };
}
async function updateAdminSiteSettings(input) {
  await connectMongo();
  const updated = await SiteSettingsModel.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        ...input.bkashNumber !== void 0 && { bkashNumber: input.bkashNumber.trim() },
        ...input.nagadNumber !== void 0 && { nagadNumber: input.nagadNumber.trim() },
        ...input.rocketNumber !== void 0 && { rocketNumber: input.rocketNumber.trim() },
        ...input.heroBadge !== void 0 && { heroBadge: input.heroBadge.trim() },
        ...input.heroHeading !== void 0 && { heroHeading: input.heroHeading.trim() },
        ...input.heroTagline !== void 0 && { heroTagline: input.heroTagline.trim() },
        ...input.heroImageUrl !== void 0 && { heroImageUrl: input.heroImageUrl.trim() }
      }
    },
    { upsert: true, new: true }
  ).lean();
  return {
    bkashNumber: updated.bkashNumber,
    nagadNumber: updated.nagadNumber,
    rocketNumber: updated.rocketNumber,
    heroBadge: updated.heroBadge,
    heroHeading: updated.heroHeading,
    heroTagline: updated.heroTagline,
    heroImageUrl: updated.heroImageUrl
  };
}
async function subscribeCustomer(input) {
  await connectMongo();
  const email = input.email.trim().toLowerCase();
  const phoneInput = input.phone.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new TRPCError16({
      code: "BAD_REQUEST",
      message: "Please enter a valid email address."
    });
  }
  let normalizedPhone = phoneInput;
  if (input.residency === "inside_bangladesh") {
    const bd = normalizeBangladeshPhone(phoneInput);
    if (!bd) {
      throw new TRPCError16({
        code: "BAD_REQUEST",
        message: "Please enter a valid 11-digit Bangladesh mobile number."
      });
    }
    normalizedPhone = bd;
  } else {
    if (phoneInput.length < 7 || phoneInput.length > 20) {
      throw new TRPCError16({
        code: "BAD_REQUEST",
        message: "Please enter a valid international mobile number."
      });
    }
  }
  const existing = await SubscriberModel.findOne({ email }).lean();
  if (existing) {
    if (existing.status === "unsubscribed") {
      await SubscriberModel.updateOne(
        { _id: existing._id },
        { $set: { status: "active", phone: normalizedPhone, residency: input.residency } }
      );
      return { success: true, message: "Thank you! Your subscription has been reactivated." };
    }
    return { success: true, message: "You are already subscribed to Rabiora updates!" };
  }
  await SubscriberModel.create({
    email,
    phone: normalizedPhone,
    residency: input.residency,
    status: "active"
  });
  return { success: true, message: "Thank you for subscribing to Rabiora!" };
}
async function listAdminSubscribers() {
  await connectMongo();
  const subscribers = await SubscriberModel.find().sort({ createdAt: -1 }).lean();
  return subscribers.map((s) => ({
    id: s._id.toString(),
    email: s.email,
    phone: s.phone,
    residency: s.residency,
    status: s.status,
    createdAt: s.createdAt
  }));
}
async function deleteAdminSubscriber(id) {
  await connectMongo();
  await SubscriberModel.findByIdAndDelete(id);
  return { success: true };
}
async function listActiveOfferBanners() {
  await connectMongo();
  const totalCount = await OfferBannerModel.countDocuments();
  if (totalCount === 0) {
    const defaultBanner = await OfferBannerModel.create({
      offerType: "text",
      title: "10% OFF on bKash Payment",
      subtitle: "Exclusive Rabiora Discount on all Three-Piece Collections",
      badge: "Special Offer",
      discountCode: "BKASH10",
      imageUrl: "",
      linkUrl: "/#products",
      isActive: true,
      displayOrder: 0
    });
    return [
      {
        id: defaultBanner._id.toString(),
        offerType: defaultBanner.offerType || "text",
        title: defaultBanner.title,
        subtitle: defaultBanner.subtitle || "",
        badge: defaultBanner.badge || "Special Offer",
        discountCode: defaultBanner.discountCode || "",
        imageUrl: defaultBanner.imageUrl || "",
        linkUrl: defaultBanner.linkUrl || "/#products",
        isActive: defaultBanner.isActive,
        displayOrder: defaultBanner.displayOrder
      }
    ];
  }
  const banners = await OfferBannerModel.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).lean();
  return banners.map((b) => ({
    id: b._id.toString(),
    offerType: b.offerType || "text",
    title: b.title,
    subtitle: b.subtitle || "",
    badge: b.badge || "Special Offer",
    discountCode: b.discountCode || "",
    imageUrl: b.imageUrl || "",
    linkUrl: b.linkUrl || "/#products",
    isActive: b.isActive,
    displayOrder: b.displayOrder
  }));
}
async function listAdminOfferBanners() {
  await connectMongo();
  const banners = await OfferBannerModel.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
  return banners.map((b) => ({
    id: b._id.toString(),
    offerType: b.offerType || "text",
    title: b.title,
    subtitle: b.subtitle || "",
    badge: b.badge || "Special Offer",
    discountCode: b.discountCode || "",
    imageUrl: b.imageUrl || "",
    linkUrl: b.linkUrl || "/#products",
    isActive: b.isActive,
    displayOrder: b.displayOrder,
    createdAt: b.createdAt
  }));
}
async function createAdminOfferBanner(input) {
  await connectMongo();
  const offerType = input.offerType || "image_banner";
  if (offerType === "image_banner" && !input.imageUrl?.trim()) {
    throw new TRPCError16({ code: "BAD_REQUEST", message: "An image is required for Image Banner offers." });
  }
  const created = await OfferBannerModel.create({
    offerType,
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || "",
    badge: input.badge?.trim() || "Special Offer",
    discountCode: input.discountCode?.trim() || "",
    imageUrl: input.imageUrl?.trim() || "",
    linkUrl: input.linkUrl?.trim() || "/#products",
    isActive: input.isActive ?? true,
    displayOrder: input.displayOrder ?? 0
  });
  return {
    id: created._id.toString(),
    offerType: created.offerType,
    title: created.title,
    subtitle: created.subtitle,
    badge: created.badge,
    discountCode: created.discountCode,
    imageUrl: created.imageUrl,
    linkUrl: created.linkUrl,
    isActive: created.isActive,
    displayOrder: created.displayOrder
  };
}
async function updateAdminOfferBanner(id, input) {
  await connectMongo();
  if (input.offerType === "image_banner" && input.imageUrl !== void 0 && !input.imageUrl.trim()) {
    throw new TRPCError16({ code: "BAD_REQUEST", message: "An image is required for Image Banner offers." });
  }
  const updated = await OfferBannerModel.findByIdAndUpdate(
    id,
    {
      $set: {
        ...input.offerType !== void 0 && { offerType: input.offerType },
        ...input.title !== void 0 && { title: input.title.trim() },
        ...input.subtitle !== void 0 && { subtitle: input.subtitle.trim() },
        ...input.badge !== void 0 && { badge: input.badge.trim() },
        ...input.discountCode !== void 0 && { discountCode: input.discountCode.trim() },
        ...input.imageUrl !== void 0 && { imageUrl: input.imageUrl.trim() },
        ...input.linkUrl !== void 0 && { linkUrl: input.linkUrl.trim() },
        ...input.isActive !== void 0 && { isActive: input.isActive },
        ...input.displayOrder !== void 0 && { displayOrder: input.displayOrder }
      }
    },
    { new: true }
  ).lean();
  if (!updated) {
    throw new TRPCError16({ code: "NOT_FOUND", message: "Offer banner not found." });
  }
  return {
    id: updated._id.toString(),
    offerType: updated.offerType || "text",
    title: updated.title,
    subtitle: updated.subtitle,
    badge: updated.badge,
    discountCode: updated.discountCode,
    imageUrl: updated.imageUrl || "",
    linkUrl: updated.linkUrl,
    isActive: updated.isActive,
    displayOrder: updated.displayOrder
  };
}
async function deleteAdminOfferBanner(id) {
  await connectMongo();
  await OfferBannerModel.findByIdAndDelete(id);
  return { success: true };
}
async function uploadAdminOfferImage(dataUri, fileName) {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new TRPCError16({ code: "BAD_REQUEST", message: "Invalid image format." });
  }
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const upload = await saveProductImage("offers", buffer, mimeType, fileName || "offer-banner.jpg");
  return { storageUrl: upload.url, storageKey: upload.key };
}

// server/routers/admin.ts
var idSchema3 = z4.union([z4.number(), z4.string()]);
var productInput = z4.object({
  categoryId: idSchema3,
  name: z4.string().trim().min(2).max(220),
  slug: z4.string().trim().max(240),
  sku: z4.string().trim().max(80).optional(),
  details: z4.string().trim().min(2).max(5e3),
  fabric: z4.string().trim().min(1).max(120),
  color: z4.string().trim().min(1).max(120),
  priceTaka: z4.number().int().positive(),
  oldPriceTaka: z4.number().int().positive().optional(),
  stockQuantity: z4.number().int().min(0).max(1e5),
  featured: z4.boolean()
});
var categoryInput = z4.object({
  name: z4.string().trim().min(2).max(120),
  slug: z4.string().trim().max(140).optional()
});
var adminRouter = router({
  categories: router({
    list: adminProcedure.query(() => listAdminCategories()),
    create: adminProcedure.input(categoryInput).mutation(({ input }) => createAdminCategory(input)),
    update: adminProcedure.input(
      z4.object({
        id: idSchema3,
        category: categoryInput
      })
    ).mutation(
      ({ input }) => updateAdminCategory(input.id, input.category)
    ),
    remove: adminProcedure.input(
      z4.object({
        id: idSchema3
      })
    ).mutation(({ input }) => deleteAdminCategory(input.id))
  }),
  products: router({
    list: adminProcedure.query(() => listAdminProducts()),
    create: adminProcedure.input(productInput).mutation(({ input }) => createAdminProduct(input)),
    update: adminProcedure.input(
      z4.object({
        id: idSchema3,
        product: productInput
      })
    ).mutation(
      ({ input }) => updateAdminProduct(input.id, input.product)
    ),
    remove: adminProcedure.input(
      z4.object({
        id: idSchema3
      })
    ).mutation(({ input }) => deleteAdminProduct(input.id)),
    uploadImage: adminProcedure.input(
      z4.object({
        productId: idSchema3,
        dataUrl: z4.string().max(71e5),
        fileName: z4.string().max(240),
        altText: z4.string().trim().max(280),
        isCover: z4.boolean()
      })
    ).mutation(
      ({ input }) => uploadAdminProductImage(input.productId, input)
    ),
    setCover: adminProcedure.input(
      z4.object({
        productId: idSchema3,
        imageId: idSchema3
      })
    ).mutation(
      ({ input }) => setAdminProductCover(input.productId, input.imageId)
    ),
    removeImage: adminProcedure.input(
      z4.object({
        productId: idSchema3,
        imageId: idSchema3
      })
    ).mutation(
      ({ input }) => removeAdminProductImage(input.productId, input.imageId)
    )
  }),
  orders: router({
    list: adminProcedure.query(() => listAdminOrders()),
    advanceStatus: adminProcedure.input(
      z4.object({
        orderId: idSchema3,
        nextStatus: z4.enum([
          "confirmed",
          "shipped",
          "delivered"
        ]),
        adminNote: z4.string().trim().max(1e3).optional()
      })
    ).mutation(
      ({ ctx, input }) => advanceOrderStatus(
        input.orderId,
        input.nextStatus,
        ctx.user.id,
        input.adminNote
      )
    )
  }),
  customers: router({
    list: adminProcedure.query(() => listAdminCustomers()),
    detail: adminProcedure.input(
      z4.object({
        id: idSchema3
      })
    ).query(({ input }) => getAdminCustomerDetail(input.id)),
    updateRole: adminProcedure.input(
      z4.object({
        id: idSchema3,
        role: z4.enum(["user", "admin"])
      })
    ).mutation(({ input }) => updateAdminCustomerRole(input.id, input.role))
  }),
  reviews: router({
    list: adminProcedure.query(() => listAdminReviews()),
    setVisibility: adminProcedure.input(
      z4.object({
        reviewId: idSchema3,
        isVisible: z4.boolean()
      })
    ).mutation(
      ({ input }) => setReviewVisibility(
        input.reviewId,
        input.isVisible
      )
    ),
    remove: adminProcedure.input(
      z4.object({
        reviewId: idSchema3
      })
    ).mutation(
      ({ input }) => deleteProductReview(input.reviewId)
    )
  }),
  settings: router({
    update: adminProcedure.input(
      z4.object({
        bkashNumber: z4.string().trim().optional(),
        nagadNumber: z4.string().trim().optional(),
        rocketNumber: z4.string().trim().optional(),
        heroBadge: z4.string().trim().optional(),
        heroHeading: z4.string().trim().optional(),
        heroTagline: z4.string().trim().optional(),
        heroImageUrl: z4.string().trim().optional()
      })
    ).mutation(({ input }) => updateAdminSiteSettings(input))
  }),
  subscribers: router({
    list: adminProcedure.query(() => listAdminSubscribers()),
    delete: adminProcedure.input(z4.object({ id: z4.string() })).mutation(({ input }) => deleteAdminSubscriber(input.id))
  }),
  offers: router({
    list: adminProcedure.query(() => listAdminOfferBanners()),
    create: adminProcedure.input(
      z4.object({
        offerType: z4.enum(["text", "image_banner"]).optional(),
        title: z4.string().trim().min(1).max(200),
        subtitle: z4.string().trim().max(300).optional(),
        badge: z4.string().trim().max(100).optional(),
        discountCode: z4.string().trim().max(50).optional(),
        imageUrl: z4.string().trim().optional(),
        linkUrl: z4.string().trim().max(300).optional(),
        isActive: z4.boolean().optional(),
        displayOrder: z4.number().int().optional()
      })
    ).mutation(({ input }) => createAdminOfferBanner(input)),
    update: adminProcedure.input(
      z4.object({
        id: z4.string(),
        offerType: z4.enum(["text", "image_banner"]).optional(),
        title: z4.string().trim().min(1).max(200).optional(),
        subtitle: z4.string().trim().max(300).optional(),
        badge: z4.string().trim().max(100).optional(),
        discountCode: z4.string().trim().max(50).optional(),
        imageUrl: z4.string().trim().optional(),
        linkUrl: z4.string().trim().max(300).optional(),
        isActive: z4.boolean().optional(),
        displayOrder: z4.number().int().optional()
      })
    ).mutation(({ input }) => updateAdminOfferBanner(input.id, input)),
    delete: adminProcedure.input(z4.object({ id: z4.string() })).mutation(({ input }) => deleteAdminOfferBanner(input.id)),
    uploadImage: adminProcedure.input(
      z4.object({
        dataUri: z4.string().min(10),
        fileName: z4.string().optional()
      })
    ).mutation(({ input }) => uploadAdminOfferImage(input.dataUri, input.fileName))
  }),
  coupons: router({
    list: adminProcedure.query(() => listAdminCoupons()),
    create: adminProcedure.input(
      z4.object({
        code: z4.string().trim().min(2).max(50),
        discountType: z4.enum(["percentage"]).optional(),
        discountValue: z4.number().int().min(1).max(100),
        isActive: z4.boolean().optional(),
        expiryDate: z4.string().nullable().optional(),
        minOrderAmount: z4.number().int().nonnegative().optional(),
        usageLimit: z4.number().int().positive().nullable().optional(),
        allowedPaymentMethods: z4.array(z4.string()).optional()
      })
    ).mutation(({ input }) => createAdminCoupon(input)),
    update: adminProcedure.input(
      z4.object({
        id: z4.string(),
        code: z4.string().trim().min(2).max(50).optional(),
        discountType: z4.enum(["percentage"]).optional(),
        discountValue: z4.number().int().min(1).max(100).optional(),
        isActive: z4.boolean().optional(),
        expiryDate: z4.string().nullable().optional(),
        minOrderAmount: z4.number().int().nonnegative().optional(),
        usageLimit: z4.number().int().positive().nullable().optional(),
        allowedPaymentMethods: z4.array(z4.string()).optional()
      })
    ).mutation(({ input }) => updateAdminCoupon(input.id, input)),
    delete: adminProcedure.input(z4.object({ id: z4.string() })).mutation(({ input }) => deleteAdminCoupon(input.id))
  })
});

// server/_core/systemRouter.ts
import { z as z5 } from "zod";

// server/_core/notification.ts
import { TRPCError as TRPCError17 } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError17({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError17({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError17({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError17({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError17({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError17({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z5.object({
      timestamp: z5.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z5.object({
      title: z5.string().min(1, "title is required"),
      content: z5.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  settings: router({
    get: publicProcedure.query(() => getPublicSiteSettings())
  }),
  offers: router({
    list: publicProcedure.query(() => listActiveOfferBanners())
  }),
  coupon: router({
    validate: publicProcedure.input(
      z6.object({
        code: z6.string().trim().min(1).max(50),
        subtotalTaka: z6.number().int().nonnegative(),
        paymentMethod: z6.string().trim()
      })
    ).mutation(({ input }) => validateCoupon(input.code, input.subtotalTaka, input.paymentMethod))
  }),
  subscribe: publicProcedure.input(
    z6.object({
      email: z6.string().trim().email(),
      phone: z6.string().trim().min(7).max(25),
      residency: z6.enum(["inside_bangladesh", "outside_bangladesh"])
    })
  ).mutation(({ input }) => subscribeCustomer(input)),
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  catalogue: router({
    list: publicProcedure.input(z6.object({
      query: z6.string().trim().max(80).optional(),
      featured: z6.boolean().optional(),
      categorySlug: z6.string().trim().max(140).optional()
    }).optional()).query(({ input }) => listCatalogue(input)),
    bySlug: publicProcedure.input(z6.object({ slug: z6.string().trim().min(1).max(240) })).query(({ input }) => getCatalogueProduct(input.slug))
  }),
  customer: customerRouter,
  cart: cartRouter,
  wishlist: wishlistRouter,
  order: orderRouter,
  admin: adminRouter
});

// server/_core/context.ts
init_customerSession();
async function createContext(opts) {
  const req = opts.req;
  const res = opts.res;
  let user = null;
  try {
    const customer = await getCustomerFromRequest(req);
    if (customer) {
      user = customer;
    }
  } catch {
  }
  if (!user) {
    try {
      const authUser = await sdk.authenticateRequest(req);
      if (authUser) {
        user = {
          id: authUser._id ? authUser._id.toString() : authUser.id ? String(authUser.id) : authUser.openId,
          openId: authUser.openId,
          name: authUser.name ?? null,
          email: authUser.email ?? null,
          phone: authUser.phone ?? null,
          role: authUser.role ?? "user"
        };
      }
    } catch {
    }
  }
  return {
    req,
    res,
    user
  };
}

// server/app.ts
init_db();
init_customerSession();
function createExpressApp() {
  const app2 = express();
  app2.set("trust proxy", 1);
  app2.use(applyCorsPolicy);
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ limit: "50mb", extended: true }));
  app2.use("/uploads/images", express.static(getLocalImagesRoot(), { fallthrough: true, maxAge: "7d" }));
  app2.use(async (req, res, next) => {
    try {
      await connectMongo();
      next();
    } catch (err) {
      console.error("[MongoDB] Middleware connection error:", err);
      next();
    }
  });
  app2.get(["/api/health", "/health", "/api"], (req, res) => {
    const detectedKeys = Object.keys(process.env).filter((k) => {
      const upper = k.toUpperCase();
      return upper.includes("MONGO") || upper.includes("DATABASE") || upper.includes("JWT") || upper.includes("SECRET") || upper.includes("CLOUDINARY") || upper.includes("CORS") || upper.includes("VERCEL");
    });
    const mongoUri = getMongoUri();
    res.status(200).json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      vercelProject: {
        projectName: process.env.VERCEL_PROJECT_NAME || "local",
        environment: process.env.VERCEL_ENV || "development",
        gitRepo: process.env.VERCEL_GIT_REPO_SLUG || "rabiora-ecommerce",
        gitBranch: process.env.VERCEL_GIT_COMMIT_REF || "main"
      },
      env: {
        hasMongoUri: Boolean(mongoUri),
        mongoUriScheme: mongoUri ? mongoUri.startsWith("mongodb+srv://") ? "mongodb+srv" : "mongodb" : "none",
        hasJwtSecret: Boolean(getJwtSecret()),
        hasCloudinary: getCloudinaryConfig(),
        nodeEnv: process.env.NODE_ENV,
        detectedKeys
      }
    });
  });
  registerOAuthRoutes(app2);
  app2.use(
    ["/api/trpc", "/trpc"],
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  app2.use((err, req, res, next) => {
    console.error("[Express Error]", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err?.message
    });
  });
  return app2;
}
var app = createExpressApp();
var app_default = app;
export {
  app,
  createExpressApp,
  app_default as default
};
