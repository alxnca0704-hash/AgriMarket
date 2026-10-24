import { v } from "convex/values";
import { ADMIN_EMAIL } from "../constants/roles";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { createNotification } from "./notifications";
import { makeFunctionReference } from "convex/server";
import { RETURN_REQUEST_WINDOW_MS } from "../constants/refunds";
import { COMMISSION_RATE } from "../constants/commissions";

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

const recordedRefundValidator = v.array(v.object({
  orderId: v.id("orders"),
  buyerName: v.string(),
  sellerName: v.string(),
  paymentMethod: v.union(v.literal("cod"), v.literal("gcash")),
  refundMethod: v.union(v.literal("gcash"), v.literal("cash"), v.null()),
  refundReference: v.string(),
  refundAmount: v.number(),
  refundedAt: v.string(),
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

export const listRecordedRefunds = query({
  args: {},
  returns: recordedRefundValidator,
  async handler(ctx) {
    await requireAdminEmail(ctx);
    const orders = await ctx.db.query("orders")
      .withIndex("by_status", q => q.eq("status", "refunded"))
      .order("desc")
      .take(500);
    const refunds = await Promise.all(orders.map(async order => {
      const buyer = await ctx.db.get("users", order.buyerId);
      return {
        orderId: order._id,
        buyerName: buyer?.fullName ?? "Buyer",
        sellerName: order.sellerName,
        paymentMethod: order.paymentMethod,
        refundMethod: order.refundMethod ?? null,
        refundReference: order.refundReference ?? "Not provided",
        refundAmount: order.refundAmount ?? order.total,
        refundedAt: order.refundConfirmedAt ?? order.updatedAt,
      };
    }));
    return refunds.sort((a, b) => b.refundedAt.localeCompare(a.refundedAt));
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
    if (order.paymentMethod === "gcash") {
      const commission = await ctx.db.query("platformCommissions").withIndex("by_orderId", q => q.eq("orderId", order._id)).unique();
      if (commission?.status === "pending") await ctx.db.patch("platformCommissions", commission._id, {
        status: "reversed", reversedAt: now,
        events: [...commission.events, { type: "reversed", label: "Commission reversed with order refund", at: now, actor: actorEmail }],
      });
      if (!commission) {
        const amount = order.commissionAmount ?? Math.round(order.subtotal * COMMISSION_RATE * 100) / 100;
        const rate = order.commissionRate ?? COMMISSION_RATE;
        const net = order.netPayoutAmount ?? Math.round((order.subtotal + order.deliveryFee - amount) * 100) / 100;
        const completedAt = order.completedAt ?? order.deliveredAt ?? now;
        await ctx.db.patch("orders", order._id, { commissionRate: rate, commissionAmount: amount, netPayoutAmount: net });
        await ctx.db.insert("platformCommissions", {
          orderId: order._id, stallId: order.stallId, sellerId: order.sellerId,
          itemsSubtotal: order.subtotal, rate, amount, status: "reversed", createdAt: completedAt, reversedAt: now,
          events: [
            { type: "accrued", label: "Legacy GCash commission backfilled", at: completedAt },
            { type: "reversed", label: "Commission reversed with order refund", at: now, actor: actorEmail },
          ],
        });
      }
    }
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

export const listAdminGcashPayments = query({
  args: {
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("all")),
    search: v.string(),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
    page: v.number(),
    pageSize: v.number(),
  },
  async handler(ctx, args) {
    await requireAdminEmail(ctx);
    const statuses = args.status === "all" ? ["pending", "paid", "rejected"] as const : [args.status === "approved" ? "paid" : args.status] as const;
    const ordersByStatus = await Promise.all(statuses.map((status) => ctx.db.query("orders")
      .withIndex("by_paymentMethod_and_paymentStatus", (q) => q.eq("paymentMethod", "gcash").eq("paymentStatus", status))
      .order("desc").take(1000)));
    const groups = new Map<string, typeof ordersByStatus[number]>();
    for (const order of ordersByStatus.flat()) {
      if (!order.paymentNote) continue;
      const group = groups.get(order.paymentNote) ?? [];
      group.push(order);
      groups.set(order.paymentNote, group);
    }
    const needle = args.search.trim().toLowerCase();
    const records = [];
    for (const [paymentNote, group] of groups) {
      const first = group[0];
      const buyer = await ctx.db.get("users", first.buyerId);
      const submittedAt = first.submittedAt ?? first.paymentSubmittedAt ?? first.placedAt;
      if ((args.from && submittedAt < args.from) || (args.to && submittedAt > args.to)) continue;
      if (needle && ![first.paymentReference ?? "", paymentNote, buyer?.fullName ?? "", ...group.map((order) => order.sellerName)].some((value) => value.toLowerCase().includes(needle))) continue;
      const events = group.flatMap((order) => order.paymentEvents ?? []).filter((event, index, all) => all.findIndex((candidate) => candidate.at === event.at && candidate.type === event.type && candidate.referenceNumber === event.referenceNumber) === index).sort((a, b) => a.at.localeCompare(b.at));
      const reference = first.paymentReference;
      const duplicateCandidates = reference ? await ctx.db.query("orders").withIndex("by_paymentStatus", (q) => q.eq("paymentStatus", "paid")).take(1000) : [];
      const normalizedReference = reference?.trim().replace(/\s+/g, " ").toUpperCase() ?? "";
      const duplicates = duplicateCandidates.filter((order) => order.paymentMethod === "gcash" && order.paymentReference?.trim().replace(/\s+/g, " ").toUpperCase() === normalizedReference);
      records.push({
        paymentNote, paymentReference: first.paymentReference ?? "", submittedAt, buyerName: buyer?.fullName ?? "Buyer",
        expectedAmount: group.reduce((sum, order) => sum + order.total, 0), status: first.paymentStatus,
        attemptNumber: first.attemptNumber ?? 1, reviewedBy: first.reviewedBy ?? "", reviewedAt: first.reviewedAt ?? "",
        rejectionReason: first.rejectionReason ?? first.paymentRejectionReason ?? "",
        sellerNames: group.map((order) => order.sellerName), orderIds: group.map((order) => String(order._id)),
        orders: group.map((order) => ({ orderId: String(order._id), stallName: order.sellerName, subtotal: order.subtotal, deliveryFee: order.deliveryFee, total: order.total, status: order.status, paymentStatus: order.paymentStatus, payoutStatus: order.payoutRequestId ? "reserved" : order.refundPayoutHold ? "on hold" : order.status === "completed" && order.paymentStatus === "paid" && Date.now() - Date.parse(order.deliveredAt ?? "") >= RETURN_REQUEST_WINDOW_MS ? "eligible" : "not eligible" })),
        events, needsRefund: group.some((order) => order.status === "cancelled" && order.paymentStatus === "paid"),
        duplicateApproved: duplicates.some((order) => !group.some((item) => item._id === order._id) && order.paymentStatus === "paid"),
      });
    }
    records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const week = new Date(now.getTime() - 7 * 86400000).toISOString();
    const month = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const summaryRows = await Promise.all((['pending', 'paid', 'rejected'] as const).map((status) => ctx.db.query("orders")
      .withIndex("by_paymentMethod_and_paymentStatus", (q) => q.eq("paymentMethod", "gcash").eq("paymentStatus", status)).take(1000)));
    const summaryGroups = new Map<string, typeof summaryRows[number]>();
    for (const order of summaryRows.flat()) {
      if (!order.paymentNote) continue;
      const group = summaryGroups.get(order.paymentNote) ?? [];
      group.push(order);
      summaryGroups.set(order.paymentNote, group);
    }
    const allGroups = [...summaryGroups.values()];
    const approved = allGroups.filter((group) => group[0].paymentStatus === "paid");
    const totals = (since: string) => approved.filter((group) => (group[0].reviewedAt ?? "") >= since).reduce((sum, group) => sum + group.reduce((total, order) => total + order.total, 0), 0);
    return {
      total: records.length,
      records: records.slice((args.page - 1) * args.pageSize, args.page * args.pageSize),
      pendingCount: allGroups.filter((group) => group[0].paymentStatus === "pending").length,
      pendingAmount: allGroups.filter((group) => group[0].paymentStatus === "pending").reduce((sum, group) => sum + group.reduce((total, order) => total + order.total, 0), 0),
      approvedToday: totals(today), approvedThisWeek: totals(week), approvedThisMonth: totals(month),
      rejectedCount: allGroups.filter((group) => group[0].paymentStatus === "rejected").length,
    };
  },
});

export const reviewGcashPayment = mutation({
  args: {
    paymentNote: v.string(),
    decision: v.union(v.literal("paid"), v.literal("rejected")),
    reason: v.optional(v.string()),
    duplicateOverrideReason: v.optional(v.string()),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdminEmail(ctx);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authorized");
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
    const normalizedReference = (pending[0].paymentReference ?? "").trim().replace(/\s+/g, " ").toUpperCase();
    const duplicates = (await ctx.db.query("orders")
      .withIndex("by_paymentStatus", (q) => q.eq("paymentStatus", "paid"))
      .take(1000)).filter((order) => order.paymentMethod === "gcash" && order.paymentReference?.trim().replace(/\s+/g, " ").toUpperCase() === normalizedReference);
    const duplicateApproved = duplicates.some((order) => !pending.some((item) => item._id === order._id) && order.paymentStatus === "paid");
    const overrideReason = args.duplicateOverrideReason?.trim();
    if (args.decision === "paid" && duplicateApproved && (!overrideReason || overrideReason.length < 5 || overrideReason.length > 500)) {
      throw new Error("This reference was approved on a different payment. Add a written override reason to continue.");
    }
    const reason = args.reason?.trim();
    if (args.decision === "rejected" && (!reason || reason.length < 5 || reason.length > 500)) {
      throw new Error("Enter a rejection reason between 5 and 500 characters.");
    }
    const now = new Date().toISOString();
    const expectedAmount = pending.reduce((sum, order) => sum + order.total, 0);
    for (const order of pending) {
      await ctx.db.patch("orders", order._id, {
        paymentStatus: args.decision,
        reviewedBy: actorEmail,
        reviewedAt: now,
        decision: args.decision === "paid" ? "approved" : "rejected",
        ...(args.decision === "rejected" ? { rejectionReason: reason } : { rejectionReason: undefined }),
        paymentEvents: [
          ...(order.paymentEvents ?? [{ type: "submitted" as const, actorId: String(order.buyerId), actorRole: "buyer" as const, referenceNumber: order.paymentReference ?? "", expectedAmount, at: order.submittedAt ?? order.paymentSubmittedAt ?? order.placedAt }]),
          { type: args.decision === "paid" ? "approved" as const : "rejected" as const, actorId: identity.subject, actorRole: "admin" as const, referenceNumber: order.paymentReference ?? "", expectedAmount, ...(reason ? { reason } : {}), at: now },
        ],
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
      await ctx.db.insert("adminAuditLog", {
        actorEmail,
        action: args.decision === "paid" ? "gcash_payment_approved" : "gcash_payment_rejected",
        orderId: order._id,
        paymentReference: normalizedReference,
        ...(args.decision === "rejected" ? { reason } : {}),
        ...(duplicateApproved && overrideReason ? { reason: overrideReason } : {}),
        createdAt: now,
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
