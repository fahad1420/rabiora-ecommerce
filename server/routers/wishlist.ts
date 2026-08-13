import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getCustomerFromRequest } from "../customerSession";
import { addWishlistItem, getWishlist, removeWishlistItem } from "../wishlistService";
import { router, publicProcedure } from "../_core/trpc";

async function requireWishlistUser(ctx: { user: { id: number } | null; req: Parameters<typeof getCustomerFromRequest>[0] }) {
  const user = ctx.user ?? await getCustomerFromRequest(ctx.req);
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to save this item to your wishlist." });
  return user;
}

export const wishlistRouter = router({
  list: publicProcedure.query(async ({ ctx }) => getWishlist((await requireWishlistUser(ctx)).id)),
  add: publicProcedure.input(z.object({ productId: z.number().int().positive() })).mutation(async ({ ctx, input }) => addWishlistItem((await requireWishlistUser(ctx)).id, input.productId)),
  remove: publicProcedure.input(z.object({ productId: z.number().int().positive() })).mutation(async ({ ctx, input }) => removeWishlistItem((await requireWishlistUser(ctx)).id, input.productId)),
  mergeGuest: publicProcedure.input(z.object({ productIds: z.array(z.number().int().positive()).max(100) })).mutation(async ({ ctx, input }) => {
    const user = await requireWishlistUser(ctx);
    for (const productId of Array.from(new Set(input.productIds))) await addWishlistItem(user.id, productId);
    return getWishlist(user.id);
  }),
});
