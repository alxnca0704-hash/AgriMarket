import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import {
  COD_REFUND_BUYER_RESPONSE_MS,
  COD_REFUND_BUYER_SHIP_MS,
  COD_REFUND_METHOD_LABEL,
  COD_REFUND_REMINDER_LEAD_MS,
  COD_REFUND_REPAYMENT_DEADLINE_MS,
  maskGcashNumber,
} from "../constants/refunds";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { createNotification } from "./notifications";
import {
  codRefundIsOverdue,
  findDuplicateRepaymentReference,
  getBuyerOwnedOrder,
  getSellerOwnedOrder,
  isActiveCodRefundStatus,
  makeRefundEvent,
  maskedNumber,
  normalizedReference,
  notifyAdmin,
  orderLabel,
  requireAdmin,
  requireIdentityUser,
  sellerReturnAddress,
  validateBuyerRefundNumber,
  validateGcashAccountName,
} from "./refundHelpers";

const waiveRefundedOrderRef = makeFunctionReference<"mutation", { orderId: Id<"orders"> }, null>(
  "commissions:waiveRefundedOrder"
);

function timeline(order: Doc<"orders">) {
  if (order.refundEvents && order.refundEvents.length > 0) return order.refundEvents;
  return order.events
    .filter((event) =>
      event.status === "refund-requested"
      || event.status === "return-approved"
      || event.status === "return-in-transit"
      || event.status === "return-received"
      || event.status === "refunded"
      || event.status === "refund-rejected"
    )
    .map((event) => ({
      type: event.status,
      label: event.label,
      actorRole: "system" as const,
      at: event.at,
    }));
}

async function codOrder(ctx: QueryCtx | MutationCtx, orderId: Id<"orders">): Promise<Doc<"orders">> {
  const order = await ctx.db.get("orders", orderId);
  if (!order || order.paymentMethod !== "cod") throw new Error("COD refund not found.");
  return order;
}

function assertStatus(order: Doc<"orders">, ...statuses: Array<Doc<"orders">["status"]>) {
  if (!statuses.includes(order.status)) {
    throw new Error(`This action is not available while the refund is ${order.status}.`);
  }
}

function buyerOrderShape(order: Doc<"orders">) {
  return {
    orderId: order._id,
    status: order.status,
    refundNumber: order.refundGcashNumber ?? "",
    refundName: order.refundGcashName ?? "",
    sellerName: order.sellerName,
    total: order.total,
    returnAddress: order.returnAddress ?? "",
    returnCarrier: order.returnCarrier ?? "",
    returnTrackingNumber: order.returnTrackingNumber ?? "",
    sellerResponseDueAt: order.refundSellerResponseDueAt ?? null,
    buyerShipDueAt: order.refundBuyerShipDueAt ?? null,
    repaymentDueAt: order.refundRepaymentDueAt ?? null,
    buyerResponseDueAt: order.refundBuyerResponseDueAt ?? null,
    repaymentReference: order.refundRepaymentReference ?? "",
    repaymentProofUrl: order.refundRepaymentProofUrl ?? "",
    repaymentSubmittedAt: order.refundRepaymentSubmittedAt ?? null,
    sellerRejectReason: order.refundSellerRejectReason ?? "",
    escalationReason: order.refundEscalationReason ?? "",
    numberIssue: order.refundNumberIssue ?? false,
    numberIssueReason: order.refundNumberIssueReason ?? "",
    buyerResponse: order.refundBuyerResponse ?? null,
    disputeCount: order.refundDisputeCount ?? 0,
    overdue: codRefundIsOverdue(order),
    closedReason: order.refundCloseReason ?? "",
    timeline: [...timeline(order)].sort((a, b) => a.at.localeCompare(b.at)),
  };
}

export const getBuyerCodRefund = query({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const order = await getBuyerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") return null;
    return buyerOrderShape(order);
  },
});

export const getSellerCodRefund = query({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const order = await getSellerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") return null;
    const stall = await ctx.db.get("stalls", order.stallId);
    return {
      orderId: order._id,
      status: order.status,
      buyerName: order.address.receiverName,
      total: order.total,
      itemsSubtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      reason: order.refundReason ?? "",
      evidenceUrls: order.refundEvidenceUrls ?? [],
      refundName: order.refundGcashName ?? "",
      maskedNumber: maskedNumber(order.refundGcashNumber),
      defaultReturnAddress: stall ? sellerReturnAddress(stall) : "",
      returnAddress: order.returnAddress ?? "",
      returnCarrier: order.returnCarrier ?? "",
      returnTrackingNumber: order.returnTrackingNumber ?? "",
      shippingDeadline: order.refundBuyerShipDueAt ?? null,
      repaymentDueAt: order.refundRepaymentDueAt ?? null,
      repaymentRemainingMs: order.refundRepaymentRemainingMs ?? null,
      sellerResponseDueAt: order.refundSellerResponseDueAt ?? null,
      numberIssue: order.refundNumberIssue ?? false,
      numberIssueReason: order.refundNumberIssueReason ?? "",
      overdue: codRefundIsOverdue(order),
      repaymentReference: order.refundRepaymentReference ?? "",
      repaymentProofUrl: order.refundRepaymentProofUrl ?? "",
      repaymentSubmittedAt: order.refundRepaymentSubmittedAt ?? null,
      repaymentRejectReason: order.refundRepaymentRejectReason ?? "",
      sellerRejectReason: order.refundSellerRejectReason ?? "",
      buyerResponse: order.refundBuyerResponse ?? null,
      buyerConfirmedAt: order.refundBuyerConfirmedAt ?? null,
      disputeReason: order.refundBuyerDisputeReason ?? "",
      returnIssue: order.refundReturnIssue ?? "",
      canRevealNumber: order.status === "return-received",
      timeline: [...timeline(order)].sort((a, b) => a.at.localeCompare(b.at)),
    };
  },
});

