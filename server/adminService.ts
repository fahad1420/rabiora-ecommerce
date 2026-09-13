import { TRPCError } from "@trpc/server";
import { connectMongo } from "./config/db";
import { CategoryModel, OrderModel, ProductModel, UserModel, findOrderQuery, findProductQuery, findUserQuery, toObjectId, isValidObjectId } from "./models";
import { removeProductImage, saveProductImage } from "./storage";

type ProductInput = {
  categoryId: string | number;
  name: string;
  slug: string;
  sku?: string;
  details: string;
  fabric: string;
  color: string;
  priceTaka: number;
  oldPriceTaka?: number;
  stockQuantity: number;
  featured: boolean;
};

const transitions: Record<
  "pending" | "confirmed" | "shipped" | "delivered",
  Array<"confirmed" | "shipped" | "delivered">
> = {
  pending: ["confirmed"],
  confirmed: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
};

export function canAdvanceOrderStatus(
  current: "pending" | "confirmed" | "shipped" | "delivered",
  next: "confirmed" | "shipped" | "delivered"
) {
  return transitions[current].includes(next);
}

function failUnavailable(): never {
  throw new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message: "The administration database is temporarily unavailable.",
  });
}

function normalizedSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function discount(priceTaka: number, oldPriceTaka?: number) {
  return oldPriceTaka && oldPriceTaka > priceTaka
    ? Math.round(((oldPriceTaka - priceTaka) / oldPriceTaka) * 100)
    : 0;
}

export async function listAdminCategories() {
  await connectMongo();
  const cats = await CategoryModel.find().sort({ name: 1 }).lean();
  return cats.map((c) => ({
    id: c._id.toString(),
    _id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

export async function createAdminCategory(input: { name: string; slug?: string }) {
  await connectMongo();
  const name = input.name.trim();
  const slug = normalizedSlug(input.slug || name);

  if (!name || !slug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Category name and slug are required.",
    });
  }

  const existing = await CategoryModel.findOne({ slug });
  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A category with this URL slug already exists.",
    });
  }

  const category = await CategoryModel.create({ name, slug });
  return {
    id: category._id.toString(),
    _id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export async function updateAdminCategory(
  categoryId: string | number,
  input: { name: string; slug?: string }
) {
  await connectMongo();
  const query = isValidObjectId(categoryId) ? { _id: toObjectId(String(categoryId)) } : { slug: String(categoryId) };
  const category = await CategoryModel.findOne(query);

  if (!category) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Category not found." });
  }

  const name = input.name.trim();
  const slug = normalizedSlug(input.slug || name);

  if (!name || !slug) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Category name and slug are required." });
  }

  const existingSlug = await CategoryModel.findOne({ slug });
  if (existingSlug && existingSlug._id.toString() !== category._id.toString()) {
    throw new TRPCError({ code: "CONFLICT", message: "Another category already uses this slug." });
  }

  category.name = name;
  category.slug = slug;
  await category.save();

  // Update associated product category snapshots
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
    updatedAt: category.updatedAt,
  };
}

export async function deleteAdminCategory(categoryId: string | number) {
  await connectMongo();
  const query = isValidObjectId(categoryId) ? { _id: toObjectId(String(categoryId)) } : { slug: String(categoryId) };
  const category = await CategoryModel.findOne(query);

  if (!category) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Category not found." });
  }

  // Find a fallback category so products are not orphaned
  let fallbackCategory = await CategoryModel.findOne({ _id: { $ne: category._id } });
  if (!fallbackCategory) {
    fallbackCategory = await CategoryModel.create({
      name: "General Collection",
      slug: "general-collection",
    });
  }

  // Reassign products to fallback
  await ProductModel.updateMany(
    { categoryId: category._id },
    {
      $set: {
        categoryId: fallbackCategory._id,
        categoryName: fallbackCategory.name,
        categorySlug: fallbackCategory.slug,
      },
    }
  );

  await CategoryModel.deleteOne({ _id: category._id });

  return { success: true as const };
}

