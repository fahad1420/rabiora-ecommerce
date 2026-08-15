import { TRPCError } from "@trpc/server";
import { desc, eq, and, sql } from "drizzle-orm";
import {
  orderItems,
  orders,
  productReviews,
  products,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";

function failUnavailable(): never {
  throw new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message: "The review database is temporarily unavailable.",
  });
}

function normalizeReview(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Check whether a customer actually purchased the product
 * and the order has been delivered.
 */
export async function canCustomerReviewProduct(
  userId: number,
  productId: number,
  orderId: number,
) {
  const db = await getDb();
  if (!db) failUnavailable();

  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
    })
    .from(orders)
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.userId, userId),
        eq(orders.status, "delivered"),
      ),
    )
    .limit(1);

  if (!order) return false;

  const [item] = await db
    .select({
      id: orderItems.id,
    })
    .from(orderItems)
    .where(
      and(
        eq(orderItems.orderId, orderId),
        eq(orderItems.productId, productId),
      ),
    )
    .limit(1);

  return Boolean(item);
}

/**
 * Create a product review.
 */
export async function createProductReview(
  userId: number,
  input: {
    productId: number;
    orderId: number;
    rating: number;
    review: string;
  },
) {
  const db = await getDb();
  if (!db) failUnavailable();

  if (
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Rating must be between 1 and 5.",
    });
  }

  const reviewText = normalizeReview(input.review);

  if (reviewText.length < 3) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Review must contain at least 3 characters.",
    });
  }

  if (reviewText.length > 2000) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Review must not exceed 2000 characters.",
    });
  }

  const [product] = await db
    .select({
      id: products.id,
    })
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);

  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Product not found.",
    });
  }

  const eligible = await canCustomerReviewProduct(
    userId,
    input.productId,
    input.orderId,
  );

  if (!eligible) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "You can review a product only after purchasing and receiving it.",
    });
  }

  const [existing] = await db
    .select({
      id: productReviews.id,
    })
    .from(productReviews)
    .where(
      and(
        eq(productReviews.productId, input.productId),
        eq(productReviews.userId, userId),
        eq(productReviews.orderId, input.orderId),
      ),
    )
    .limit(1);

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "You have already reviewed this product for this order.",
    });
  }

  const [created] = await db
    .insert(productReviews)
    .values({
      productId: input.productId,
      userId,
      orderId: input.orderId,
      rating: input.rating,
      review: reviewText,
      isVisible: true,
    })
    .$returningId();

  if (!created?.id) {
    throw new Error("Review creation failed.");
  }

  const [result] = await db
    .select()
    .from(productReviews)
    .where(eq(productReviews.id, created.id))
    .limit(1);

  if (!result) {
    throw new Error("Review creation failed.");
  }

  return result;
}

/**
 * Get visible reviews for a product.
 */
export async function listProductReviews(productId: number) {
  const db = await getDb();
  if (!db) failUnavailable();

  return db
    .select({
      id: productReviews.id,
      productId: productReviews.productId,
      userId: productReviews.userId,
      orderId: productReviews.orderId,
      rating: productReviews.rating,
      review: productReviews.review,
      isVisible: productReviews.isVisible,
      createdAt: productReviews.createdAt,
      updatedAt: productReviews.updatedAt,
      customerName: users.name,
    })
    .from(productReviews)
    .leftJoin(users, eq(productReviews.userId, users.id))
    .where(
      and(
        eq(productReviews.productId, productId),
        eq(productReviews.isVisible, true),
      ),
    )
    .orderBy(desc(productReviews.createdAt));
}

/**
 * Get all reviews for admin.
 */
export async function listAdminReviews() {
  const db = await getDb();
  if (!db) failUnavailable();

  return db
    .select({
      id: productReviews.id,
      productId: productReviews.productId,
      productName: products.name,
      userId: productReviews.userId,
      customerName: users.name,
      customerPhone: users.phone,
      orderId: productReviews.orderId,
      rating: productReviews.rating,
      review: productReviews.review,
      isVisible: productReviews.isVisible,
      createdAt: productReviews.createdAt,
      updatedAt: productReviews.updatedAt,
    })
    .from(productReviews)
    .innerJoin(
      products,
      eq(productReviews.productId, products.id),
    )
    .innerJoin(
      users,
      eq(productReviews.userId, users.id),
    )
    .orderBy(desc(productReviews.createdAt));
}

/**
 * Show or hide a review from the storefront.
 */
export async function setReviewVisibility(
  reviewId: number,
  isVisible: boolean,
) {
  const db = await getDb();
  if (!db) failUnavailable();

  const [review] = await db
    .select({
      id: productReviews.id,
    })
    .from(productReviews)
    .where(eq(productReviews.id, reviewId))
    .limit(1);

  if (!review) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Review not found.",
    });
  }

  await db
    .update(productReviews)
    .set({
      isVisible,
    })
    .where(eq(productReviews.id, reviewId));

  return {
    success: true as const,
    isVisible,
  };
}

/**
 * Delete a review permanently.
 */
export async function deleteProductReview(reviewId: number) {
  const db = await getDb();
  if (!db) failUnavailable();

  const [review] = await db
    .select({
      id: productReviews.id,
    })
    .from(productReviews)
    .where(eq(productReviews.id, reviewId))
    .limit(1);

  if (!review) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Review not found.",
    });
  }

  await db
    .delete(productReviews)
    .where(eq(productReviews.id, reviewId));

  return {
    success: true as const,
  };
}

/**
 * Get rating summary for a product.
 */
export async function getProductRatingSummary(
  productId: number,
) {
  const db = await getDb();
  if (!db) failUnavailable();

  const [summary] = await db
    .select({
      averageRating: sql<number>`COALESCE(AVG(${productReviews.rating}), 0)`,
      totalReviews: sql<number>`COUNT(${productReviews.id})`,
    })
    .from(productReviews)
    .where(
      and(
        eq(productReviews.productId, productId),
        eq(productReviews.isVisible, true),
      ),
    );

  return {
    averageRating: Number(summary?.averageRating ?? 0),
    totalReviews: Number(summary?.totalReviews ?? 0),
  };
}

/**
 * Get latest visible reviews for homepage.
 */
export async function listVisibleReviewsForHome() {
  const db = await getDb();
  if (!db) failUnavailable();

  return db
    .select({
      id: productReviews.id,
      productId: productReviews.productId,
      productName: products.name,
      customerName: users.name,
      rating: productReviews.rating,
      review: productReviews.review,
      createdAt: productReviews.createdAt,
      isVisible: productReviews.isVisible,
    })
    .from(productReviews)
    .innerJoin(
      products,
      eq(productReviews.productId, products.id),
    )
    .leftJoin(
      users,
      eq(productReviews.userId, users.id),
    )
    .where(eq(productReviews.isVisible, true))
    .orderBy(desc(productReviews.createdAt))
    .limit(6);
}