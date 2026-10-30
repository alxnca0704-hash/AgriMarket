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
  productId: Id<"products">,
  variantId: string
) {
  const rows = await ctx.db.query("cartItems").withIndex("by_userId_and_productId", (q) => q.eq("userId", userId).eq("productId", productId)).take(CART_ITEM_LIMIT);
  return rows.find((row) => row.variantId === variantId || (row.variantId === undefined && variantId === `legacy-${productId}`)) ?? null;
}

function variantsFor(product: Doc<"products">) {
  return product.variants ?? [{ id: `legacy-${product._id}`, name: product.unit || "Standard", price: product.price, stock: product.stockQty, sortOrder: 0 }];
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
  args: { productId: v.id("products"), variantId: v.string(), qty: v.number() },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Sign in to add items to your cart");

    const product = await ctx.db.get("products", args.productId);
    const variant = product === null ? null : variantsFor(product).find((candidate) => candidate.id === args.variantId && !candidate.archived);
    if (product === null || !product.isActive || !variant || variant.stock <= 0) {
      throw new Error("This product is no longer available");
    }

    if (!Number.isFinite(args.qty) || !Number.isInteger(args.qty) || args.qty < 1) throw new Error("Enter a valid quantity");
    const qty = Math.min(args.qty, variant.stock);
    const existing = await getCartItem(ctx, user._id, args.productId, args.variantId);
    if (existing) {
      const nextQty = Math.min(existing.qty + qty, variant.stock);
      await ctx.db.patch("cartItems", existing._id, { qty: nextQty, variantId: args.variantId, priceAtAdd: existing.priceAtAdd ?? variant.price });
    } else {
      await ctx.db.insert("cartItems", {
        userId: user._id,
        productId: args.productId,
        variantId: args.variantId,
        priceAtAdd: variant.price,
        stallId: product.stallId,
        qty,
      });
    }
    return null;
  },
});

export const updateQty = mutation({
  args: { productId: v.id("products"), variantId: v.string(), qty: v.number() },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Sign in to add items to your cart");

    const existing = await getCartItem(ctx, user._id, args.productId, args.variantId);
    if (existing === null) return null;

    const product = await ctx.db.get("products", args.productId);
    const variant = product?.isActive ? variantsFor(product).find((candidate) => candidate.id === args.variantId && !candidate.archived && candidate.stock > 0) : null;
    if (!variant) throw new Error("This product type is no longer available");
    if (!Number.isFinite(args.qty) || !Number.isInteger(args.qty) || args.qty < 1) throw new Error("Enter a valid quantity");
    const qty = Math.min(args.qty, variant.stock);
    await ctx.db.patch("cartItems", existing._id, { qty });
    return null;
  },
});

export const removeItem = mutation({
  args: { productId: v.id("products"), variantId: v.string() },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Sign in to add items to your cart");

    const existing = await getCartItem(ctx, user._id, args.productId, args.variantId);
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
