import { TRPCError } from "@trpc/server";
import { connectMongo } from "./config/db";
import { OrderModel, ProductModel, ReviewModel, UserModel, findOrderQuery, findProductQuery, findUserQuery } from "./models";

function failUnavailable(): never {
  throw new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message: "The review database is temporarily unavailable.",
  });
}

function normalizeReview(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function canCustomerReviewProduct(
  userId: string | number,
  productId: string | number,
  orderId: string | number
) {
  await connectMongo();

  const user = await UserModel.findOne(findUserQuery(userId));
  if (!user) return false;

  const product = await ProductModel.findOne(findProductQuery(productId));
  if (!product) return false;

  const order = await OrderModel.findOne({
    ...findOrderQuery(orderId),
    userId: user._id,
    status: "delivered",
  });

  if (!order) return false;

  const hasItem = (order.items || []).some(
    (item) => item.productId?.toString() === product._id.toString() || item.productName === product.name
  );

  return hasItem;
}

export async function createProductReview(
  userId: string | number,
  input: {
    productId: string | number;
    orderId: string | number;
    rating: number;
    review: string;
  }
) {
  await connectMongo();

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
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

  const user = await UserModel.findOne(findUserQuery(userId));
  if (!user) failUnavailable();

  const product = await ProductModel.findOne(findProductQuery(input.productId));

  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Product not found.",
    });
  }

  const eligible = await canCustomerReviewProduct(userId, input.productId, input.orderId);

  if (!eligible) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can review a product only after purchasing and receiving it.",
    });
  }

  const existing = await ReviewModel.findOne({
    productId: product._id,
    userId: user._id,
  });

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "You have already reviewed this product for this order.",
    });
  }

  let orderDoc = null;
  if (input.orderId) {
    orderDoc = await OrderModel.findOne(findOrderQuery(input.orderId));
  }

  const created = await ReviewModel.create({
    productId: product._id,
    userId: user._id,
    orderId: orderDoc ? orderDoc._id : undefined,
    rating: input.rating,
    review: reviewText,
    isVisible: true,
  });

  return {
    id: created._id.toString(),
    productId: product.legacyId ?? product._id.toString(),
    userId: user._id.toString(),
    orderId: orderDoc ? orderDoc.orderNumber : String(input.orderId),
    rating: created.rating,
    review: created.review,
    isVisible: created.isVisible,
    createdAt: created.createdAt,
  };
}

export async function listProductReviews(productId: string | number) {
  await connectMongo();

  const product = await ProductModel.findOne(findProductQuery(productId));

  if (!product) return [];

  const reviews = await ReviewModel.find({
    productId: product._id,
    isVisible: true,
  })
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .lean();

  return reviews.map((r) => {
    const u: any = r.userId;
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
      customerName: u?.name || "Customer",
    };
  });
}

export async function listAdminReviews() {
  await connectMongo();

  const reviews = await ReviewModel.find()
    .populate("productId", "name legacyId")
    .populate("userId", "name phone")
    .sort({ createdAt: -1 })
    .lean();

  return reviews.map((r) => {
    const p: any = r.productId;
    const u: any = r.userId;
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
      updatedAt: r.updatedAt,
    };
  });
}

export async function setReviewVisibility(reviewId: string | number, isVisible: boolean) {
  await connectMongo();

  const review = await ReviewModel.findById(reviewId);
  if (!review) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Review not found.",
    });
  }

  review.isVisible = isVisible;
  await review.save();

  return {
    success: true as const,
    isVisible,
  };
}

export async function deleteProductReview(reviewId: string | number) {
  await connectMongo();

  await ReviewModel.findByIdAndDelete(reviewId);

  return {
    success: true as const,
  };
}

export async function getProductRatingSummary(productId: string | number) {
  await connectMongo();

  const product = await ProductModel.findOne(findProductQuery(productId));

  if (!product) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const reviews = await ReviewModel.find({
    productId: product._id,
    isVisible: true,
  }).lean();

  if (reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const totalReviews = reviews.length;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  return {
    averageRating: Math.round(avg * 10) / 10,
    totalReviews,
  };
}

export async function listVisibleReviewsForHome() {
  await connectMongo();

  const reviews = await ReviewModel.find({ isVisible: true })
    .populate("productId", "name legacyId")
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  return reviews.map((r) => {
    const p: any = r.productId;
    const u: any = r.userId;
    return {
      id: r._id.toString(),
      productId: p?.legacyId ?? p?._id?.toString(),
      productName: p?.name || "Product",
      customerName: u?.name || "Verified Buyer",
      rating: r.rating,
      review: r.review,
      createdAt: r.createdAt,
      isVisible: r.isVisible,
    };
  });
}