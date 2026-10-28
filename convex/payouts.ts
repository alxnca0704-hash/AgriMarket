import { v } from "convex/values";
import { ADMIN_EMAIL } from "../constants/roles";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { orderStatusValidator } from "./shared";
import { BLOCK_PAYOUT_WHEN_OVERDUE } from "../constants/commissions";
import { COMMISSION_RATE } from "../constants/commissions";
import { isCodRefundOverdue } from "./orderMoney";

const payoutValidator = v.object({
  _id: v.id("payoutRequests"),
  amount: v.number(),
  gcashName: v.string(),
  gcashNumber: v.string(),
  orderCount: v.number(),
  status: v.union(v.literal("pending"), v.literal("paid"), v.literal("rejected")),
  requestedAt: v.string(),
  reviewedAt: v.union(v.string(), v.null()),
  transferReference: v.union(v.string(), v.null()),
  rejectionReason: v.union(v.string(), v.null()),
  itemsSubtotal: v.number(),
  deliveryFee: v.number(),
  commissionAmount: v.number(),
  netPayoutAmount: v.number(),
});

const sellerOrderValidator = v.object({
  orderId: v.id("orders"),
  amount: v.number(),
  placedAt: v.string(),
  deliveredAt: v.union(v.string(), v.null()),
  paymentMethod: v.union(v.literal("cod"), v.literal("gcash")),
  orderStatus: orderStatusValidator,
  payoutStatus: v.union(v.literal("ready"), v.literal("held"), v.literal("return-window"), v.literal("awaiting-completion"), v.literal("requested"), v.literal("paid-out")),
  itemsSubtotal: v.number(),
  deliveryFee: v.number(),
  commissionAmount: v.number(),
  netPayoutAmount: v.number(),
  completedAt: v.union(v.string(), v.null()),
});

const payoutOrderSnapshotValidator = v.object({
  orderId: v.id("orders"),
  amount: v.number(),
  placedAt: v.string(),
  deliveredAt: v.string(),
  paymentMethod: v.union(v.literal("cod"), v.literal("gcash")),
  itemsSubtotal: v.optional(v.number()),
  deliveryFee: v.optional(v.number()),
  commissionAmount: v.optional(v.number()),
  netPayoutAmount: v.optional(v.number()),
  completedAt: v.optional(v.string()),
});

function commissionValues(order: { subtotal: number; deliveryFee: number; commissionRate?: number; commissionAmount?: number; netPayoutAmount?: number }) {
  const commissionAmount = order.commissionAmount ?? Math.round(order.subtotal * COMMISSION_RATE * 100) / 100;
  return { itemsSubtotal: order.subtotal, deliveryFee: order.deliveryFee, commissionAmount, netPayoutAmount: order.netPayoutAmount ?? Math.round((order.subtotal + order.deliveryFee - commissionAmount) * 100) / 100, rate: order.commissionRate ?? COMMISSION_RATE };
}

async function currentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db.query("users")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .first();
}

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || identity.email?.toLowerCase() !== ADMIN_EMAIL || identity.emailVerified !== true) {
    throw new Error("Not authorized");
  }
  return identity.email.toLowerCase();
}

function isPayoutEligible(order: {
  status: string;
  paymentStatus: string;
  paymentMethod: "cod" | "gcash";
  deliveredAt?: string;
  refundPayoutHold?: boolean;
  payoutRequestId?: Id<"payoutRequests">;
}, now: number) {
  return order.status === "completed"
    && order.paymentStatus === "paid"
    && order.paymentMethod === "gcash"
    && order.refundPayoutHold !== true
    && order.payoutRequestId === undefined
    && order.deliveredAt !== undefined
    && now - Date.parse(order.deliveredAt) >= 24 * 60 * 60 * 1000;
}

