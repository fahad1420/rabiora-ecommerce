import { TRPCError } from "@trpc/server";
import { connectMongo } from "./config/db";
import { CartModel, ProductModel, UserModel, findProductQuery, findUserQuery } from "./models";
import { getCustomerFromRequest } from "./customerSession";
import { assertCartStock, nextCartQuantity, shouldRemoveCartItem } from "./cartRules";
import type { Request } from "express";

export type CartIdentity = { userId?: string; anonymousToken?: string };

function unavailable() {
  return new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Cart is temporarily unavailable." });
}

export async function resolveCartIdentity(
  req: Request,
  manuscriptUser: { id?: string | number; openId: string; name?: string | null; role: "user" | "admin" } | null,
  anonymousToken?: string
): Promise<CartIdentity> {
  if (manuscriptUser) return { userId: String(manuscriptUser.id || manuscriptUser.openId) };
  const customer = await getCustomerFromRequest(req);
  if (customer) return { userId: String(customer.id) };
  if (!anonymousToken || !/^[a-zA-Z0-9_-]{20,128}$/.test(anonymousToken)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A valid guest-cart token is required." });
  }
  return { anonymousToken };
}

async function getOrCreateCart(identity: CartIdentity) {
  await connectMongo();
  let query: Record<string, unknown> = {};

  if (identity.userId) {
    const userDoc = await UserModel.findOne(findUserQuery(identity.userId));
    if (userDoc) {
      query = { userId: userDoc._id };
    } else {
      query = { userId: identity.userId };
    }
  } else if (identity.anonymousToken) {
    query = { anonymousToken: identity.anonymousToken };
  } else {
    throw unavailable();
  }

  let cart = await CartModel.findOne(query);
  if (!cart) {
    cart = await CartModel.create({
      ...query,
      items: [],
    });
  }

  return cart;
}

export async function getCart(identity: CartIdentity) {
  const cart = await getOrCreateCart(identity);
  await cart.populate({
    path: "items.productId",
    model: "Product",
  });

  const items = (cart.items || [])
    .filter((item) => item.productId != null)
    .map((item) => {
      const product: any = item.productId;
      const coverImage = (product.images || []).find((img: any) => img.isCover) || (product.images || [])[0];
      const priceTaka = product.priceTaka || 0;
      const quantity = item.quantity || 1;
      return {
        itemId: item._id ? item._id.toString() : product._id.toString(),
        productId: product.legacyId ?? product._id.toString(),
        slug: product.slug,
        name: product.name,
        priceTaka,
        stockQuantity: product.stockQuantity || 0,
        isInStock: product.isInStock ?? true,
        imageUrl: coverImage ? coverImage.storageUrl : "",
        quantity,
        lineTotalTaka: priceTaka * quantity,
      };
    });

  const subtotalTaka = items.reduce((sum, item) => sum + item.lineTotalTaka, 0);

  return {
    id: cart._id.toString(),
    items,
    subtotalTaka,
  };
}

export async function addCartItem(identity: CartIdentity, productId: string | number, requestedQuantity = 1) {
  await connectMongo();
  const cart = await getOrCreateCart(identity);

  const product = await ProductModel.findOne(findProductQuery(productId));

  if (!product) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === product._id.toString()
  );

  const currentQty = existingItemIndex >= 0 ? cart.items[existingItemIndex].quantity : 0;
  const nextQuantity = nextCartQuantity(currentQty, requestedQuantity, product.stockQuantity, product.isInStock);

  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity = nextQuantity;
  } else {
    cart.items.push({
      productId: product._id as any,
      quantity: requestedQuantity,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await cart.save();
  return getCart(identity);
}

export async function updateCartItem(identity: CartIdentity, productId: string | number, quantity: number) {
  await connectMongo();
  const cart = await getOrCreateCart(identity);

  const product = await ProductModel.findOne(findProductQuery(productId));

  if (!product) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === product._id.toString()
  );

  if (existingItemIndex >= 0) {
    if (shouldRemoveCartItem(quantity)) {
      cart.items.splice(existingItemIndex, 1);
    } else {
      assertCartStock(product.isInStock, product.stockQuantity, quantity);
      cart.items[existingItemIndex].quantity = quantity;
    }
    await cart.save();
  }

  return getCart(identity);
}

export async function mergeGuestCart(userId: string | number, anonymousToken?: string) {
  if (!anonymousToken || !/^[a-zA-Z0-9_-]{20,128}$/.test(anonymousToken)) return;
  await connectMongo();

  const guestCart = await CartModel.findOne({ anonymousToken }).populate("items.productId");
  if (!guestCart || guestCart.items.length === 0) return;

  const userIdentity = { userId: String(userId) };

  for (const item of guestCart.items) {
    if (item.productId) {
      try {
        const prod: any = item.productId;
        await addCartItem(userIdentity, prod.legacyId ?? prod._id.toString(), item.quantity);
      } catch {
        // Skip unavailable items
      }
    }
  }

  await CartModel.deleteOne({ _id: guestCart._id });
}