export const revealCodRefundNumber = mutation({
  args: { orderId: v.id("orders") },
  returns: v.string(),
  async handler(ctx, args) {
    const order = await getSellerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") throw new Error("COD refund not found.");
    if (order.status !== "return-received") {
      throw new Error("The full refund number is only available during the repayment step.");
    }
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent("number-revealed", "Seller revealed the buyer's refund number.", "seller", now),
      ],
      updatedAt: now,
    });
    return order.refundGcashNumber ?? "";
  },
});

export const approveCodReturn = mutation({
  args: { orderId: v.id("orders"), returnAddress: v.optional(v.string()) },
  returns: v.null(),
  async handler(ctx, args) {
    const order = await getSellerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") throw new Error("COD refund not found.");
    assertStatus(order, "refund-requested");
    const stall = await ctx.db.get("stalls", order.stallId);
    const returnAddress = args.returnAddress?.trim() || (stall ? sellerReturnAddress(stall) : "");
    if (returnAddress.length < 10) throw new Error("Enter the return address for the buyer.");
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "return-approved",
      returnAddress,
      returnApprovedAt: now,
      refundSellerApprovedAt: now,
      refundSellerResponseDueAt: undefined,
      refundBuyerShipDueAt: Date.now() + COD_REFUND_BUYER_SHIP_MS,
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent("seller-approved", "Seller approved the return and provided the return address.", "seller", now),
      ],
      events: [...order.events, { status: "return-approved", label: "Seller approved the return", at: now }],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "return_approved",
      title: "Seller approved your return",
      body: `Ship the items back for order ${orderLabel(order._id)} within 3 days. Return address: ${returnAddress}`,
    });
    return null;
  },
});

export const rejectCodReturn = mutation({
  args: { orderId: v.id("orders"), reason: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const order = await getSellerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") throw new Error("COD refund not found.");
    assertStatus(order, "refund-requested");
    const reason = args.reason.trim();
    if (reason.length < 10 || reason.length > 500) throw new Error("Enter a rejection reason between 10 and 500 characters.");
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "seller-rejected",
      refundSellerResponseDueAt: undefined,
      refundSellerRejectedAt: now,
      refundSellerRejectReason: reason,
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent("seller-rejected", "Seller rejected the return request.", "seller", now, reason),
      ],
      events: [...order.events, { status: "seller-rejected", label: "Seller rejected the return request", at: now }],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "refund_rejected",
      title: "Seller rejected your return",
      body: `The seller rejected your return for order ${orderLabel(order._id)}: "${reason}". You may escalate this once to the admin.`,
    });
    return null;
  },
});

export const escalateCodRefund = mutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  async handler(ctx, args) {
    const order = await getBuyerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") throw new Error("COD refund not found.");
    assertStatus(order, "seller-rejected");
    if (order.refundBuyerEscalatedAt) throw new Error("This rejection has already been escalated.");
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "escalated",
      refundEscalatedAt: now,
      refundBuyerEscalatedAt: now,
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent("buyer-escalated", "Buyer escalated the seller's rejection to the admin.", "buyer", now),
      ],
      events: [...order.events, { status: "escalated", label: "Return request escalated to admin", at: now }],
      updatedAt: now,
    });
    await notifyAdmin(
      ctx,
      "cod_refund_escalated",
      "COD refund escalated",
      `Buyer escalated the seller rejection for order ${orderLabel(order._id)}. Review the request.`,
      order._id
    );
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "cod_refund_escalated",
      title: "Refund escalation",
      body: `The buyer escalated the return for order ${orderLabel(order._id)} to the admin.`,
    });
    return null;
  },
});

export const reportCodReturnIssue = mutation({
  args: { orderId: v.id("orders"), reason: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const order = await getSellerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") throw new Error("COD refund not found.");
    assertStatus(order, "return-in-transit", "return-received");
    const reason = args.reason.trim();
    if (reason.length < 10 || reason.length > 500) throw new Error("Describe the issue between 10 and 500 characters.");
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "escalated",
      refundEscalatedAt: now,
      refundReturnIssue: reason,
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent("return-issue", "Seller reported a problem with the returned goods.", "seller", now, reason),
      ],
      events: [...order.events, { status: "escalated", label: "Return problem reported to admin", at: now }],
      updatedAt: now,
    });
    await notifyAdmin(
      ctx,
      "cod_refund_return_issue",
      "Returned goods problem",
      `Seller reported an issue for order ${orderLabel(order._id)}: "${reason}". Buyer tracking: ${order.returnCarrier ?? "unknown"} ${order.returnTrackingNumber ?? ""}.`,
      order._id
    );
    return null;
  },
});

