import {
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  // The existing workspace uses "user" as the stored customer role.
  // In Rabiora UI and business rules, this role is presented as "customer".
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email),
  uniqueIndex("users_phone_unique").on(table.phone),
]);

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 255 }).notNull(),
  otpCode: varchar("otpCode", { length: 12 }).notNull(),
  purpose: varchar("purpose", { length: 40 })
    .notNull()
    .default("password_reset"),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("password_reset_tokens_user_idx").on(table.userId),
  index("password_reset_tokens_expires_idx").on(table.expiresAt),
]);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("categories_slug_unique").on(table.slug),
]);

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  legacyId: int("legacyId").notNull(),
  categoryId: int("categoryId").notNull().references(() => categories.id),
  name: varchar("name", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull(),
  sku: varchar("sku", { length: 80 }),
  details: text("details").notNull(),
  fabric: varchar("fabric", { length: 120 }).notNull(),
  color: varchar("color", { length: 120 }).notNull(),
  priceTaka: int("priceTaka").notNull(),
  oldPriceTaka: int("oldPriceTaka"),
  discountPercent: int("discountPercent").notNull().default(0),
  stockQuantity: int("stockQuantity").notNull().default(0),
  isInStock: boolean("isInStock").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("products_legacy_id_unique").on(table.legacyId),
  uniqueIndex("products_slug_unique").on(table.slug),
  index("products_category_featured_idx").on(
    table.categoryId,
    table.featured,
  ),
]);

export const productImages = mysqlTable("product_images", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  storageKey: varchar("storageKey", { length: 300 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 500 }).notNull(),
  altText: varchar("altText", { length: 280 }).notNull(),
  position: int("position").notNull().default(0),
  isCover: boolean("isCover").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("product_images_product_position_unique").on(
    table.productId,
    table.position,
  ),
  index("product_images_product_cover_idx").on(
    table.productId,
    table.isCover,
  ),
]);

export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientName: varchar("recipientName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  districtArea: varchar("districtArea", { length: 180 }).notNull(),
  fullAddress: text("fullAddress").notNull(),
  isDefault: boolean("isDefault").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("addresses_user_default_idx").on(
    table.userId,
    table.isDefault,
  ),
]);

export const carts = mysqlTable("carts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  anonymousToken: varchar("anonymousToken", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("carts_user_unique").on(table.userId),
  uniqueIndex("carts_anonymous_token_unique").on(table.anonymousToken),
]);

export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  cartId: int("cartId")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: int("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: int("quantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("cart_items_cart_product_unique").on(
    table.cartId,
    table.productId,
  ),
]);

export const wishlistItems = mysqlTable("wishlist_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: int("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("wishlist_user_product_unique").on(
    table.userId,
    table.productId,
  ),
]);

export const orderStatusValues = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
] as const;

export const paymentMethodValues = [
  "bKash",
  "Nagad",
  "Rocket",
  "Cash on Delivery",
] as const;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 40 }).notNull(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  districtArea: varchar("districtArea", { length: 180 }).notNull(),
  fullAddress: text("fullAddress").notNull(),
  subtotalTaka: int("subtotalTaka").notNull(),
  deliveryChargeTaka: int("deliveryChargeTaka").notNull(),
  totalTaka: int("totalTaka").notNull(),
  paymentMethod: mysqlEnum(
    "paymentMethod",
    paymentMethodValues,
  ).notNull(),
  status: mysqlEnum("status", orderStatusValues)
    .notNull()
    .default("pending"),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("orders_number_unique").on(table.orderNumber),
  index("orders_status_created_idx").on(
    table.status,
    table.createdAt,
  ),
  index("orders_user_created_idx").on(
    table.userId,
    table.createdAt,
  ),
]);

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: int("productId").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: varchar("productName", { length: 220 }).notNull(),
  sku: varchar("sku", { length: 80 }),
  imageUrl: varchar("imageUrl", { length: 500 }),
  unitPriceTaka: int("unitPriceTaka").notNull(),
  quantity: int("quantity").notNull(),
  lineTotalTaka: int("lineTotalTaka").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("order_items_order_idx").on(table.orderId),
]);

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  method: mysqlEnum("method", paymentMethodValues).notNull(),
  expectedAmountTaka: int("expectedAmountTaka").notNull(),
  submittedAmountTaka: int("submittedAmountTaka"),
  transactionId: varchar("transactionId", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("payments_order_unique").on(table.orderId),
  uniqueIndex("payments_transaction_unique").on(table.transactionId),
]);

export const orderStatusHistory = mysqlTable("order_status_history", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  previousStatus: mysqlEnum("previousStatus", orderStatusValues),
  nextStatus: mysqlEnum("nextStatus", orderStatusValues).notNull(),
  actorUserId: int("actorUserId").references(() => users.id, {
    onDelete: "set null",
  }),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index(
    "order_status_history_order_created_idx",
  ).on(table.orderId, table.createdAt),
]);

export const productReviews = mysqlTable("product_reviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderId: int("orderId")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  rating: int("rating").notNull(),
  review: text("review").notNull(),
  isVisible: boolean("isVisible").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("product_reviews_order_user_unique").on(
    table.productId,
    table.userId,
    table.orderId,
  ),
  index("product_reviews_product_visible_idx").on(
    table.productId,
    table.isVisible,
  ),
  index("product_reviews_user_idx").on(table.userId),
]);
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;