export const getSellerPayouts = query({
  args: {},
  returns: v.union(v.null(), v.object({
    eligibleAmount: v.number(),
    eligibleOrderCount: v.number(),
    codRefundBlocked: v.boolean(),
    codRefundOverdueAmount: v.number(),
    orders: v.array(sellerOrderValidator),
    requests: v.array(payoutValidator),
  })),
  async handler(ctx) {
    const user = await currentUser(ctx);
    if (!user || user.role !== "seller") return null;
    const orders = await ctx.db.query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .take(500);
    const now = Date.now();
    const requests = await ctx.db.query("payoutRequests")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .take(100);
    const payoutStatuses = new Map(requests.map((request) => [request._id, request.status]));
    const earningsOrders = orders.filter((order) => order.paymentMethod === "gcash" && order.paymentStatus === "paid" && order.status !== "cancelled" && order.status !== "refunded");
    const sellerOrders = earningsOrders.map((order) => {
      let payoutStatus: "ready" | "held" | "return-window" | "awaiting-completion" | "requested" | "paid-out";
      if (order.refundPayoutHold === true) {
        payoutStatus = "held";
      } else if (order.payoutRequestId) {
        payoutStatus = payoutStatuses.get(order.payoutRequestId) === "paid" ? "paid-out" : "requested";
      } else if (isPayoutEligible(order, now)) {
        payoutStatus = "ready";
      } else if (order.status === "completed" && order.deliveredAt) {
        payoutStatus = "return-window";
      } else {
        payoutStatus = "awaiting-completion";
      }
      return {
        orderId: order._id,
        amount: order.netPayoutAmount ?? commissionValues(order).netPayoutAmount,
        itemsSubtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        commissionAmount: order.commissionAmount ?? commissionValues(order).commissionAmount,
        netPayoutAmount: order.netPayoutAmount ?? commissionValues(order).netPayoutAmount,
        completedAt: order.completedAt ?? null,
        placedAt: order.placedAt,
        deliveredAt: order.deliveredAt ?? null,
        paymentMethod: order.paymentMethod,
        orderStatus: order.status,
        payoutStatus,
      };
    });
    const eligible = sellerOrders.filter((order) => order.payoutStatus === "ready");
    const overdueCodRefunds = orders.filter((order) => isCodRefundOverdue(order));
    return {
      eligibleAmount: eligible.reduce((total, order) => total + order.amount, 0),
      eligibleOrderCount: eligible.length,
      codRefundBlocked: overdueCodRefunds.length > 0,
      codRefundOverdueAmount: overdueCodRefunds.reduce((total, order) => total + (order.refundAmount ?? order.total), 0),
      orders: sellerOrders,
      requests: requests.map((request) => ({
        _id: request._id,
        amount: request.amount,
        gcashName: request.gcashName,
        gcashNumber: request.gcashNumber,
        orderCount: request.orderIds.length,
        status: request.status,
        requestedAt: request.requestedAt,
        reviewedAt: request.reviewedAt ?? null,
        transferReference: request.transferReference ?? null,
        rejectionReason: request.rejectionReason ?? null,
        itemsSubtotal: (request.orderSnapshots ?? []).reduce((sum, item) => sum + (item.itemsSubtotal ?? item.amount), 0),
        deliveryFee: (request.orderSnapshots ?? []).reduce((sum, item) => sum + (item.deliveryFee ?? 0), 0),
        commissionAmount: (request.orderSnapshots ?? []).reduce((sum, item) => sum + (item.commissionAmount ?? 0), 0),
        netPayoutAmount: request.amount,
      })),
    };
  },
});