export const submitCodRepayment = mutation({
  args: {
    orderId: v.id("orders"),
    reference: v.string(),
    proofUrl: v.string(),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const order = await getSellerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") throw new Error("COD refund not found.");
    assertStatus(order, "return-received", "buyer-disputed");
    const reference = normalizedReference(args.reference);
    if (reference.length < 4 || reference.length > 80) throw new Error("Enter a valid GCash reference number.");
    if (!args.proofUrl.startsWith("https://res.cloudinary.com/")) {
      throw new Error("Upload a screenshot of the refund transfer before submitting.");
    }
    const duplicate = await findDuplicateRepaymentReference(ctx, reference, order._id);
    if (duplicate) throw new Error("This GCash reference number was already used for another refund.");
    const now = new Date().toISOString();
    const buyerResponseDueAt = Date.now() + COD_REFUND_BUYER_RESPONSE_MS;
    await ctx.db.patch("orders", order._id, {
      status: "repayment-submitted",
      refundRepaymentReference: reference,
      refundRepaymentProofUrl: args.proofUrl,
      refundRepaymentSubmittedAt: now,
      refundRepaymentRejectedAt: undefined,
      refundRepaymentRejectReason: undefined,
      refundBuyerResponseDueAt: buyerResponseDueAt,
      refundNumberIssue: false,
      refundNumberIssueReason: undefined,
      refundBuyerDidNotRespond: false,
      refundBuyerResponse: undefined,
      refundOverdue: false,
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent("repayment-submitted", "Seller submitted the refund reference and proof.", "seller", now),
      ],
      events: [...order.events, { status: "repayment-submitted", label: "Seller says the refund was sent", at: now }],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "cod_refund_sent",
      title: "The seller says they sent your refund",
      body: `The seller submitted a refund reference for order ${orderLabel(order._id)}. Confirm whether you received the refund within 3 days.`,
    });
    await notifyAdmin(
      ctx,
      "cod_refund_repayment_submitted",
      "COD refund submitted",
      `Seller submitted refund proof for order ${orderLabel(order._id)}. Review and record it after buyer confirmation.`,
      order._id
    );
    return null;
  },
});

export const reportCodNumberIssue = mutation({
  args: { orderId: v.id("orders"), reason: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const order = await getSellerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") throw new Error("COD refund not found.");
    assertStatus(order, "return-received");
    const reason = args.reason.trim();
    if (reason.length < 5 || reason.length > 500) throw new Error("Describe the number problem between 5 and 500 characters.");
    const now = Date.now();
    const remaining = order.refundRepaymentDueAt !== undefined
      ? Math.max(0, order.refundRepaymentDueAt - now)
      : order.refundRepaymentRemainingMs ?? COD_REFUND_REPAYMENT_DEADLINE_MS;
    const at = new Date(now).toISOString();
    await ctx.db.patch("orders", order._id, {
      refundNumberIssue: true,
      refundNumberIssueReason: reason,
      refundNumberIssueReportedAt: at,
      refundRepaymentRemainingMs: remaining,
      refundRepaymentDueAt: undefined,
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent("number-issue", "Seller reported that the refund number did not work.", "seller", at, reason),
      ],
      updatedAt: at,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "cod_refund_number_issue",
      title: "Seller could not send the refund",
      body: `The seller reported a problem with your refund number for order ${orderLabel(order._id)}: "${reason}". Check the number and update it.`,
    });
    await notifyAdmin(
      ctx,
      "cod_refund_number_issue",
      "Refund number did not work",
      `Seller reported a refund number problem for order ${orderLabel(order._id)}. The repayment deadline is paused.`,
      order._id
    );
    return null;
  },
});

export const updateCodRefundNumber = mutation({
  args: { orderId: v.id("orders"), number: v.string(), name: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const order = await getBuyerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") throw new Error("COD refund not found.");
    const sellerHasItems = order.status === "return-received"
      || order.status === "repayment-submitted"
      || order.status === "buyer-confirmed"
      || order.status === "buyer-disputed"
      || order.status === "refunded";
    if (sellerHasItems && !order.refundNumberIssue) {
      throw new Error("The refund number can no longer be changed.");
    }
    const number = validateBuyerRefundNumber(args.number);
    const name = validateGcashAccountName(args.name);
    const now = Date.now();
    const at = new Date(now).toISOString();
    const oldMasked = maskGcashNumber(order.refundGcashNumber);
    const newMasked = maskGcashNumber(number);
    const resume = order.refundNumberIssue === true;
    const remaining = order.refundRepaymentRemainingMs ?? COD_REFUND_REPAYMENT_DEADLINE_MS;
    await ctx.db.patch("orders", order._id, {
      refundGcashNumber: number,
      refundGcashName: name,
      refundNumberIssue: false,
      refundNumberIssueReason: undefined,
      refundNumberIssueReportedAt: undefined,
      ...(resume ? {
        refundRepaymentDueAt: now + remaining,
        refundRepaymentRemainingMs: undefined,
      } : {}),
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent(
          "number-updated",
          `Buyer updated the refund GCash number from ${oldMasked || "not set"} to ${newMasked}.`,
          "buyer",
          at
        ),
      ],
      updatedAt: at,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "cod_refund_number_updated",
      title: "Buyer updated the refund number",
      body: `The buyer updated the GCash number for order ${orderLabel(order._id)}. You may send the refund now.`,
    });
    await notifyAdmin(
      ctx,
      "cod_refund_number_updated",
      "Refund number updated",
      `Buyer updated the refund number for order ${orderLabel(order._id)}.`,
      order._id
    );
    return null;
  },
});

