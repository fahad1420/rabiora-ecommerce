import { TRPCError } from "@trpc/server";
import { desc, eq, inArray, sql } from "drizzle-orm";
import {
  categories,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  productImages,
  products,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";
import {
  removeLocalProductImage,
  saveLocalProductImage,
} from "./localMedia";

type ProductInput = {
  categoryId: number;
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
  next: "confirmed" | "shipped" | "delivered",
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
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  return db.select().from(categories);
}

export async function listAdminProducts() {
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  const rows = await db
    .select({
      product: products,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.updatedAt));

  const imageRows = await db.select().from(productImages);

  const imagesByProduct = new Map<number, typeof imageRows>();

  imageRows.forEach((image) => {
    imagesByProduct.set(image.productId, [
      ...(imagesByProduct.get(image.productId) ?? []),
      image,
    ]);
  });

  return rows.map((row) => ({
    ...row.product,
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    images: (imagesByProduct.get(row.product.id) ?? []).sort(
      (a, b) => a.position - b.position,
    ),
  }));
}

export async function createAdminProduct(input: ProductInput) {
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  const current = await db
    .select({
      legacyId: products.legacyId,
    })
    .from(products);

  const legacyId =
    Math.max(0, ...current.map((product) => product.legacyId)) + 1;

  const slug = normalizedSlug(input.slug || input.name);

  if (!slug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Product slug is required.",
    });
  }

  const [existingSlug] = await db
    .select({
      id: products.id,
    })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (existingSlug) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A product with this URL slug already exists.",
    });
  }

  await db.insert(products).values({
    categoryId: input.categoryId,
    name: input.name.trim(),
    slug,
    sku: input.sku?.trim() || null,
    details: input.details.trim(),
    fabric: input.fabric.trim(),
    color: input.color.trim(),
    priceTaka: input.priceTaka,
    oldPriceTaka: input.oldPriceTaka ?? null,
    stockQuantity: input.stockQuantity,
    isInStock: input.stockQuantity > 0,
    featured: input.featured,
    legacyId,
    discountPercent: discount(
      input.priceTaka,
      input.oldPriceTaka,
    ),
  });

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Product creation did not return a record.",
    });
  }

  return product;
}

export async function updateAdminProduct(
  productId: number,
  input: ProductInput,
) {
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  // Make sure the product actually exists.
  const [existingProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!existingProduct) {
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

  // Check whether another product already owns this slug.
  const [slugOwner] = await db
    .select({
      id: products.id,
    })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (slugOwner && slugOwner.id !== productId) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Another product already uses this URL slug.",
    });
  }

  /*
   * Important stock logic:
   *
   * stockQuantity > 0  => in stock
   * stockQuantity === 0 => out of stock
   *
   * This also fixes restocking an old out-of-stock product.
   */
  const stockQuantity = Math.max(
    0,
    Math.floor(input.stockQuantity),
  );

  await db
    .update(products)
    .set({
      categoryId: input.categoryId,
      name: input.name.trim(),
      slug,
      sku: input.sku?.trim() || null,
      details: input.details.trim(),
      fabric: input.fabric.trim(),
      color: input.color.trim(),
      priceTaka: input.priceTaka,
      oldPriceTaka: input.oldPriceTaka ?? null,
      stockQuantity,
      isInStock: stockQuantity > 0,
      featured: input.featured,
      discountPercent: discount(
        input.priceTaka,
        input.oldPriceTaka,
      ),
    })
    .where(eq(products.id, productId));

  // Fetch the updated product and return the real DB record.
  const [updatedProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!updatedProduct) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Product update failed.",
    });
  }

  return updatedProduct;
}

export async function deleteAdminProduct(productId: number) {
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  await db
    .delete(products)
    .where(eq(products.id, productId));

  return {
    success: true as const,
  };
}

export async function uploadAdminProductImage(
  productId: number,
  input: {
    dataUrl: string;
    fileName: string;
    altText: string;
    isCover: boolean;
  },
) {
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  const dataMatch = input.dataUrl.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/,
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
    input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_") ||
    "product-image";

  const uploaded = await saveLocalProductImage(
    productId,
    bytes,
    dataMatch[1],
    safeName,
  );

  const existing = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId));

  const position = existing.length;

  if (input.isCover || existing.length === 0) {
    await db
      .update(productImages)
      .set({ isCover: false })
      .where(eq(productImages.productId, productId));
  }

  await db.insert(productImages).values({
    productId,
    storageKey: uploaded.key,
    storageUrl: uploaded.url,
    altText: input.altText || "Rabiora product image",
    position,
    isCover: input.isCover || existing.length === 0,
  });

  return uploaded;
}

export async function setAdminProductCover(
  productId: number,
  imageId: number,
) {
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId))
    .limit(1);

  if (!image || image.productId !== productId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Product image not found.",
    });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(productImages)
      .set({ isCover: false })
      .where(eq(productImages.productId, productId));

    await tx
      .update(productImages)
      .set({ isCover: true })
      .where(eq(productImages.id, imageId));
  });

  return {
    success: true as const,
  };
}

export async function removeAdminProductImage(
  productId: number,
  imageId: number,
) {
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId))
    .limit(1);

  if (!image || image.productId !== productId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Product image not found.",
    });
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(productImages)
      .where(eq(productImages.id, imageId));

    if (image.isCover) {
      const remaining = await tx
        .select()
        .from(productImages)
        .where(eq(productImages.productId, productId));

      const nextCover = remaining.sort(
        (a, b) => a.position - b.position,
      )[0];

      if (nextCover) {
        await tx
          .update(productImages)
          .set({ isCover: true })
          .where(eq(productImages.id, nextCover.id));
      }
    }
  });

  await removeLocalProductImage(image.storageKey);

  return {
    success: true as const,
  };
}

export async function listAdminOrders() {
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  const orderRows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  if (orderRows.length === 0) {
    return [];
  }

  const ids = orderRows.map((order) => order.id);

  const itemRows = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, ids));

  const paymentRows = await db
    .select()
    .from(payments)
    .where(inArray(payments.orderId, ids));

  return orderRows.map((order) => ({
    ...order,
    items: itemRows.filter(
      (item) => item.orderId === order.id,
    ),
    payment:
      paymentRows.find(
        (payment) => payment.orderId === order.id,
      ) ?? null,
  }));
}

export async function listAdminCustomers() {
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
      totalOrders: sql<number>`COALESCE(COUNT(${orders.id}), 0)`,
    })
    .from(users)
    .leftJoin(orders, eq(users.id, orders.userId))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

  return rows.map((row) => ({
    ...row,
    totalOrders: Number(row.totalOrders),
  }));
}

export async function getAdminCustomerDetail(
  customerId: number,
) {
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  const [customer] = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, customerId))
    .limit(1);

  if (!customer) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Customer not found.",
    });
  }

  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, customerId))
    .orderBy(desc(orders.createdAt));

  return {
    ...customer,
    orders: customerOrders,
  };
}

export async function advanceOrderStatus(
  orderId: number,
  nextStatus: "confirmed" | "shipped" | "delivered",
  actorUserId: number,
  adminNote?: string,
) {
  const db = await getDb();

  if (!db) {
    failUnavailable();
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

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

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status: nextStatus,
        adminNote: adminNote?.trim() || null,
      })
      .where(eq(orders.id, orderId));

    await tx.insert(orderStatusHistory).values({
      orderId,
      previousStatus: order.status,
      nextStatus,
      actorUserId,
      adminNote: adminNote?.trim() || null,
    });
  });

  return {
    success: true as const,
    status: nextStatus,
  };
}