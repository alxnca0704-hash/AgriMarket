import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

const SELLER_REVIEW_LIMIT = 200;

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

async function requireUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (user === null) throw new Error("Not authenticated");
  return user;
}

/** Buyer submits a review for a specific product within a delivered/completed order (one review per product per order). */
export const submitReview = mutation({
  args: {
    orderId: v.id("orders"),
    productId: v.id("products"),
    rating: v.number(),
    comment: v.string(),
  },
  async handler(ctx, args) {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    const comment = args.comment.trim();
    if (!comment) throw new Error("Please write a comment");
    if (comment.length > 500) throw new Error("Comment is too long");

    const buyer = await requireUser(ctx);

    const order = await ctx.db.get("orders", args.orderId);
    if (order === null || order.buyerId !== buyer._id) {
      throw new Error("Order not found");
    }
    if (order.status !== "delivered" && order.status !== "completed") {
      throw new Error("You can only review delivered or completed orders");
    }

    const orderItem = order.items.find((i) => i.productId === args.productId);
    if (!orderItem) {
      throw new Error("This product is not part of the order");
    }

    // Enforce one review per product per order
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .filter((q) =>
        q.and(
          q.eq(q.field("buyerId"), buyer._id),
          q.eq(q.field("productId"), args.productId)
        )
      )
      .first();
    if (existing !== null) {
      throw new Error("You have already reviewed this product for this order");
    }

    const now = new Date().toISOString();
    const reviewId = await ctx.db.insert("reviews", {
      orderId: args.orderId,
      productId: args.productId,
      productName: orderItem.name,
      buyerId: buyer._id,
      sellerId: order.sellerId,
      stallId: order.stallId,
      buyerName: buyer.fullName,
      rating: args.rating,
      comment,
      createdAt: now,
      updatedAt: now,
    });

    // Denormalize average rating on the stall
    await recomputeStallRating(ctx, order.stallId);

    return reviewId;
  },
});

/** Returns the review the current buyer left for a specific order (or null) — kept for backwards compat, returns first match. */
export const getReviewForOrder = query({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    const raw = await ctx.db
      .query("reviews")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .filter((q) => q.eq(q.field("buyerId"), user._id))
      .first();
    if (!raw || raw.productName) return raw;
    const order = await ctx.db.get("orders", raw.orderId);
    if (!order) return raw;
    const item = raw.productId
      ? order.items.find((i) => i.productId === raw.productId)
      : order.items[0];
    if (!item) return raw;
    return { ...raw, productId: item.productId, productName: item.name };
  },
});

/** Returns all reviews the current buyer left for a specific order (one per product).
 *  Enriches legacy reviews (missing productId/productName) by joining order items. */
export const getReviewsForOrder = query({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) return [];
    const rawReviews = await ctx.db
      .query("reviews")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .filter((q) => q.eq(q.field("buyerId"), user._id))
      .order("desc")
      .take(SELLER_REVIEW_LIMIT);

    const enriched = await Promise.all(
      rawReviews.map(async (review) => {
        if (review.productName) return review;
        const order = await ctx.db.get("orders", review.orderId);
        if (!order) return review;
        const item = review.productId
          ? order.items.find((i) => i.productId === review.productId)
          : order.items[0];
        if (!item) return review;
        return {
          ...review,
          productId: item.productId,
          productName: item.name,
        };
      })
    );
    return enriched;
  },
});

/** Public: list reviews for a specific product (buyer-facing product page).
 *  Includes legacy reviews that were saved without productId by joining the
 *  order's items snapshot — so `reply` from the seller is visible even for
 *  legacy data. */