export const confirmCodRefundReceived = mutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  async handler(ctx, args) {
    const order = await getBuyerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") throw new Error("COD refund not found.");
    assertStatus(order, "repayment-submitted");
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "buyer-confirmed",
      refundBuyerConfirmedAt: now,
      refundBuyerResponse: "received",
      refundBuyerResponseAt: now,
      refundBuyerResponseDueAt: undefined,
      refundBuyerDidNotRespond: false,
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent("buyer-confirmed", "Buyer confirmed receiving the refund.", "buyer", now),
      ],
      events: [...order.events, { status: "buyer-confirmed", label: "Buyer confirmed the refund was received", at: now }],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "cod_refund_buyer_confirmed",
      title: "Buyer confirmed the refund",
      body: `The buyer confirmed receiving your refund for order ${orderLabel(order._id)}. The admin will record it.`,
    });
    await notifyAdmin(
      ctx,
      "cod_refund_buyer_confirmed",
      "Buyer confirmed refund",
      `Buyer confirmed the refund for order ${orderLabel(order._id)}. It can now be recorded.`,
      order._id
    );
    return null;
  },
});

export const disputeCodRefund = mutation({
  args: { orderId: v.id("orders"), reason: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const order = await getBuyerOwnedOrder(ctx, args.orderId);
    if (order.paymentMethod !== "cod") throw new Error("COD refund not found.");
    assertStatus(order, "repayment-submitted", "buyer-disputed");
    const reason = args.reason.trim();
    if (reason.length < 5 || reason.length > 500) throw new Error("Explain what happened between 5 and 500 characters.");
    const now = new Date().toISOString();
    const disputeCount = (order.refundDisputeCount ?? 0) + 1;
    await ctx.db.patch("orders", order._id, {
      status: "buyer-disputed",
      refundBuyerDisputedAt: now,
      refundBuyerDisputeReason: reason,
      refundBuyerResponse: "not-received",
      refundBuyerResponseAt: now,
      refundBuyerResponseDueAt: undefined,
      refundDisputeCount: disputeCount,
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent("buyer-disputed", "Buyer says the refund was not received.", "buyer", now, reason),
      ],
      events: [...order.events, { status: "buyer-disputed", label: "Buyer disputed the refund", at: now }],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "cod_refund_disputed",
      title: "Buyer did not receive the refund",
      body: `The buyer disputed your refund for order ${orderLabel(order._id)}: "${reason}". Submit a corrected reference and proof.`,
    });
    await notifyAdmin(
      ctx,
      "cod_refund_disputed",
      disputeCount >= 2 ? "Second refund dispute needs a decision" : "Buyer disputed COD refund",
      `Buyer disputed the refund for order ${orderLabel(order._id)}: "${reason}". Dispute count: ${disputeCount}.`,
      order._id
    );
    return null;
  },
});

export const adminDecideCodEscalation = mutation({
  args: {
    orderId: v.id("orders"),
    decision: v.union(v.literal("approve"), v.literal("uphold")),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdmin(ctx);
    const order = await codOrder(ctx, args.orderId);
    assertStatus(order, "escalated");
    const reason = args.reason?.trim() ?? "";
    if (args.decision === "uphold" && (reason.length < 5 || reason.length > 500)) {
      throw new Error("Enter a written decision reason between 5 and 500 characters.");
    }
    const stall = await ctx.db.get("stalls", order.stallId);
    const returnAddress = order.returnAddress || (stall ? sellerReturnAddress(stall) : "");
    const now = new Date().toISOString();
    if (args.decision === "approve") {
      await ctx.db.patch("orders", order._id, {
        status: "return-approved",
        returnAddress,
        returnApprovedAt: now,
        refundSellerApprovedAt: now,
        refundEscalationDecision: "approved",
        refundEscalationReason: reason || undefined,
        refundBuyerShipDueAt: Date.now() + COD_REFUND_BUYER_SHIP_MS,
        refundReturnIssue: undefined,
        refundEvents: [
          ...(order.refundEvents ?? []),
          makeRefundEvent("admin-approved-return", "Admin approved the return; the seller must repay after receiving the goods.", "admin", now, reason || undefined),
        ],
        events: [...order.events, { status: "return-approved", label: "Admin approved the return", at: now }],
        updatedAt: now,
      });
      await createNotification(ctx, {
        userId: order.buyerId,
        role: "buyer",
        orderId: order._id,
        type: "cod_refund_escalation_approved",
        title: "Admin approved your return",
        body: `Ship the items back for order ${orderLabel(order._id)} within 3 days. Return address: ${returnAddress}`,
      });
      await createNotification(ctx, {
        userId: order.sellerId,
        role: "seller",
        orderId: order._id,
        type: "cod_refund_escalation_approved",
        title: "Admin approved the return",
        body: `Admin approved the return for order ${orderLabel(order._id)}. You must repay the buyer after confirming the goods arrive.`,
      });
    } else {
      await ctx.db.patch("orders", order._id, {
        status: order.returnFromStatus ?? "delivered",
        refundEscalationDecision: "upheld",
        refundEscalationReason: reason,
        refundClosedAt: now,
        refundCloseReason: reason,
        refundRejectReason: reason,
        refundRejectedAt: now,
        refundPayoutHold: false,
        refundReturnIssue: undefined,
        refundEvents: [
          ...(order.refundEvents ?? []),
          makeRefundEvent("admin-upheld-rejection", "Admin upheld the seller's rejection and closed the request.", "admin", now, reason),
        ],
        events: [...order.events, { status: "refund-rejected", label: "Admin upheld the seller rejection", at: now }],
        updatedAt: now,
      });
      await createNotification(ctx, {
        userId: order.buyerId,
        role: "buyer",
        orderId: order._id,
        type: "refund_rejected",
        title: "Return request closed",
        body: `Admin upheld the seller's rejection for order ${orderLabel(order._id)}: "${reason}".`,
      });
    }
    await ctx.db.insert("adminAuditLog", {
      actorEmail,
      action: args.decision === "approve" ? "cod_refund_escalation_approved" : "cod_refund_escalation_upheld",
      orderId: order._id,
      reason: reason || undefined,
      createdAt: now,
    });
    return null;
  },
});

