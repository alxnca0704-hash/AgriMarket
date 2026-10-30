import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { productInputValidator } from "./shared";

type Variant = { id: string; name: string; description?: string; price: number; stock: number; sortOrder: number; archived?: boolean };
function validateVariants(variants: Variant[]): Variant[] {
  if (variants.length < 1 || variants.length > 20) throw new Error("A product must have between 1 and 20 types");
  const names = new Set<string>();
  const ids = new Set<string>();
  return variants.map((variant, index) => {
    const name = variant.name.trim();
    const key = name.toLocaleLowerCase();
    if (!name || name.length > 60) throw new Error("Type names are required and must be 60 characters or fewer");
    if (names.has(key)) throw new Error("Type names must be unique within a product");
    names.add(key);
    if (!variant.id || variant.id.length > 100 || ids.has(variant.id)) throw new Error("Type identifiers must be unique");
    ids.add(variant.id);
    if (!Number.isFinite(variant.price) || variant.price <= 0 || Math.round(variant.price * 100) !== variant.price * 100) throw new Error(`Enter a valid price for ${name}`);
    if (!Number.isInteger(variant.stock) || variant.stock < 0) throw new Error(`Enter a valid stock for ${name}`);
    if ((variant.description ?? "").length > 200) throw new Error(`Description for ${name} must be 200 characters or fewer`);
    return { ...variant, name, archived: false, sortOrder: index, ...(variant.description?.trim() ? { description: variant.description.trim() } : { description: undefined }) };
  });
}
export function productVariants(product: { _id: string; variants?: Variant[]; unit: string; price: number; stockQty: number }): Variant[] {
  return product.variants ?? [{ id: `legacy-${product._id}`, name: product.unit || "Standard", price: product.price, stock: product.stockQty, sortOrder: 0 }];
}

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

    const variants = validateVariants(args.variants ?? [{ id: crypto.randomUUID(), name: args.unit, price: args.price, stock: args.stockQty, sortOrder: 0 }]);
    const displayPrice = Math.min(...variants.map((variant) => variant.price));
    const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
    const id = await ctx.db.insert("products", {
      stallId: stall._id,
      name: args.name.trim(),
      category: args.category,
      price: displayPrice,
      unit: args.unit,
      stockQty: totalStock,
      ...(args.harvestDate ? { harvestDate: args.harvestDate } : {}),
      ...(args.expiryDate ? { expiryDate: args.expiryDate } : {}),
      description: args.description.trim(),
      imageUrl: args.imageUrl,
      imageUrls: args.imageUrls,
      isActive: args.isActive,
      variants,
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
    const currentVariants = productVariants(current);
    const incoming = args.patch.variants
      ? validateVariants(args.patch.variants.filter((variant) => !variant.archived))
      : currentVariants.filter((variant) => !variant.archived);
    const incomingIds = new Set(incoming.map((variant) => variant.id));
    if (currentVariants.some((variant) => variant.archived && incomingIds.has(variant.id))) throw new Error("Archived types cannot be restored");
    const archived = currentVariants.filter((variant) => !incomingIds.has(variant.id)).map((variant) => ({ ...variant, archived: true }));
    const variants = [...incoming, ...archived];
    patch.variants = variants;
    patch.price = Math.min(...incoming.map((variant) => variant.price));
    patch.stockQty = incoming.reduce((sum, variant) => sum + variant.stock, 0);
    patch.unit = current.unit;
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
        variants: productVariants(current).map((variant) => ({ ...variant, stock: 0 })),
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
