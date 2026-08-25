import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  advanceOrderStatus,
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  deleteAdminProduct,
  getAdminCustomerDetail,
  listAdminCategories,
  listAdminCustomers,
  listAdminOrders,
  listAdminProducts,
  removeAdminProductImage,
  setAdminProductCover,
  updateAdminCategory,
  updateAdminProduct,
  uploadAdminProductImage,
} from "../adminService";

import {
  listAdminReviews,
  setReviewVisibility,
  deleteProductReview,
} from "../reviewService";

const idSchema = z.union([z.number(), z.string()]);

const productInput = z.object({
  categoryId: idSchema,
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

const categoryInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(140).optional(),
});

export const adminRouter = router({
  categories: router({
    list: adminProcedure.query(() => listAdminCategories()),

    create: adminProcedure
      .input(categoryInput)
      .mutation(({ input }) => createAdminCategory(input)),

    update: adminProcedure
      .input(
        z.object({
          id: idSchema,
          category: categoryInput,
        })
      )
      .mutation(({ input }) =>
        updateAdminCategory(input.id, input.category)
      ),

    remove: adminProcedure
      .input(
        z.object({
          id: idSchema,
        })
      )
      .mutation(({ input }) => deleteAdminCategory(input.id)),
  }),

  products: router({
    list: adminProcedure.query(() => listAdminProducts()),

    create: adminProcedure
      .input(productInput)
      .mutation(({ input }) => createAdminProduct(input as any)),

    update: adminProcedure
      .input(
        z.object({
          id: idSchema,
          product: productInput,
        })
      )
      .mutation(({ input }) =>
        updateAdminProduct(input.id, input.product as any)
      ),

    remove: adminProcedure
      .input(
        z.object({
          id: idSchema,
        })
      )
      .mutation(({ input }) => deleteAdminProduct(input.id)),

    uploadImage: adminProcedure
      .input(
        z.object({
          productId: idSchema,
          dataUrl: z.string().max(7_100_000),
          fileName: z.string().max(240),
          altText: z.string().trim().max(280),
          isCover: z.boolean(),
        })
      )
      .mutation(({ input }) =>
        uploadAdminProductImage(input.productId, input)
      ),

    setCover: adminProcedure
      .input(
        z.object({
          productId: idSchema,
          imageId: idSchema,
        })
      )
      .mutation(({ input }) =>
        setAdminProductCover(input.productId, input.imageId)
      ),

    removeImage: adminProcedure
      .input(
        z.object({
          productId: idSchema,
          imageId: idSchema,
        })
      )
      .mutation(({ input }) =>
        removeAdminProductImage(input.productId, input.imageId)
      ),
  }),

  orders: router({
    list: adminProcedure.query(() => listAdminOrders()),

    advanceStatus: adminProcedure
      .input(
        z.object({
          orderId: idSchema,
          nextStatus: z.enum([
            "confirmed",
            "shipped",
            "delivered",
          ]),
          adminNote: z.string().trim().max(1000).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        advanceOrderStatus(
          input.orderId,
          input.nextStatus,
          ctx.user.id,
          input.adminNote
        )
      ),
  }),

  customers: router({
    list: adminProcedure.query(() => listAdminCustomers()),

    detail: adminProcedure
      .input(
        z.object({
          id: idSchema,
        })
      )
      .query(({ input }) => getAdminCustomerDetail(input.id)),
  }),

  reviews: router({
    list: adminProcedure.query(() => listAdminReviews()),

    setVisibility: adminProcedure
      .input(
        z.object({
          reviewId: idSchema,
          isVisible: z.boolean(),
        })
      )
      .mutation(({ input }) =>
        setReviewVisibility(
          input.reviewId,
          input.isVisible
        )
      ),

    remove: adminProcedure
      .input(
        z.object({
          reviewId: idSchema,
        })
      )
      .mutation(({ input }) =>
        deleteProductReview(input.reviewId)
      ),
  }),
});