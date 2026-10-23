import { v } from "convex/values";
import { ADMIN_EMAIL } from "../constants/roles";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { createNotification } from "./notifications";
import { makeFunctionReference } from "convex/server";

const waiveRefundedOrderRef = makeFunctionReference<"mutation", { orderId: Id<"orders"> }, null>("commissions:waiveRefundedOrder");

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

const pendingRefundValidator = v.array(v.object({
  orderId: v.id("orders"),
  status: v.union(
    v.literal("refund-requested"),
    v.literal("return-approved"),
    v.literal("return-in-transit"),
    v.literal("return-received")
  ),
  paymentMethod: v.union(v.literal("cod"), v.literal("gcash")),
  paymentReference: v.string(),
  buyerName: v.string(),
  buyerMobileNumber: v.string(),
  sellerName: v.string(),
  reason: v.string(),
  evidenceUrls: v.array(v.string()),
  returnAddress: v.string(),
  returnCarrier: v.string(),
  returnTrackingNumber: v.string(),
  total: v.number(),
  requestedAt: v.string(),
}));

export const getPendingRefundCount = query({
  args: {},
  returns: v.number(),
  async handler(ctx) {
    await requireAdminEmail(ctx);
    const requested = await ctx.db.query("orders")
      .withIndex("by_status", (q) => q.eq("status", "refund-requested"))
      .take(200);
    const received = await ctx.db.query("orders")
      .withIndex("by_status", (q) => q.eq("status", "return-received"))
      .take(200);
    return requested.length + received.length;
  },
});

export const listPendingRefundRequests = query({
  args: {},
  returns: pendingRefundValidator,
  async handler(ctx) {
    await requireAdminEmail(ctx);
    const statuses = ["refund-requested", "return-approved", "return-in-transit", "return-received"] as const;
    const refunds: Array<{
      orderId: Id<"orders">;
      status: (typeof statuses)[number];
      paymentMethod: "cod" | "gcash";
      paymentReference: string;
      buyerName: string;
      buyerMobileNumber: string;
      sellerName: string;
      reason: string;
      evidenceUrls: string[];
      returnAddress: string;
      returnCarrier: string;
      returnTrackingNumber: string;
      total: number;
      requestedAt: string;
    }> = [];
    const ordersByStatus = await Promise.all(statuses.map((status) =>
      ctx.db.query("orders")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(200)
    ));
    const orders = ordersByStatus.flat();
    for (const order of orders) {
      const buyer = await ctx.db.get("users", order.buyerId);
      refunds.push({
        orderId: order._id,
        status: order.status as (typeof statuses)[number],
        paymentMethod: order.paymentMethod,
        paymentReference: order.paymentReference ?? "Not provided",
        buyerName: buyer?.fullName ?? "Buyer",
        buyerMobileNumber: buyer?.mobileNumber ?? "",
        sellerName: order.sellerName,
        reason: order.refundReason ?? "No reason provided",
        evidenceUrls: order.refundEvidenceUrls ?? [],
        returnAddress: order.returnAddress ?? "",
        returnCarrier: order.returnCarrier ?? "",
        returnTrackingNumber: order.returnTrackingNumber ?? "",
        total: order.total,
        requestedAt: order.refundRequestedAt ?? order.updatedAt,
      });
    }
    return refunds.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  },
});

export const approveReturnRequest = mutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdminEmail(ctx);
    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.status !== "refund-requested") throw new Error("This return request is no longer awaiting review.");
    const stall = await ctx.db.get("stalls", order.stallId);
    if (!stall) throw new Error("The seller return address is unavailable.");
    const location = stall.location;
    const returnAddress = [
      stall.stallName,
      location.streetBuilding,
      location.barangay,
      location.cityMunicipality,
      location.province,
      location.region,
      location.postalCode,
    ].filter(Boolean).join(", ");
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "return-approved",
      returnApprovedAt: now,
      returnAddress,
      events: [...order.events, { status: "return-approved", label: "Return approved; buyer may ship goods back", at: now }],
      updatedAt: now,
    });
    await ctx.db.insert("adminAuditLog", {
      actorEmail,
      action: "return_approved",
      orderId: order._id,
      paymentReference: order.paymentReference ?? "Not provided",
      createdAt: now,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "return_approved",
      title: "Return request approved",
      body: `Your return request for order #${order._id.slice(-6).toUpperCase()} was approved! Please ship items to: ${returnAddress}`,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "return_approved",
      title: "Return request approved",
      body: `Admin approved return request for order #${order._id.slice(-6).toUpperCase()}. Awaiting buyer shipment.`,
    });
    return null;
  },
});

