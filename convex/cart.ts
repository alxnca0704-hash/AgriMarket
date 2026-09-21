import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

const CART_ITEM_LIMIT = 200;

async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();
}

async function getCartItem(
  ctx: MutationCtx,
  userId: Id<"users">,
  productId: Id<"products">
) {
  return await ctx.db
    .query("cartItems")
    .withIndex("by_userId_and_productId", (q) =>
      q.eq("userId", userId).eq("productId", productId)
    )
    .first();
}

export const getMyCart = query({
  args: {},
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    return await ctx.db
      .query("cartItems")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(CART_ITEM_LIMIT);
  },
});

export const addItem = mutation({
  args: { productId: v.id("products"), qty: v.number() },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Sign in to add items to your cart");

    const product = await ctx.db.get("products", args.productId);
    if (product === null || !product.isActive || product.stockQty <= 0) {
      throw new Error("This product is no longer available");
    }

    const qty = Math.max(1, Math.min(Math.floor(args.qty), product.stockQty));
    const existing = await getCartItem(ctx, user._id, args.productId);
    if (existing) {
      const nextQty = Math.min(existing.qty + qty, product.stockQty);
      await ctx.db.patch("cartItems", existing._id, { qty: nextQty });
    } else {
      await ctx.db.insert("cartItems", {
        userId: user._id,
        productId: args.productId,
        stallId: product.stallId,
        qty,
      });
    }
    return null;
  },
});

export const updateQty = mutation({
  args: { productId: v.id("products"), qty: v.number() },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Sign in to add items to your cart");

    const existing = await getCartItem(ctx, user._id, args.productId);
    if (existing === null) return null;

    const product = await ctx.db.get("products", args.productId);
    const maxQty = Math.max(1, product?.stockQty ?? 1);
    const qty = Math.max(1, Math.min(Math.floor(args.qty), maxQty));
    await ctx.db.patch("cartItems", existing._id, { qty });
    return null;
  },
});

export const removeItem = mutation({
  args: { productId: v.id("products") },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Sign in to add items to your cart");

    const existing = await getCartItem(ctx, user._id, args.productId);
    if (existing) {
      await ctx.db.delete("cartItems", existing._id);
    }
    return null;
  },
});

export const clearCart = mutation({
  args: {},
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Sign in to add items to your cart");

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(CART_ITEM_LIMIT);
    for (const item of items) {
      await ctx.db.delete("cartItems", item._id);
    }
    return null;
  },
});