export const adminRejectCodRepayment = mutation({
  args: { orderId: v.id("orders"), reason: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdmin(ctx);
    const order = await codOrder(ctx, args.orderId);
    assertStatus(order, "repayment-submitted", "buyer-disputed");
    const reason = args.reason.trim();
    if (reason.length < 5 || reason.length > 500) throw new Error("Enter a rejection reason between 5 and 500 characters.");
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "return-received",
      refundRepaymentRejectedAt: now,
      refundRepaymentRejectReason: reason,
      refundBuyerResponseDueAt: undefined,
      refundBuyerResponse: undefined,
      refundBuyerDidNotRespond: false,
      refundRepaymentDueAt: Date.now() + COD_REFUND_REPAYMENT_DEADLINE_MS,
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent("repayment-rejected", "Admin rejected the refund submission; seller may resubmit.", "admin", now, reason),
      ],
      events: [...order.events, { status: "return-received", label: "Admin rejected the refund submission", at: now }],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "cod_refund_repayment_rejected",
      title: "Refund submission rejected",
      body: `Your refund submission for order ${orderLabel(order._id)} was rejected: "${reason}". Submit a corrected reference and proof.`,
    });
    await ctx.db.insert("adminAuditLog", {
      actorEmail,
      action: "cod_refund_repayment_rejected",
      orderId: order._id,
      refundReference: order.refundRepaymentReference,
      reason,
      createdAt: now,
    });
    return null;
  },
});

export const adminResolveCodDispute = mutation({
  args: {
    orderId: v.id("orders"),
    decision: v.union(v.literal("seller-owes"), v.literal("close-seller")),
    reason: v.string(),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdmin(ctx);
    const order = await codOrder(ctx, args.orderId);
    assertStatus(order, "buyer-disputed");
    const reason = args.reason.trim();
    if (reason.length < 5 || reason.length > 500) throw new Error("Enter a decision reason between 5 and 500 characters.");
    const now = new Date().toISOString();
    if (args.decision === "seller-owes") {
      await ctx.db.patch("orders", order._id, {
        refundAdminDecisionReason: reason,
        refundEvents: [
          ...(order.refundEvents ?? []),
          makeRefundEvent("admin-seller-owes", "Admin decided the seller still owes the buyer.", "admin", now, reason),
        ],
        updatedAt: now,
      });
      await createNotification(ctx, {
        userId: order.sellerId,
        role: "seller",
        orderId: order._id,
        type: "cod_refund_admin_decision",
        title: "Admin decision: refund still owed",
        body: `For order ${orderLabel(order._id)}, the admin decided you still owe the buyer a refund: "${reason}".`,
      });
    } else {
      await ctx.db.patch("orders", order._id, {
        status: order.returnFromStatus ?? "delivered",
        refundClosedAt: now,
        refundCloseReason: reason,
        refundAdminDecisionReason: reason,
        refundRejectReason: reason,
        refundPayoutHold: false,
        refundEvents: [
          ...(order.refundEvents ?? []),
          makeRefundEvent("admin-closed-seller", "Admin closed the refund in the seller's favor.", "admin", now, reason),
        ],
        events: [...order.events, { status: "refund-rejected", label: "Admin closed the refund in the seller's favor", at: now }],
        updatedAt: now,
      });
      await createNotification(ctx, {
        userId: order.buyerId,
        role: "buyer",
        orderId: order._id,
        type: "refund_rejected",
        title: "Refund request closed",
        body: `The admin closed the refund for order ${orderLabel(order._id)} in the seller's favor: "${reason}".`,
      });
    }
    await ctx.db.insert("adminAuditLog", {
      actorEmail,
      action: "cod_refund_admin_decided",
      orderId: order._id,
      reason,
      createdAt: now,
    });
    return null;
  },
});

