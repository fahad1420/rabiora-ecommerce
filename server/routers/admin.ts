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
  updateAdminCustomerRole,
  updateAdminProduct,
  uploadAdminProductImage,
  uploadMultipleAdminProductImages,
} from "../adminService";

import {
  listAdminReviews,
  setReviewVisibility,
  deleteProductReview,
} from "../reviewService";
import {
  updateAdminSiteSettings,
  listAdminSubscribers,
  deleteAdminSubscriber,
  listAdminOfferBanners,
  createAdminOfferBanner,
  updateAdminOfferBanner,
  deleteAdminOfferBanner,
  uploadAdminOfferImage,
} from "../marketingService";

import {
  listAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
} from "../couponService";

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
          dataUrl: z.string().max(10_000_000),
          fileName: z.string().max(240),
          altText: z.string().trim().max(280),
          isCover: z.boolean(),
        })
      )
      .mutation(({ input }) =>
        uploadAdminProductImage(input.productId, input)
      ),

    uploadMultipleImages: adminProcedure
      .input(
        z.object({
          productId: idSchema,
          images: z.array(
            z.object({
              dataUrl: z.string().max(10_000_000),
              fileName: z.string().max(240),
              altText: z.string().trim().max(280).optional(),
              isCover: z.boolean().optional(),
            })
          ),
        })
      )
      .mutation(({ input }) =>
        uploadMultipleAdminProductImages(input.productId, input.images)
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

    updateRole: adminProcedure
      .input(
        z.object({
          id: idSchema,
          role: z.enum(["user", "admin"]),
        })
      )
      .mutation(({ input }) => updateAdminCustomerRole(input.id, input.role)),
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

  settings: router({
    update: adminProcedure
      .input(
        z.object({
          bkashNumber: z.string().trim().optional(),
          nagadNumber: z.string().trim().optional(),
          rocketNumber: z.string().trim().optional(),
          deliveryChargeDhaka: z.number().int().nonnegative().optional(),
          deliveryChargeOutsideDhaka: z.number().int().nonnegative().optional(),
          featuredProductId: z.string().trim().optional(),
          featuredPictureUrl: z.string().trim().optional(),
          featuredPictureLink: z.string().trim().optional(),
          featuredTitle: z.string().trim().optional(),
          heroBadge: z.string().trim().optional(),
          heroHeading: z.string().trim().optional(),
          heroTagline: z.string().trim().optional(),
          heroImageUrl: z.string().trim().optional(),
        })
      )
      .mutation(({ input }) => updateAdminSiteSettings(input)),
  }),

  subscribers: router({
    list: adminProcedure.query(() => listAdminSubscribers()),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => deleteAdminSubscriber(input.id)),
  }),

  offers: router({
    list: adminProcedure.query(() => listAdminOfferBanners()),
    create: adminProcedure
      .input(
        z.object({
          offerType: z.enum(["text", "image_banner"]).optional(),
          title: z.string().trim().min(1).max(200),
          subtitle: z.string().trim().max(300).optional(),
          badge: z.string().trim().max(100).optional(),
          discountCode: z.string().trim().max(50).optional(),
          imageUrl: z.string().trim().optional(),
          linkUrl: z.string().trim().max(300).optional(),
          isActive: z.boolean().optional(),
          displayOrder: z.number().int().optional(),
        })
      )
      .mutation(({ input }) => createAdminOfferBanner(input)),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          offerType: z.enum(["text", "image_banner"]).optional(),
          title: z.string().trim().min(1).max(200).optional(),
          subtitle: z.string().trim().max(300).optional(),
          badge: z.string().trim().max(100).optional(),
          discountCode: z.string().trim().max(50).optional(),
          imageUrl: z.string().trim().optional(),
          linkUrl: z.string().trim().max(300).optional(),
          isActive: z.boolean().optional(),
          displayOrder: z.number().int().optional(),
        })
      )
      .mutation(({ input }) => updateAdminOfferBanner(input.id, input)),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => deleteAdminOfferBanner(input.id)),
    uploadImage: adminProcedure
      .input(
        z.object({
          dataUri: z.string().min(10),
          fileName: z.string().optional(),
        })
      )
      .mutation(({ input }) => uploadAdminOfferImage(input.dataUri, input.fileName)),
  }),

  coupons: router({
    list: adminProcedure.query(() => listAdminCoupons()),
    create: adminProcedure
      .input(
        z.object({
          code: z.string().trim().min(2).max(50),
          discountType: z.enum(["percentage"]).optional(),
          discountValue: z.number().int().min(1).max(100),
          isActive: z.boolean().optional(),
          expiryDate: z.string().nullable().optional(),
          minOrderAmount: z.number().int().nonnegative().optional(),
          usageLimit: z.number().int().positive().nullable().optional(),
          allowedPaymentMethods: z.array(z.string()).optional(),
        })
      )
      .mutation(({ input }) => createAdminCoupon(input)),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          code: z.string().trim().min(2).max(50).optional(),
          discountType: z.enum(["percentage"]).optional(),
          discountValue: z.number().int().min(1).max(100).optional(),
          isActive: z.boolean().optional(),
          expiryDate: z.string().nullable().optional(),
          minOrderAmount: z.number().int().nonnegative().optional(),
          usageLimit: z.number().int().positive().nullable().optional(),
          allowedPaymentMethods: z.array(z.string()).optional(),
        })
      )
      .mutation(({ input }) => updateAdminCoupon(input.id, input)),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => deleteAdminCoupon(input.id)),
  }),
});