export async function listAdminProducts() {
  await connectMongo();
  const products = await ProductModel.find()
    .populate("categoryId")
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  return products.map((p) => {
    const cat: any = p.categoryId;
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
        isCover: img.isCover,
      })),
    };
  });
}

export async function createAdminProduct(input: ProductInput) {
  await connectMongo();

  const currentCount = await ProductModel.countDocuments();
  const legacyId = currentCount + 1;
  const slug = normalizedSlug(input.slug || input.name);

  if (!slug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Product slug is required.",
    });
  }

  const existingSlug = await ProductModel.findOne({ slug });
  if (existingSlug) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A product with this URL slug already exists.",
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
      slug: "general",
    });
  }

  const product = await ProductModel.create({
    legacyId,
    categoryId: categoryDoc._id,
    categoryName: categoryDoc.name,
    categorySlug: categoryDoc.slug,
    name: input.name.trim(),
    slug,
    sku: input.sku?.trim() || undefined,
    details: input.details.trim(),
    fabric: input.fabric.trim(),
    color: input.color.trim(),
    priceTaka: input.priceTaka,
    oldPriceTaka: input.oldPriceTaka || undefined,
    stockQuantity: input.stockQuantity,
    isInStock: input.stockQuantity > 0,
    featured: input.featured,
    discountPercent: discount(input.priceTaka, input.oldPriceTaka),
    images: [],
  });

  const obj = product.toObject();
  return {
    ...obj,
    id: product.legacyId ?? product._id.toString(),
    _id: product._id.toString(),
  };
}

export async function updateAdminProduct(
  productId: string | number,
  input: ProductInput
) {
  await connectMongo();

  const product = await ProductModel.findOne(findProductQuery(productId));

  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Product not found.",
    });
  }

  const slug = normalizedSlug(input.slug || input.name);
  if (!slug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Product slug is required.",
    });
  }

  const slugOwner = await ProductModel.findOne({ slug });
  if (slugOwner && slugOwner._id.toString() !== product._id.toString()) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Another product already uses this URL slug.",
    });
  }

  let categoryDoc = null;
  if (isValidObjectId(input.categoryId)) {
    categoryDoc = await CategoryModel.findById(input.categoryId);
  }

  const stockQuantity = Math.max(0, Math.floor(input.stockQuantity));

  product.name = input.name.trim();
  product.slug = slug;
  product.sku = input.sku?.trim() || undefined;
  product.details = input.details.trim();
  product.fabric = input.fabric.trim();
  product.color = input.color.trim();
  product.priceTaka = input.priceTaka;
  product.oldPriceTaka = input.oldPriceTaka || undefined;
  product.stockQuantity = stockQuantity;
  product.isInStock = stockQuantity > 0;
  product.featured = input.featured;
  product.discountPercent = discount(input.priceTaka, input.oldPriceTaka);

  if (categoryDoc) {
    product.categoryId = categoryDoc._id as any;
    product.categoryName = categoryDoc.name;
    product.categorySlug = categoryDoc.slug;
  }

  await product.save();

  const obj = product.toObject();
  return {
    ...obj,
    id: product.legacyId ?? product._id.toString(),
    _id: product._id.toString(),
  };
}

export async function deleteAdminProduct(productId: string | number) {
  await connectMongo();

  await ProductModel.deleteOne(findProductQuery(productId));

  return {
    success: true as const,
  };
}

export async function uploadMultipleAdminProductImages(
  productId: string | number,
  images: Array<{
    dataUrl: string;
    fileName: string;
    altText?: string;
    isCover?: boolean;
  }>
) {
  await connectMongo();

  const product = await ProductModel.findOne(findProductQuery(productId));

  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Product not found.",
    });
  }

  const uploadedResults = [];

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    const dataMatch = item.dataUrl.match(
      /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/
    );

    if (!dataMatch) continue;

    const bytes = Buffer.from(dataMatch[2], "base64");
    if (bytes.byteLength > 8 * 1024 * 1024) continue;

    const safeName =
      item.fileName.replace(/[^a-zA-Z0-9._-]/g, "_") || `product-image-${i + 1}`;

    const uploaded = await saveProductImage(
      product.legacyId ?? product._id.toString(),
      bytes,
      dataMatch[1],
      safeName
    );

    const isCover =
      (product.images.length === 0 && uploadedResults.length === 0) ||
      Boolean(item.isCover);

    if (isCover) {
      product.images.forEach((img) => {
        img.isCover = false;
      });
    }

    product.images.push({
      storageKey: uploaded.key,
      storageUrl: uploaded.url,
      altText: item.altText || `${product.name} — Rabiora`,
      position: product.images.length,
      isCover,
    });

    uploadedResults.push(uploaded);
  }

  await product.save();
  return uploadedResults;
}