export const recordCodRefund = mutation({
  args: {
    orderId: v.id("orders"),
    overrideReason: v.optional(v.string()),
    duplicateOverrideReason: v.optional(v.string()),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdmin(ctx);
    const order = await codOrder(ctx, args.orderId);
    const buyerSilent = order.status === "repayment-submitted"
      && order.refundBuyerResponseDueAt !== undefined
      && Date.now() > order.refundBuyerResponseDueAt;
    if (order.status !== "buyer-confirmed" && !buyerSilent) {
      throw new Error("The buyer must confirm the refund before it can be recorded.");
    }
    const overrideReason = args.overrideReason?.trim() ?? "";
    if (buyerSilent && (overrideReason.length < 5 || overrideReason.length > 500)) {
      throw new Error("The buyer has not responded. Enter a written override reason between 5 and 500 characters.");
    }
    const reference = normalizedReference(order.refundRepaymentReference ?? "");
    if (!reference) throw new Error("The seller's refund reference is missing.");
    if (!order.refundRepaymentProofUrl) throw new Error("The seller's refund proof is missing.");
    const duplicate = await findDuplicateRepaymentReference(ctx, reference, order._id);
    const duplicateOverrideReason = args.duplicateOverrideReason?.trim() ?? "";
    if (duplicate && (duplicateOverrideReason.length < 5 || duplicateOverrideReason.length > 500)) {
      throw new Error("This reference was used on another refund. Add a written override reason to continue.");
    }
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "refunded",
      refundPayoutHold: false,
      refundConfirmedAt: now,
      refundMethod: "seller-gcash",
      refundFundedBy: "seller",
      refundAffectsPlatformGcash: false,
      refundReference: reference,
      refundAmount: order.total,
      refundRecordedBy: actorEmail,
      refundRecordedAt: now,
      refundBuyerResponseDueAt: undefined,
      refundOverdue: false,
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent(
          "refund-recorded",
          `Admin recorded the seller-paid GCash refund${buyerSilent ? ` with override: ${overrideReason}` : ""}.`,
          "admin",
          now,
          buyerSilent ? overrideReason : undefined
        ),
      ],
      events: [...order.events, { status: "refunded", label: `Refund recorded · ${COD_REFUND_METHOD_LABEL}`, at: now }],
      updatedAt: now,
    });
    await ctx.db.insert("adminAuditLog", {
      actorEmail,
      action: "cod_refund_recorded",
      orderId: order._id,
      refundReference: reference,
      refundMethod: "seller-gcash",
      refundAmount: order.total,
      ...(buyerSilent ? { reason: overrideReason } : {}),
      ...(duplicate && duplicateOverrideReason ? { reason: duplicateOverrideReason } : {}),
      createdAt: now,
    });
    await ctx.runMutation(waiveRefundedOrderRef, { orderId: order._id });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "refunded",
      title: "Refund recorded",
      body: `The seller's refund of ₱${order.total.toLocaleString("en-PH")} for order ${orderLabel(order._id)} has been recorded.`,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "refunded",
      title: "Refund recorded",
      body: `Your seller-paid refund for order ${orderLabel(order._id)} has been recorded.`,
    });
    return null;
  },
});

export const correctRefundMethod = mutation({
  args: {
    orderId: v.optional(v.id("orders")),
    orderSuffix: v.optional(v.string()),
    method: v.union(v.literal("gcash"), v.literal("cash"), v.literal("seller-gcash")),
    reason: v.string(),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdmin(ctx);
    const reason = args.reason.trim();
    if (reason.length < 10 || reason.length > 500) throw new Error("Enter a correction reason between 10 and 500 characters.");
    let order: Doc<"orders"> | null = null;
    if (args.orderId) {
      order = await ctx.db.get("orders", args.orderId);
    } else if (args.orderSuffix) {
      const suffix = args.orderSuffix.trim().toLowerCase().replace(/^#/, "");
      const matches = (await ctx.db.query("orders").take(4000)).filter((item) => String(item._id).toLowerCase().endsWith(suffix));
      if (matches.length !== 1) throw new Error("Order suffix must match exactly one order.");
      order = matches[0];
    }
    if (!order || order.status !== "refunded") throw new Error("Only a recorded refund can be corrected.");
    if (args.method === "seller-gcash" && order.paymentMethod !== "cod") {
      throw new Error("Seller's GCash can only be used for COD order refunds.");
    }
    if (order.paymentMethod === "cod" && args.method !== "seller-gcash") {
      throw new Error("COD refunds are seller-funded and must use Seller's GCash.");
    }
    const now = new Date().toISOString();
    const affectsPlatform = args.method === "gcash";
    await ctx.db.patch("orders", order._id, {
      refundMethod: args.method,
      refundFundedBy: affectsPlatform ? "admin" : "seller",
      refundAffectsPlatformGcash: affectsPlatform,
      refundEvents: [
        ...(order.refundEvents ?? []),
        makeRefundEvent(
          "method-corrected",
          `Admin corrected the refund method to ${args.method === "seller-gcash" ? COD_REFUND_METHOD_LABEL : args.method}.`,
          "admin",
          now,
          reason
        ),
      ],
      updatedAt: now,
    });
    await ctx.db.insert("adminAuditLog", {
      actorEmail,
      action: "cod_refund_method_corrected",
      orderId: order._id,
      refundReference: order.refundReference,
      refundMethod: args.method,
      reason,
      createdAt: now,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "cod_refund_method_corrected",
      title: "Refund record corrected",
      body: `The refund record for order ${orderLabel(order._id)} was corrected by the admin.`,
    });
    return null;
  },
});

const adminCodRefundShape = (order: Doc<"orders">, buyerName: string, sellerName: string) => ({
  orderId: order._id,
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentReference: order.paymentReference ?? "Not provided",
  buyerName,
  buyerMobileNumber: order.refundGcashNumber ?? "",
  sellerName,
  reason: order.refundReason ?? "No reason provided",
  evidenceUrls: order.refundEvidenceUrls ?? [],
  total: order.total,
  requestedAt: order.refundRequestedAt ?? order.updatedAt,
  returnAddress: order.returnAddress ?? "",
  returnCarrier: order.returnCarrier ?? "",
  returnTrackingNumber: order.returnTrackingNumber ?? "",
  refundGcashName: order.refundGcashName ?? "",
  refundGcashNumber: order.refundGcashNumber ?? "",
  sellerResponseDueAt: order.refundSellerResponseDueAt,
  buyerShipDueAt: order.refundBuyerShipDueAt,
  repaymentDueAt: order.refundRepaymentDueAt,
  buyerResponseDueAt: order.refundBuyerResponseDueAt,
  repaymentReference: order.refundRepaymentReference ?? "",
  repaymentProofUrl: order.refundRepaymentProofUrl ?? "",
  buyerResponse: order.refundBuyerResponse,
  overdue: codRefundIsOverdue(order),
  timeline: [...timeline(order)].sort((a, b) => a.at.localeCompare(b.at)),
});

export const listCodRefundReviews = query({
  args: {},
  async handler(ctx) {
    await requireAdmin(ctx);
    const statuses = [
      "escalated",
      "return-received",
      "repayment-submitted",
      "buyer-confirmed",
      "buyer-disputed",
    ] as const;
    const rows = await Promise.all(statuses.map((status) =>
      ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", status)).order("desc").take(300)
    ));
    const orders = rows.flat().filter((order) => order.paymentMethod === "cod" && isActiveCodRefundStatus(order.status));
    const result = await Promise.all(orders.map(async (order) => {
      const [buyer, seller] = await Promise.all([
        ctx.db.get("users", order.buyerId),
        ctx.db.get("users", order.sellerId),
      ]);
      return adminCodRefundShape(order, buyer?.fullName ?? "Buyer", seller?.fullName ?? order.sellerName);
    }));
    return result.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  },
});

export const getAdminCodRefund = query({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    await requireAdmin(ctx);
    const order = await codOrder(ctx, args.orderId);
    const [buyer, seller] = await Promise.all([
      ctx.db.get("users", order.buyerId),
      ctx.db.get("users", order.sellerId),
    ]);
    return {
      ...adminCodRefundShape(order, buyer?.fullName ?? "Buyer", seller?.fullName ?? order.sellerName),
      refundName: order.refundGcashName ?? "",
      returnIssue: order.refundReturnIssue ?? "",
      sellerRejectReason: order.refundSellerRejectReason ?? "",
      escalationReason: order.refundEscalationReason ?? "",
      disputeReason: order.refundBuyerDisputeReason ?? "",
      disputeCount: order.refundDisputeCount ?? 0,
      sellerDidNotRespond: order.refundSellerDidNotRespond ?? false,
      buyerDidNotRespond: order.refundBuyerDidNotRespond ?? false,
      closedReason: order.refundCloseReason ?? "",
      refundEvents: timeline(order),
    };
  },
});