export const backfillSellerGcashCommissions = mutation({
  args: {},
  returns: v.null(),
  async handler(ctx) {
    const user = await currentUser(ctx);
    if (!user || user.role !== "seller") throw new Error("Seller account required.");
    const orders = await ctx.db.query("orders").withIndex("by_sellerId", q => q.eq("sellerId", user._id)).take(500);
    for (const order of orders) {
      if (order.paymentMethod !== "gcash" || order.status !== "completed") continue;
      const values = commissionValues(order);
      if (order.commissionRate === undefined || order.commissionAmount === undefined || order.netPayoutAmount === undefined) {
        await ctx.db.patch("orders", order._id, { commissionRate: values.rate, commissionAmount: values.commissionAmount, netPayoutAmount: values.netPayoutAmount });
      }
      const existing = await ctx.db.query("platformCommissions").withIndex("by_orderId", q => q.eq("orderId", order._id)).unique();
      if (!existing) {
        const at = order.completedAt ?? order.deliveredAt ?? order.placedAt;
        await ctx.db.insert("platformCommissions", { orderId: order._id, stallId: order.stallId, sellerId: order.sellerId, itemsSubtotal: order.subtotal, rate: values.rate, amount: values.commissionAmount, status: "pending", createdAt: at, events: [{ type: "accrued", label: "Legacy GCash commission backfilled", at }] });
      }
    }
    return null;
  },
});

export const requestPayout = mutation({
  args: { gcashName: v.string(), gcashNumber: v.string(), orderIds: v.array(v.id("orders")) },
  returns: v.id("payoutRequests"),
  async handler(ctx, args) {
    const user = await currentUser(ctx);
    if (!user || user.role !== "seller") throw new Error("Seller account required.");
    const stall = await ctx.db.query("stalls")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (!stall) throw new Error("Create a stall before requesting a payout.");
    if (BLOCK_PAYOUT_WHEN_OVERDUE) {
      const invoices = await ctx.db.query("commissionInvoices").withIndex("by_stallId", q => q.eq("stallId", stall._id)).take(200);
      if (invoices.some(invoice => invoice.amount > invoice.paidAmount && invoice.dueAt <= Date.now())) throw new Error("Payout requests are unavailable while a commission invoice is overdue.");
    }
    const sellerOrders = await ctx.db.query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .take(500);
    if (sellerOrders.some((order) => isCodRefundOverdue(order))) {
      throw new Error("Payout requests are unavailable while you have an overdue COD refund. Send the refund and submit proof first.");
    }
    const gcashName = args.gcashName.trim();
    const gcashNumber = args.gcashNumber.trim();
    const normalizedNumber = gcashNumber.replace(/[\s-]/g, "");
    if (gcashName.length < 2 || gcashName.length > 100) throw new Error("Enter a GCash account name between 2 and 100 characters.");
    if (!/^(\+?63|0)?9\d{9}$/.test(normalizedNumber)) throw new Error("Enter a valid Philippine GCash mobile number.");
    if (args.orderIds.length < 1 || args.orderIds.length > 100) throw new Error("Select between 1 and 100 orders for this payout request.");
    if (new Set(args.orderIds).size !== args.orderIds.length) throw new Error("An order can only appear once in a payout request.");
    const selected = args.orderIds.map((orderId) => sellerOrders.find((order) => order._id === orderId));
    if (selected.some((order) => !order || !isPayoutEligible(order, Date.now()))) {
      throw new Error("One or more selected orders are no longer eligible for payout.");
    }
    const selectedOrders = selected.filter((order) => order !== undefined);
    const now = new Date().toISOString();
    const snapshots = selectedOrders.map((order) => {
      const values = commissionValues(order);
      return { orderId: order._id, amount: values.netPayoutAmount, placedAt: order.placedAt, deliveredAt: order.deliveredAt!, paymentMethod: order.paymentMethod, itemsSubtotal: values.itemsSubtotal, deliveryFee: values.deliveryFee, commissionAmount: values.commissionAmount, netPayoutAmount: values.netPayoutAmount, completedAt: order.completedAt ?? order.deliveredAt! };
    });
    const amount = snapshots.reduce((total, item) => total + item.netPayoutAmount, 0);
    for (const order of selectedOrders) {
      const values = commissionValues(order);
      await ctx.db.patch("orders", order._id, { commissionRate: values.rate, commissionAmount: values.commissionAmount, netPayoutAmount: values.netPayoutAmount });
      const existing = await ctx.db.query("platformCommissions").withIndex("by_orderId", q => q.eq("orderId", order._id)).unique();
      if (!existing) await ctx.db.insert("platformCommissions", { orderId: order._id, stallId: order.stallId, sellerId: order.sellerId, itemsSubtotal: order.subtotal, rate: values.rate, amount: values.commissionAmount, status: "pending", createdAt: order.completedAt ?? order.deliveredAt!, events: [{ type: "accrued", label: "Legacy GCash commission backfilled", at: now }] });
    }
    const requestId = await ctx.db.insert("payoutRequests", {
      sellerId: user._id,
      stallId: stall._id,
      orderIds: selectedOrders.map((order) => order._id),
      orderSnapshots: snapshots,
      amount,
      gcashName,
      gcashNumber,
      status: "pending",
      requestedAt: now,
    });
    for (const order of selectedOrders) await ctx.db.patch("orders", order._id, { payoutRequestId: requestId, updatedAt: now });
    return requestId;
  },
});

