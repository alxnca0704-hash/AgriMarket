import { query } from "./_generated/server";
import { v } from "convex/values";

const ACTIVE_PRODUCT_LIMIT = 1000;
const STALL_LIMIT = 500;

export const listStalls = query({
  args: {},
  async handler(ctx) {
    const stalls = await ctx.db.query("stalls").order("asc").take(STALL_LIMIT);
    const result: Array<{ stall: typeof stalls[number]; ownerName: string | null }> = [];
    for (const stall of stalls) {
      const owner = await ctx.db.get("users", stall.ownerId);
      result.push({ stall, ownerName: owner?.fullName ?? null });
    }
    return result;
  },
});

export const listActiveProducts = query({
  args: {},
  async handler(ctx) {
    const products = await ctx.db.query("products").order("desc").take(ACTIVE_PRODUCT_LIMIT);
    return products.filter((p) => p.isActive);
  },
});

export const getPublicProduct = query({
  args: { productId: v.id("products") },
  async handler(ctx, args) {
    const product = await ctx.db.get("products", args.productId);
    if (product === null || !product.isActive) return null;
    const stall = await ctx.db.get("stalls", product.stallId);
    if (stall === null) return null;
    const owner = await ctx.db.get("users", stall.ownerId);
    return { product, stall, ownerName: owner?.fullName ?? null };
  },
});

export const getPublicStall = query({
  args: { stallId: v.id("stalls") },
  async handler(ctx, args) {
    const stall = await ctx.db.get("stalls", args.stallId);
    if (stall === null) return null;
    const owner = await ctx.db.get("users", stall.ownerId);
    const products = await ctx.db
      .query("products")
      .withIndex("by_stallId", (q) => q.eq("stallId", args.stallId))
      .order("desc")
      .take(500);
    return {
      stall,
      ownerName: owner?.fullName ?? null,
      products: products.filter((p) => p.isActive),
    };
  },
});