export const listReviewsForProduct = query({
  args: { productId: v.id("products") },
  async handler(ctx, args) {
    const direct = await ctx.db
      .query("reviews")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(SELLER_REVIEW_LIMIT);

    // Fallback for legacy reviews where productId was not stored.
    // Scan recent reviews without productId and keep those whose order contains this product.
    const legacyAll = await ctx.db
      .query("reviews")
      .filter((q) => q.eq(q.field("productId"), undefined))
      .take(SELLER_REVIEW_LIMIT);

    const legacyMatched = (
      await Promise.all(
        legacyAll.map(async (review) => {
          const order = await ctx.db.get("orders", review.orderId);
          if (!order) return null;
          const item = order.items.find((i) => i.productId === args.productId);
          if (!item) return null;
          // Enrich so UI gets productName/reply display
          return {
            ...review,
            productId: item.productId,
            productName: item.name,
          };
        })
      )
    ).filter((r): r is NonNullable<typeof r> => r !== null);

    const merged = [...direct, ...legacyMatched];
    // Deduplicate by _id then sort by creation time desc
    const seen = new Set<string>();
    const deduped: typeof merged = [];
    for (const r of merged) {
      const id = r._id as unknown as string;
      if (seen.has(id)) continue;
      seen.add(id);
      deduped.push(r);
    }
    deduped.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return deduped.slice(0, SELLER_REVIEW_LIMIT);
  },
});

/** Seller lists all reviews for their stall (newest first).
 *  Enriches legacy reviews (missing productId/productName) by joining
 *  the order's items so every review carries a product name. */
export const listSellerReviews = query({
  args: {},
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (user === null) return [];
    const rawReviews = await ctx.db
      .query("reviews")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .take(SELLER_REVIEW_LIMIT);

    // Enrich legacy reviews that are missing productName by looking up
    // the order's items snapshot (always available).
    const enriched = await Promise.all(
      rawReviews.map(async (review) => {
        if (review.productName) return review; // already has product info

        const order = await ctx.db.get("orders", review.orderId);
        if (!order) return review;

        // Match by productId if we have it, otherwise fall back to first item
        const item = review.productId
          ? order.items.find((i) => i.productId === review.productId)
          : order.items[0];

        if (!item) return review;

        return {
          ...review,
          productId: item.productId,
          productName: item.name,
        };
      })
    );

    return enriched;
  },
});

/** Seller posts a reply to a review they own. */
export const replyToReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    reply: v.string(),
  },
  async handler(ctx, args) {
    const reply = args.reply.trim();
    if (!reply) throw new Error("Reply cannot be empty");
    if (reply.length > 500) throw new Error("Reply is too long");

    const seller = await requireUser(ctx);

    const review = await ctx.db.get("reviews", args.reviewId);
    if (review === null || review.sellerId !== seller._id) {
      throw new Error("Review not found");
    }
    if (review.reply !== undefined) {
      throw new Error("You have already replied to this review");
    }

    const now = new Date().toISOString();
    await ctx.db.patch("reviews", args.reviewId, {
      reply,
      repliedAt: now,
      updatedAt: now,
    });
    return null;
  },
});

/** One-off backfill for legacy reviews missing productId/productName. */
export const backfillLegacyReviews = mutation({
  args: {},
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    // Allow anonymous run via `npx convex run` (dev migration) — still safe, only fills missing fields
    // In prod, restrict to authenticated if needed
    const all = await ctx.db.query("reviews").take(SELLER_REVIEW_LIMIT);
    let patched = 0;
    for (const review of all) {
      if (review.productId && review.productName) continue;
      const order = await ctx.db.get("orders", review.orderId);
      if (!order) continue;
      const item = review.productId
        ? order.items.find((i) => i.productId === review.productId)
        : order.items[0];
      if (!item) continue;
      await ctx.db.patch("reviews", review._id, {
        productId: item.productId,
        productName: item.name,
        updatedAt: new Date().toISOString(),
      });
      patched++;
    }
    return { patched };
  },
});

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function recomputeStallRating(
  ctx: MutationCtx,
  stallId: Id<"stalls">
): Promise<void> {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_stallId", (q) => q.eq("stallId", stallId))
    .take(SELLER_REVIEW_LIMIT);

  const count = reviews.length;
  const avg =
    count > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

  const now = new Date().toISOString();
  await ctx.db.patch("stalls", stallId, {
    rating: Math.round(avg * 10) / 10,
    ratingCount: count,
    updatedAt: now,
  });
}
