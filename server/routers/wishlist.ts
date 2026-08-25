import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getCustomerFromRequest } from "../customerSession";
import { addWishlistItem, getWishlist, removeWishlistItem } from "../wishlistService";
import { router, publicProcedure } from "../_core/trpc";

const idSchema = z.union([z.number(), z.string()]);

async function requireWishlistUser(ctx: { user: any; req: Parameters<typeof getCustomerFromRequest>[0] }) {
  const user = ctx.user ?? await getCustomerFromRequest(ctx.req);
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to save this item to your wishlist." });
  return user;
}

export const wishlistRouter = router({
  list: publicProcedure.query(async ({ ctx }) => getWishlist((await requireWishlistUser(ctx)).id)),
  add: publicProcedure.input(z.object({ productId: idSchema })).mutation(async ({ ctx, input }) => addWishlistItem((await requireWishlistUser(ctx)).id, input.productId)),
  remove: publicProcedure.input(z.object({ productId: idSchema })).mutation(async ({ ctx, input }) => removeWishlistItem((await requireWishlistUser(ctx)).id, input.productId)),
  mergeGuest: publicProcedure.input(z.object({ productIds: z.array(idSchema).max(100) })).mutation(async ({ ctx, input }) => {
    const user = await requireWishlistUser(ctx);
    for (const productId of Array.from(new Set(input.productIds))) await addWishlistItem(user.id, productId);
    return getWishlist(user.id);
  }),
});
