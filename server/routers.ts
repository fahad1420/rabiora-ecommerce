import { COOKIE_NAME } from "../shared/const";
import { z } from "zod";
import { getCatalogueProduct, listCatalogue } from "./catalogue";
import { cartRouter, customerRouter } from "./routers/customer";
import { wishlistRouter } from "./routers/wishlist";
import { orderRouter } from "./routers/orders";
import { adminRouter } from "./routers/admin";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

import { getPublicSiteSettings, listActiveOfferBanners, subscribeCustomer } from "./marketingService";

export const appRouter = router({
  system: systemRouter,
  settings: router({
    get: publicProcedure.query(() => getPublicSiteSettings()),
  }),
  offers: router({
    list: publicProcedure.query(() => listActiveOfferBanners()),
  }),
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().trim().email(),
        phone: z.string().trim().min(7).max(25),
        residency: z.enum(["inside_bangladesh", "outside_bangladesh"]),
      })
    )
    .mutation(({ input }) => subscribeCustomer(input)),
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalogue: router({
    list: publicProcedure.input(z.object({
      query: z.string().trim().max(80).optional(),
      featured: z.boolean().optional(),
      categorySlug: z.string().trim().max(140).optional(),
    }).optional()).query(({ input }) => listCatalogue(input)),
    bySlug: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(240) })).query(({ input }) => getCatalogueProduct(input.slug)),
  }),
  customer: customerRouter,
  cart: cartRouter,
  wishlist: wishlistRouter,
  order: orderRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