export async function uploadAdminProductImage(
  productId: string | number,
  input: {
    dataUrl: string;
    fileName: string;
    altText: string;
    isCover: boolean;
  }
) {
  await connectMongo();

  const product = await ProductModel.findOne(findProductQuery(productId));

  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Product not found.",
    });
  }

  const dataMatch = input.dataUrl.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
  );

  if (!dataMatch) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Use a JPEG, PNG, or WebP image.",
    });
  }

  const bytes = Buffer.from(dataMatch[2], "base64");

  if (bytes.byteLength > 5 * 1024 * 1024) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: "Images must be 5 MB or smaller.",
    });
  }

  const safeName =
    input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_") || "product-image";

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
    isCover: input.isCover || product.images.length === 0,
  });

  await product.save();

  return uploaded;
}

export async function setAdminProductCover(
  productId: string | number,
  imageId: string | number
) {
  await connectMongo();

  const product = await ProductModel.findOne(findProductQuery(productId));

  if (!product) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
  }

  const targetIdx = typeof imageId === "number" ? imageId - 1 : product.images.findIndex((img) => img._id?.toString() === String(imageId));

  if (targetIdx >= 0 && targetIdx < product.images.length) {
    product.images.forEach((img, idx) => {
      img.isCover = idx === targetIdx;
    });
    await product.save();
  }

  return { success: true as const };
}

export async function removeAdminProductImage(
  productId: string | number,
  imageId: string | number
) {
  await connectMongo();

  const product = await ProductModel.findOne(findProductQuery(productId));

  if (!product) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
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

  return { success: true as const };
}

export async function listAdminOrders() {
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
      lineTotalTaka: i.lineTotalTaka,
    })),
    payment: o.payments && o.payments[0] ? o.payments[0] : null,
  }));
}

export async function listAdminCustomers() {
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
        totalOrders: orderCount,
      };
    })
  );

  return customerList;
}

export async function getAdminCustomerDetail(customerId: string | number) {
  await connectMongo();

  const customer = await UserModel.findOne(findUserQuery(customerId)).lean();

  if (!customer) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Customer not found.",
    });
  }

  const customerOrders = await OrderModel.find({ userId: customer._id })
    .sort({ createdAt: -1 })
    .lean();

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
      createdAt: o.createdAt,
    })),
  };
}

export async function updateAdminCustomerRole(customerId: string | number, role: "user" | "admin") {
  await connectMongo();
  const query = findUserQuery(customerId);
  const updated = await UserModel.findOneAndUpdate(
    query,
    { $set: { role } },
    { new: true }
  ).lean();

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Customer not found.",
    });
  }

  return {
    id: updated._id.toString(),
    name: updated.name,
    phone: updated.phone,
    email: updated.email,
    role: updated.role,
  };
}

export async function advanceOrderStatus(
  orderId: string | number,
  nextStatus: "confirmed" | "shipped" | "delivered",
  actorUserId?: string | number,
  adminNote?: string
) {
  await connectMongo();

  const order = await OrderModel.findOne(findOrderQuery(orderId));

  if (!order) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Order not found.",
    });
  }

  if (!canAdvanceOrderStatus(order.status, nextStatus)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Order statuses must move forward through pending, confirmed, shipped, and delivered.",
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
    actorUserId: actorDoc ? actorDoc._id : undefined,
    adminNote: adminNote?.trim(),
    createdAt: new Date(),
  });

  await order.save();

  return {
    success: true as const,
    status: nextStatus,
  };
}