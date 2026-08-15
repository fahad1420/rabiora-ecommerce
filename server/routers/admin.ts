import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  advanceOrderStatus,
  createAdminProduct,
  deleteAdminProduct,
  getAdminCustomerDetail,
  listAdminCategories,
  listAdminCustomers,
  listAdminOrders,
  listAdminProducts,
  removeAdminProductImage,
  setAdminProductCover,
  updateAdminProduct,
  uploadAdminProductImage,
} from "../adminService";

import {
  listAdminReviews,
  setReviewVisibility,
  deleteProductReview,
} from "../reviewService";

const productInput = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(2).max(220),
  slug: z.string().trim().max(240),
  sku: z.string().trim().max(80).optional(),
  details: z.string().trim().min(2).max(5000),
  fabric: z.string().trim().min(1).max(120),
  color: z.string().trim().min(1).max(120),
  priceTaka: z.number().int().positive(),
  oldPriceTaka: z.number().int().positive().optional(),
  stockQuantity: z.number().int().min(0).max(100000),
  featured: z.boolean(),
});

export const adminRouter = router({
  categories: adminProcedure.query(() => listAdminCategories()),

  products: router({
    list: adminProcedure.query(() => listAdminProducts()),

    create: adminProcedure
      .input(productInput)
      .mutation(({ input }) => createAdminProduct(input)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          product: productInput,
        }),
      )
      .mutation(({ input }) =>
        updateAdminProduct(input.id, input.product),
      ),

    remove: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
        }),
      )
      .mutation(({ input }) => deleteAdminProduct(input.id)),

    uploadImage: adminProcedure
      .input(
        z.object({
          productId: z.number().int().positive(),
          dataUrl: z.string().max(7_100_000),
          fileName: z.string().max(240),
          altText: z.string().trim().max(280),
          isCover: z.boolean(),
        }),
      )
      .mutation(({ input }) =>
        uploadAdminProductImage(input.productId, input),
      ),

    setCover: adminProcedure
      .input(
        z.object({
          productId: z.number().int().positive(),
          imageId: z.number().int().positive(),
        }),
      )
      .mutation(({ input }) =>
        setAdminProductCover(input.productId, input.imageId),
      ),

    removeImage: adminProcedure
      .input(
        z.object({
          productId: z.number().int().positive(),
          imageId: z.number().int().positive(),
        }),
      )
      .mutation(({ input }) =>
        removeAdminProductImage(input.productId, input.imageId),
      ),
  }),

  orders: router({
    list: adminProcedure.query(() => listAdminOrders()),

    advanceStatus: adminProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
          nextStatus: z.enum([
            "confirmed",
            "shipped",
            "delivered",
          ]),
          adminNote: z.string().trim().max(1000).optional(),
        }),
      )
      .mutation(({ ctx, input }) =>
        advanceOrderStatus(
          input.orderId,
          input.nextStatus,
          ctx.user.id,
          input.adminNote,
        ),
      ),
  }),

  customers: router({
    list: adminProcedure.query(() => listAdminCustomers()),

    detail: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
        }),
      )
      .query(({ input }) => getAdminCustomerDetail(input.id)),
  }),

  reviews: router({
    list: adminProcedure.query(() => listAdminReviews()),

    setVisibility: adminProcedure
      .input(
        z.object({
          reviewId: z.number().int().positive(),
          isVisible: z.boolean(),
        }),
      )
      .mutation(({ input }) =>
        setReviewVisibility(
          input.reviewId,
          input.isVisible,
        ),
      ),

    remove: adminProcedure
      .input(
        z.object({
          reviewId: z.number().int().positive(),
        }),
      )
      .mutation(({ input }) =>
        deleteProductReview(input.reviewId),
      ),
  }),
});