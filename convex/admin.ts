import { v } from "convex/values";
import { ADMIN_EMAIL } from "../constants/roles";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const settingsValidator = v.union(
  v.null(),
  v.object({
    qrUrl: v.string(),
    number: v.string(),
    updatedAt: v.string(),
  })
);

const pendingGcashValidator = v.array(v.object({
  orderId: v.id("orders"),
  paymentNote: v.string(),
  paymentReference: v.string(),
  expectedAmount: v.number(),
  buyerName: v.string(),
  sellerNames: v.array(v.string()),
  submittedAt: v.string(),
}));

export const getPendingGcashCount = query({
  args: {},
  returns: v.number(),
  async handler(ctx) {
    await requireAdminEmail(ctx);
    const orders = await ctx.db.query("orders")
      .withIndex("by_paymentMethod_and_paymentStatus", (q) => q.eq("paymentMethod", "gcash").eq("paymentStatus", "pending"))
      .take(200);
    return new Set(orders.map((order) => order.paymentNote).filter((note): note is string => note !== undefined)).size;
  },
});

async function requireAdminEmail(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || identity.email?.toLowerCase() !== ADMIN_EMAIL || identity.emailVerified !== true) {
    throw new Error("Not authorized");
  }
  return identity.email.toLowerCase();
}

export const getGcashSettings = query({
  args: {},
  returns: settingsValidator,
  async handler(ctx) {
    await requireAdminEmail(ctx);
    const settings = await ctx.db
      .query("gcashSettings")
      .withIndex("by_key", (q) => q.eq("key", "primary"))
      .first();
    return settings
      ? { qrUrl: settings.qrUrl, number: settings.number, updatedAt: settings.updatedAt }
      : null;
  },
});

export const updateGcashSettings = mutation({
  args: { qrUrl: v.string(), number: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdminEmail(ctx);
    const number = args.number.trim();
    const normalizedNumber = number.replace(/[\s-]/g, "");
    if (!/^(\+?63|0)?9\d{9}$/.test(normalizedNumber)) {
      throw new Error("Enter a valid Philippine mobile number.");
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(args.qrUrl);
    } catch {
      throw new Error("Upload a valid QR image before saving.");
    }
    if (parsedUrl.protocol !== "https:") {
      throw new Error("The QR image must use a secure URL.");
    }

    const current = await ctx.db
      .query("gcashSettings")
      .withIndex("by_key", (q) => q.eq("key", "primary"))
      .first();
    const now = new Date().toISOString();
    if (current) {
      await ctx.db.patch("gcashSettings", current._id, {
        qrUrl: args.qrUrl,
        number,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("gcashSettings", {
        key: "primary",
        qrUrl: args.qrUrl,
        number,
        updatedAt: now,
      });
    }
    await ctx.db.insert("adminAuditLog", {
      actorEmail,
      action: "gcash_settings_updated",
      ...(current ? { previousNumber: current.number, previousQrUrl: current.qrUrl } : {}),
      nextNumber: number,
      nextQrUrl: args.qrUrl,
      createdAt: now,
    });
    return null;
  },
});

export const listPendingGcashPayments = query({
  args: {},
  returns: pendingGcashValidator,
  async handler(ctx) {
    await requireAdminEmail(ctx);
    const orders = await ctx.db.query("orders")
      .withIndex("by_paymentMethod_and_paymentStatus", (q) => q.eq("paymentMethod", "gcash").eq("paymentStatus", "pending"))
      .order("desc")
      .take(200);
    const grouped = new Map<string, typeof orders>();
    for (const order of orders) {
      if (!order.paymentNote || !order.paymentReference) continue;
      const list = grouped.get(order.paymentNote) ?? [];
      list.push(order);
      grouped.set(order.paymentNote, list);
    }
    const payments = [];
    for (const [paymentNote, group] of grouped) {
      const buyer = await ctx.db.get("users", group[0].buyerId);
      const first = group[0];
      if (!first.paymentReference) continue;
      const expectedAmount = group.reduce((sum, order) => sum + order.total, 0);
      payments.push({
        orderId: first._id,
        paymentNote,
        paymentReference: first.paymentReference,
        expectedAmount,
        buyerName: buyer?.fullName ?? "Buyer",
        sellerNames: group.map((order) => order.sellerName),
        submittedAt: first.paymentSubmittedAt ?? first.placedAt,
      });
    }
    return payments;
  },
});

export const reviewGcashPayment = mutation({
  args: {
    paymentNote: v.string(),
    decision: v.union(v.literal("paid"), v.literal("rejected")),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdminEmail(ctx);
    const paymentNote = args.paymentNote.trim();
    const orders = await ctx.db.query("orders")
      .withIndex("by_paymentNote", (q) => q.eq("paymentNote", paymentNote))
      .take(200);
    const pending = orders.filter((order) => order.paymentMethod === "gcash" && order.paymentStatus === "pending");
    if (pending.length === 0) throw new Error("This payment is no longer awaiting review.");
    if (pending.some((order) => order.status === "cancelled") || pending.length !== orders.length) {
      throw new Error("This payment group contains an order that cannot be approved or rejected here.");
    }
    if (pending.some((order) => !order.paymentReference)) {
      throw new Error("Payment reference number is missing.");
    }
    const reason = args.reason?.trim();
    if (args.decision === "rejected" && (!reason || reason.length < 5 || reason.length > 500)) {
      throw new Error("Enter a rejection reason between 5 and 500 characters.");
    }
    const now = new Date().toISOString();
    for (const order of pending) {
      await ctx.db.patch("orders", order._id, {
        paymentStatus: args.decision,
        ...(args.decision === "rejected" ? { paymentRejectionReason: reason } : { paymentRejectionReason: undefined }),
        paymentReviewEvents: [
          ...(order.paymentReviewEvents ?? []),
          {
            status: args.decision,
            label: args.decision === "paid" ? "GCash payment approved" : "GCash payment rejected",
            at: now,
            actorEmail,
            ...(reason ? { reason } : {}),
          },
        ],
        updatedAt: now,
      });
    }
    return null;
  },
});
