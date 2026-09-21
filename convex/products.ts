import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { productInputValidator } from "./shared";

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

export const listMyProducts = query({
  args: {},
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    const stall = await ctx.db
      .query("stalls")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (stall === null) return [];
    return await ctx.db
      .query("products")
      .withIndex("by_stallId", (q) => q.eq("stallId", stall._id))
      .order("desc")
      .take(200);
  },
});

export const getMyProduct = query({
  args: { productId: v.id("products") },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    const stall = await ctx.db
      .query("stalls")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (stall === null) return null;
    const product = await ctx.db.get("products", args.productId);
    if (product === null || product.stallId !== stall._id) return null;
    return product;
  },
});

export const createProduct = mutation({
  args: productInputValidator,
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Not authenticated");

    const stall = await ctx.db
      .query("stalls")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (stall === null) {
      throw new Error("Create your stall before adding products");
    }

    const id = await ctx.db.insert("products", {
      stallId: stall._id,
      name: args.name.trim(),
      category: args.category,
      price: args.price,
      unit: args.unit,
      stockQty: args.stockQty,
      harvestDate: args.harvestDate,
      ...(args.expiryDate ? { expiryDate: args.expiryDate } : {}),
      description: args.description.trim(),
      imageUrl: args.imageUrl,
      imageUrls: args.imageUrls,
      isActive: args.isActive,
      soldCount: 0,
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get("products", id);
  },
});

export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    patch: productInputValidator.partial(),
  },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Not authenticated");

    const stall = await ctx.db
      .query("stalls")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (stall === null) throw new Error("Stall not found");

    const current = await ctx.db.get("products", args.productId);
    if (current === null || current.stallId !== stall._id) {
      throw new Error("Product not found");
    }

    const patch: Record<string, unknown> = { ...args.patch };
    if (typeof patch.name === "string") patch.name = patch.name.trim();
    if (typeof patch.description === "string") {
      patch.description = patch.description.trim();
    }
    patch.updatedAt = new Date().toISOString();

    await ctx.db.patch("products", args.productId, patch);
    return null;
  },
});

export const setProductsOutOfStock = mutation({
  args: { productIds: v.array(v.id("products")) },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Not authenticated");

    const stall = await ctx.db
      .query("stalls")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (stall === null) throw new Error("Stall not found");

    const now = new Date().toISOString();
    for (const productId of args.productIds) {
      const current = await ctx.db.get("products", productId);
      if (current === null || current.stallId !== stall._id) continue;
      await ctx.db.patch("products", productId, {
        isActive: false,
        stockQty: 0,
        updatedAt: now,
      });
    }
    return null;
  },
});

export const deleteProducts = mutation({
  args: { productIds: v.array(v.id("products")) },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Not authenticated");

    const stall = await ctx.db
      .query("stalls")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (stall === null) throw new Error("Stall not found");

    for (const productId of args.productIds) {
      const current = await ctx.db.get("products", productId);
      if (current === null || current.stallId !== stall._id) continue;
      await ctx.db.delete("products", productId);
    }
    return null;
  },
});