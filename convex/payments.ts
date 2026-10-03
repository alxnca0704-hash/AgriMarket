import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getOrderForPayment = internalQuery({
  args: { orderId: v.id("orders"), tokenIdentifier: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("orders"),
      total: v.number(),
      paymentMethod: v.union(v.literal("cod"), v.literal("gcash")),
      paymentStatus: v.union(v.literal("unpaid"), v.literal("paid"), v.literal("failed"), v.literal("expired"), v.literal("awaiting_gcash_authorization"), v.literal("awaiting_payment_method")),
      status: v.string(),
      paymentIntentId: v.optional(v.string()),
      paymentClientKey: v.optional(v.string()),
      paymentMethodId: v.optional(v.string()),
      paymentRedirectUrl: v.optional(v.string()),
      buyerTokenIdentifier: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (!order) return null;
    const buyer = await ctx.db.get("users", order.buyerId);
    if (!buyer || buyer.tokenIdentifier !== args.tokenIdentifier) return null;
    return {
      _id: order._id,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      paymentIntentId: order.paymentIntentId,
      paymentClientKey: order.paymentClientKey,
      paymentMethodId: order.paymentMethodId,
      paymentRedirectUrl: order.paymentRedirectUrl,
      buyerTokenIdentifier: buyer.tokenIdentifier,
    };
  },
});

export const savePaymentIntent = internalMutation({
  args: { orderId: v.id("orders"), intentId: v.string(), clientKey: v.string(), methodId: v.string(), redirectUrl: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.paymentMethod !== "gcash" || (order.status !== "pending" && order.status !== "awaiting_gcash_authorization" && order.status !== "awaiting_payment_method")) {
      throw new Error("This order is no longer eligible for GCash payment");
    }
    if (order.paymentIntentId && order.paymentIntentId !== args.intentId) {
      throw new Error("A payment is already associated with this order");
    }
    await ctx.db.patch("orders", order._id, {
      paymentIntentId: args.intentId,
      paymentClientKey: args.clientKey,
      paymentMethodId: args.methodId,
      status: "pending",
      paymentRedirectUrl: args.redirectUrl,
      events: order.paymentIntentId
        ? order.events
        : [...order.events, { status: "payment-pending", label: "GCash payment started", at: new Date().toISOString() }],
      updatedAt: new Date().toISOString(),
    });
    return null;
  },
});

export const applyPaymentWebhook = internalMutation({
  args: {
    intentId: v.string(),
    status: v.union(v.literal("paid"), v.literal("failed"), v.literal("expired")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_paymentIntentId", (q) => q.eq("paymentIntentId", args.intentId))
      .unique();
    if (!order || order.paymentMethod !== "gcash" || (order.status !== "pending" && order.status !== "awaiting_gcash_authorization" && order.status !== "awaiting_payment_method")) return null;
    if (order.paymentStatus === "paid") return null;
    if (order.paymentStatus === "expired" && args.status !== "paid") return null;
    if (order.paymentStatus === "failed" && args.status === "failed") return null;
    if (order.paymentStatus !== "unpaid" && args.status === "failed") return null;
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      paymentStatus: args.status,
      status: "pending",
      events: [
        ...order.events,
        {
          status: args.status === "paid" ? "payment-paid" : args.status === "expired" ? "payment-expired" : "payment-failed",
          label: args.status === "paid" ? "GCash payment verified" : args.status === "expired" ? "GCash payment expired" : "GCash payment failed",
          at: now,
        },
      ],
      updatedAt: now,
    });
    return null;
  },
});