const adminPayoutValidator = v.object({
  _id: v.id("payoutRequests"),
  sellerName: v.string(),
  amount: v.number(),
  gcashName: v.string(),
  gcashNumber: v.string(),
  orderIds: v.array(v.id("orders")),
  orderSnapshots: v.array(payoutOrderSnapshotValidator),
  requestedAt: v.string(),
  stallName: v.string(),
  stallPhotoUrl: v.string(),
  farmType: v.string(),
  location: v.string(),
  verificationStatus: v.union(v.literal("unverified"), v.literal("pending"), v.literal("verified")),
  idType: v.string(),
  idNumber: v.string(),
  allOrdersGcash: v.boolean(),
  itemsSubtotal: v.number(),
  deliveryFee: v.number(),
  commissionAmount: v.number(),
  netPayoutAmount: v.number(),
  completedAt: v.string(),
  transferReference: v.union(v.string(), v.null()),
  reviewedAt: v.union(v.string(), v.null()),
});

export const listPendingPayouts = query({
  args: {},
  returns: v.array(adminPayoutValidator),
  async handler(ctx) {
    await requireAdmin(ctx);
    const requests = await ctx.db.query("payoutRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(200);
    const result = [];
    for (const request of requests) {
      const seller = await ctx.db.get("users", request.sellerId);
      const stall = await ctx.db.get("stalls", request.stallId);
      if (!seller || !stall) continue;
      let allOrdersGcash = request.orderIds.length > 0;
      for (const orderId of request.orderIds) {
        const order = await ctx.db.get("orders", orderId);
        if (!order || order.paymentMethod !== "gcash") allOrdersGcash = false;
      }
      result.push({
        _id: request._id,
        sellerName: seller.fullName,
        amount: request.amount,
        gcashName: request.gcashName,
        gcashNumber: request.gcashNumber,
        orderIds: request.orderIds,
        orderSnapshots: (request.orderSnapshots ?? []).map(snapshot => ({ ...snapshot, itemsSubtotal: snapshot.itemsSubtotal ?? snapshot.amount, deliveryFee: snapshot.deliveryFee ?? 0, commissionAmount: snapshot.commissionAmount ?? 0, netPayoutAmount: snapshot.netPayoutAmount ?? snapshot.amount, completedAt: snapshot.completedAt ?? snapshot.deliveredAt })),
        itemsSubtotal: (request.orderSnapshots ?? []).reduce((sum, item) => sum + (item.itemsSubtotal ?? item.amount), 0),
        deliveryFee: (request.orderSnapshots ?? []).reduce((sum, item) => sum + (item.deliveryFee ?? 0), 0),
        commissionAmount: (request.orderSnapshots ?? []).reduce((sum, item) => sum + (item.commissionAmount ?? 0), 0),
        netPayoutAmount: request.amount,
        completedAt: request.requestedAt,
        transferReference: request.transferReference ?? null,
        reviewedAt: request.reviewedAt ?? null,
        requestedAt: request.requestedAt,
        stallName: stall.stallName,
        stallPhotoUrl: stall.photoUrl,
        farmType: stall.farmType,
        location: [stall.location.streetBuilding, stall.location.barangay, stall.location.cityMunicipality, stall.location.province, stall.location.region, stall.location.postalCode].filter(Boolean).join(", "),
        verificationStatus: stall.verification.status,
        idType: stall.verification.idType,
        idNumber: stall.verification.idNumber,
        allOrdersGcash,
      });
    }
    return result;
  },
});

export const recordPayoutSent = mutation({
  args: { payoutRequestId: v.id("payoutRequests"), transferReference: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdmin(ctx);
    const request = await ctx.db.get("payoutRequests", args.payoutRequestId);
    if (!request || request.status !== "pending") throw new Error("This payout request is no longer awaiting review.");
    const stall = await ctx.db.get("stalls", request.stallId);
    if (!stall) throw new Error("The seller's stall information is unavailable.");
    const sellerOrders = await ctx.db.query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", request.sellerId))
      .take(500);
    if (sellerOrders.some((order) => isCodRefundOverdue(order))) {
      throw new Error("This payout is blocked because the seller has an overdue COD refund.");
    }
    const reference = args.transferReference.trim();
    if (reference.length < 3 || reference.length > 100) throw new Error("Enter a GCash transfer reference between 3 and 100 characters.");
    let verifiedTotal = 0;
    for (const orderId of request.orderIds) {
      const order = await ctx.db.get("orders", orderId);
      if (!order || order.sellerId !== request.sellerId || order.payoutRequestId !== request._id || !isPayoutEligible({ ...order, payoutRequestId: undefined }, Date.now())) {
        throw new Error("An order in this payout is no longer eligible. Close its return request before paying out.");
      }
      verifiedTotal += order.netPayoutAmount ?? commissionValues(order).netPayoutAmount;
    }
    if (verifiedTotal !== request.amount) throw new Error("The payout amount no longer matches its selected orders. Reject and review the request again.");
    const now = new Date().toISOString();
    for (const orderId of request.orderIds) {
      const ledger = await ctx.db.query("platformCommissions").withIndex("by_orderId", q => q.eq("orderId", orderId)).unique();
      if (ledger && ledger.status === "pending") await ctx.db.patch("platformCommissions", ledger._id, { status: "collected", payoutRequestId: request._id, collectedAt: now, events: [...ledger.events, { type: "collected", label: "Commission collected with seller payout", at: now, actor: actorEmail, payoutRequestId: request._id, transferReference: reference }] });
    }
    await ctx.db.patch("payoutRequests", request._id, { status: "paid", reviewedAt: now, reviewedBy: actorEmail, transferReference: reference });
    await ctx.db.insert("adminAuditLog", { actorEmail, action: "payout_paid", payoutRequestId: request._id, payoutReference: reference, payoutAmount: request.amount, createdAt: now });
    return null;
  },
});

export const rejectPayout = mutation({
  args: { payoutRequestId: v.id("payoutRequests"), reason: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdmin(ctx);
    const request = await ctx.db.get("payoutRequests", args.payoutRequestId);
    if (!request || request.status !== "pending") throw new Error("This payout request is no longer awaiting review.");
    const reason = args.reason.trim();
    if (reason.length < 5 || reason.length > 500) throw new Error("Enter a rejection reason between 5 and 500 characters.");
    const now = new Date().toISOString();
    await ctx.db.patch("payoutRequests", request._id, { status: "rejected", reviewedAt: now, reviewedBy: actorEmail, rejectionReason: reason });
    for (const orderId of request.orderIds) {
      const order = await ctx.db.get("orders", orderId);
      if (order?.payoutRequestId === request._id) await ctx.db.patch("orders", orderId, { payoutRequestId: undefined, updatedAt: now });
    }
    await ctx.db.insert("adminAuditLog", { actorEmail, action: "payout_rejected", payoutRequestId: request._id, payoutAmount: request.amount, reason, createdAt: now });
    return null;
  },
});
