import { TRPCError } from "@trpc/server";
import { connectMongo } from "./config/db";
import { ProductModel, UserModel, WishlistItemModel, findProductQuery, findUserQuery } from "./models";

export async function getWishlist(userId: string | number) {
  await connectMongo();

  const user = await UserModel.findOne(findUserQuery(userId));

  if (!user) return [];

  const items = await WishlistItemModel.find({ userId: user._id })
    .populate("productId")
    .lean();

  return items
    .filter((item) => item.productId != null)
    .map((item) => {
      const product: any = item.productId;
      const cover = (product.images || []).find((i: any) => i.isCover) || (product.images || [])[0];
      return {
        productId: product.legacyId ?? product._id.toString(),
        name: product.name,
        slug: product.slug,
        priceTaka: product.priceTaka,
        imageUrl: cover ? cover.storageUrl : "",
      };
    });
}

export async function addWishlistItem(userId: string | number, productId: string | number) {
  await connectMongo();

  const user = await UserModel.findOne(findUserQuery(userId));

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please log in to manage your wishlist." });
  }

  const product = await ProductModel.findOne(findProductQuery(productId));

  if (!product) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
  }

  await WishlistItemModel.findOneAndUpdate(
    { userId: user._id, productId: product._id },
    { $setOnInsert: { userId: user._id, productId: product._id } },
    { upsert: true }
  );

  return getWishlist(userId);
}

export async function removeWishlistItem(userId: string | number, productId: string | number) {
  await connectMongo();

  const user = await UserModel.findOne(findUserQuery(userId));

  if (!user) return [];

  const product = await ProductModel.findOne(findProductQuery(productId));

  if (product) {
    await WishlistItemModel.deleteOne({ userId: user._id, productId: product._id });
  }

  return getWishlist(userId);
}