export const rejectReturnRequest = mutation({
  args: { orderId: v.id("orders"), reason: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdminEmail(ctx);
    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.status !== "refund-requested") throw new Error("This return request is no longer awaiting review.");
    const reason = args.reason.trim();
    if (reason.length < 5 || reason.length > 500) throw new Error("Enter a decision reason between 5 and 500 characters.");
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: order.returnFromStatus ?? "delivered",
      refundPayoutHold: false,
      refundRejectedAt: now,
      refundRejectReason: reason,
      returnFromStatus: undefined,
      events: [...order.events, { status: "refund-rejected", label: "Admin rejected return request", at: now }],
      updatedAt: now,
    });
    await ctx.db.insert("adminAuditLog", {
      actorEmail,
      action: "return_rejected",
      orderId: order._id,
      paymentReference: order.paymentReference ?? "Not provided",
      reason,
      createdAt: now,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "refund_rejected",
      title: "Return request rejected",
      body: `Your return request for order #${order._id.slice(-6).toUpperCase()} was rejected: "${reason}".`,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "refund_rejected",
      title: "Return request rejected",
      body: `Admin rejected return request for order #${order._id.slice(-6).toUpperCase()}. Payout hold lifted.`,
    });
    return null;
  },
});

export const completeReturnRefund = mutation({
  args: {
    orderId: v.id("orders"),
    refundReference: v.string(),
    refundMethod: v.union(v.literal("gcash"), v.literal("cash")),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdminEmail(ctx);
    const order = await ctx.db.get("orders", args.orderId);
    if (!order || order.status !== "return-received") throw new Error("The seller must confirm receipt before the refund can be completed.");
    const refundReference = args.refundReference.trim();
    if (refundReference.length < 3 || refundReference.length > 100) throw new Error("Enter a refund transaction or cash receipt reference between 3 and 100 characters.");
    const buyer = await ctx.db.get("users", order.buyerId);
    if (args.refundMethod === "gcash" && !buyer?.mobileNumber.trim()) {
      throw new Error("The buyer has no saved GCash/mobile number. Choose cash handoff or update the buyer's contact number first.");
    }
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "refunded",
      refundPayoutHold: false,
      refundConfirmedAt: now,
      refundMethod: args.refundMethod,
      refundReference,
      refundAmount: order.total,
      events: [...order.events, {
        status: "refunded",
        label: `Admin recorded refund via ${args.refundMethod === "gcash" ? "GCash" : "cash handoff"}`,
        at: now,
      }],
      updatedAt: now,
    });
    await ctx.db.insert("adminAuditLog", {
      actorEmail,
      action: "return_refunded",
      orderId: order._id,
      paymentReference: order.paymentReference ?? "Not provided",
      refundReference,
      refundMethod: args.refundMethod,
      refundAmount: order.total,
      createdAt: now,
    });
    await ctx.runMutation(waiveRefundedOrderRef, { orderId: order._id });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "refunded",
      title: "Refund completed",
      body: `Refund of ₱${order.total.toLocaleString()} for order #${order._id.slice(-6).toUpperCase()} has been processed via ${args.refundMethod === "gcash" ? "GCash" : "cash"}.`,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "refunded",
      title: "Refund completed",
      body: `Refund for order #${order._id.slice(-6).toUpperCase()} has been processed by admin.`,
    });
    return null;
  },
});

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
      if (args.decision === "paid") {
        await createNotification(ctx, {
          userId: order.buyerId,
          role: "buyer",
          orderId: order._id,
          type: "payment_approved",
          title: "GCash payment approved",
          body: `GCash payment for order #${order._id.slice(-6).toUpperCase()} was approved! The seller can now prepare your order.`,
        });
        await createNotification(ctx, {
          userId: order.sellerId,
          role: "seller",
          orderId: order._id,
          type: "payment_approved",
          title: "GCash payment verified",
          body: `GCash payment for order #${order._id.slice(-6).toUpperCase()} was approved by admin. You can now confirm the order.`,
        });
      } else {
        await createNotification(ctx, {
          userId: order.buyerId,
          role: "buyer",
          orderId: order._id,
          type: "payment_rejected",
          title: "GCash payment rejected",
          body: `GCash payment for order #${order._id.slice(-6).toUpperCase()} was rejected${reason ? `: "${reason}"` : ""}. Please resubmit your payment reference.`,
        });
      }
    }
    return null;
  },
});