export const getOverdueCodRefunds = query({
  args: {
    stallId: v.optional(v.id("stalls")),
  },
  async handler(ctx, args) {
    await requireAdmin(ctx);
    const rows = await Promise.all((await Promise.all([
      ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", "return-received")).take(1000),
      ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", "repayment-submitted")).take(1000),
      ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", "buyer-disputed")).take(1000),
    ])).flat().filter((order) => order.paymentMethod === "cod" && codRefundIsOverdue(order) && (!args.stallId || order.stallId === args.stallId)));
    return rows.map((order) => ({
      orderId: order._id,
      stallId: order.stallId,
      amount: order.total,
      overdueAt: order.refundOverdueAt ?? null,
    }));
  },
});

export const getSellerOverdueCodRefunds = query({
  args: {},
  async handler(ctx) {
    const user = await requireIdentityUser(ctx);
    if (user.role !== "seller") return [];
    const orders = await ctx.db.query("orders").withIndex("by_sellerId", (q) => q.eq("sellerId", user._id)).take(500);
    return orders
      .filter((order) => codRefundIsOverdue(order))
      .map((order) => ({ orderId: order._id, amount: order.total, overdueAt: order.refundOverdueAt ?? null }));
  },
});

export const processCodRefundDeadlines = internalMutation({
  args: {},
  returns: v.null(),
  async handler(ctx) {
    const now = Date.now();
    const at = new Date(now).toISOString();
    const byStatus = async (status: Doc<"orders">["status"]) =>
      ctx.db.query("orders").withIndex("by_status", (q) => q.eq("status", status)).take(500);

    for (const order of (await byStatus("refund-requested")).filter((item) => item.paymentMethod === "cod")) {
      const dueAt = order.refundSellerResponseDueAt;
      if (!dueAt) continue;
      if (now > dueAt) {
        const events = [
          ...(order.refundEvents ?? []),
          makeRefundEvent("seller-did-not-respond", "Seller did not respond in time; request escalated to admin.", "system", at),
        ];
        await ctx.db.patch("orders", order._id, {
          status: "escalated",
          refundSellerDidNotRespond: true,
          refundEscalatedAt: at,
          refundSellerResponseDueAt: undefined,
          refundEvents: events,
          events: [...order.events, { status: "escalated", label: "Seller did not respond; escalated to admin", at }],
          updatedAt: at,
        });
        await notifyAdmin(ctx, "cod_refund_seller_no_response", "Seller did not respond", `Seller did not respond to the refund for order ${orderLabel(order._id)}.`, order._id);
        await createNotification(ctx, {
          userId: order.buyerId,
          role: "buyer",
          orderId: order._id,
          type: "cod_refund_escalated",
          title: "Refund escalated to admin",
          body: `The seller did not respond to your return for order ${orderLabel(order._id)}. The admin will review it.`,
        });
      } else if (dueAt - now <= COD_REFUND_REMINDER_LEAD_MS && !order.refundSellerReminderSentAt) {
        await ctx.db.patch("orders", order._id, { refundSellerReminderSentAt: at, updatedAt: at });
        await createNotification(ctx, {
          userId: order.sellerId,
          role: "seller",
          orderId: order._id,
          type: "cod_refund_response_reminder",
          title: "Refund request due tomorrow",
          body: `Respond to the return for order ${orderLabel(order._id)} within 1 day or it will be escalated to the admin.`,
        });
      }
    }

    for (const order of (await byStatus("return-approved")).filter((item) => item.paymentMethod === "cod")) {
      const dueAt = order.refundBuyerShipDueAt;
      if (!dueAt) continue;
      if (now > dueAt) {
        await ctx.db.patch("orders", order._id, {
          status: order.returnFromStatus ?? "delivered",
          refundClosedAt: at,
          refundCloseReason: "Buyer did not ship the return within 3 days.",
          refundBuyerShipDueAt: undefined,
          refundPayoutHold: false,
          refundEvents: [
            ...(order.refundEvents ?? []),
            makeRefundEvent("buyer-did-not-ship", "Buyer did not ship the return in time; request closed.", "system", at),
          ],
          events: [...order.events, { status: order.returnFromStatus ?? "delivered", label: "Return closed — buyer did not ship", at }],
          updatedAt: at,
        });
        await createNotification(ctx, {
          userId: order.buyerId,
          role: "buyer",
          orderId: order._id,
          type: "cod_refund_closed",
          title: "Return request closed",
          body: `The return for order ${orderLabel(order._id)} was closed because the items were not shipped within 3 days.`,
        });
        await notifyAdmin(ctx, "cod_refund_buyer_no_ship", "Buyer did not ship return", `Return for order ${orderLabel(order._id)} closed because the buyer did not ship in time.`, order._id);
      } else if (dueAt - now <= COD_REFUND_REMINDER_LEAD_MS && !order.refundBuyerReminderSentAt) {
        await ctx.db.patch("orders", order._id, { refundBuyerReminderSentAt: at, updatedAt: at });
        await createNotification(ctx, {
          userId: order.buyerId,
          role: "buyer",
          orderId: order._id,
          type: "cod_refund_ship_reminder",
          title: "Ship your return tomorrow",
          body: `Ship the return for order ${orderLabel(order._id)} within 1 day or the request will close.`,
        });
      }
    }

    for (const order of (await byStatus("return-received")).filter((item) => item.paymentMethod === "cod")) {
      if (order.refundNumberIssue) continue;
      const dueAt = order.refundRepaymentDueAt;
      if (!dueAt) continue;
      if (now > dueAt && !order.refundOverdue) {
        await ctx.db.patch("orders", order._id, {
          refundOverdue: true,
          refundOverdueAt: at,
          refundEvents: [
            ...(order.refundEvents ?? []),
            makeRefundEvent("repayment-overdue", "Seller did not send the refund by the deadline.", "system", at),
          ],
          updatedAt: at,
        });
        await createNotification(ctx, {
          userId: order.sellerId,
          role: "seller",
          orderId: order._id,
          type: "cod_refund_overdue",
          title: "Refund is overdue",
          body: `The refund for order ${orderLabel(order._id)} is overdue. Send it now and submit the reference and proof.`,
        });
        await notifyAdmin(ctx, "cod_refund_overdue", "COD refund overdue", `Seller refund for order ${orderLabel(order._id)} is overdue.`, order._id);
      } else if (dueAt - now <= COD_REFUND_REMINDER_LEAD_MS && dueAt > now && !order.refundRepaymentReminderSentAt) {
        await ctx.db.patch("orders", order._id, { refundRepaymentReminderSentAt: at, updatedAt: at });
        await createNotification(ctx, {
          userId: order.sellerId,
          role: "seller",
          orderId: order._id,
          type: "cod_refund_repayment_reminder",
          title: "Refund due tomorrow",
          body: `Your refund for order ${orderLabel(order._id)} is due tomorrow. Submit the reference and proof.`,
        });
      }
    }

    for (const order of (await byStatus("repayment-submitted")).filter((item) => item.paymentMethod === "cod")) {
      const dueAt = order.refundBuyerResponseDueAt;
      if (!dueAt) continue;
      if (now > dueAt && !order.refundBuyerDidNotRespond) {
        await ctx.db.patch("orders", order._id, {
          refundBuyerDidNotRespond: true,
          refundEvents: [
            ...(order.refundEvents ?? []),
            makeRefundEvent("buyer-did-not-respond", "Buyer did not confirm or dispute the refund in time.", "system", at),
          ],
          updatedAt: at,
        });
        await notifyAdmin(ctx, "cod_refund_buyer_no_response", "Buyer has not responded", `Buyer has not confirmed the refund for order ${orderLabel(order._id)}. Review whether to record with an override.`, order._id);
      } else if (dueAt - now <= COD_REFUND_REMINDER_LEAD_MS && dueAt > now && !order.refundBuyerResponseReminderSentAt) {
        await ctx.db.patch("orders", order._id, { refundBuyerResponseReminderSentAt: at, updatedAt: at });
        await createNotification(ctx, {
          userId: order.buyerId,
          role: "buyer",
          orderId: order._id,
          type: "cod_refund_response_reminder",
          title: "Confirm your refund tomorrow",
          body: `Confirm whether you received the refund for order ${orderLabel(order._id)} within 1 day.`,
        });
      }
    }
    return null;
  },
});
