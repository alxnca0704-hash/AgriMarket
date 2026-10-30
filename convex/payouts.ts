import { v } from "convex/values";
import { ADMIN_EMAIL } from "../constants/roles";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { orderStatusValidator } from "./shared";
import { COMMISSION_RATE } from "../constants/commissions";
import { isCodRefundOverdue } from "./orderMoney";
import { isPayoutDay, nextPayoutDate, payoutBatchWeek, MIN_PAYOUT_AMOUNT, getNetPayoutAmount } from "../constants/payouts";
import { RETURN_REQUEST_WINDOW_MS } from "../constants/refunds";

const payoutValidator = v.object({
  _id: v.id("payoutRequests"),
  amount: v.number(),
  gcashName: v.string(),
  gcashNumber: v.string(),
  orderCount: v.number(),
  status: v.union(v.literal("pending"), v.literal("paid"), v.literal("rejected")),
  statusV2: v.union(v.literal("requested"), v.literal("on-hold"), v.literal("paid"), v.literal("cancelled"), v.literal("rejected")),
  requestedAt: v.string(),
  reviewedAt: v.union(v.string(), v.null()),
  transferReference: v.union(v.string(), v.null()),
  rejectionReason: v.union(v.string(), v.null()),
  itemsSubtotal: v.number(),
  deliveryFee: v.number(),
  commissionAmount: v.number(),
  netPayoutAmount: v.number(),
  orders: v.array(v.object({ orderId: v.id("orders"), itemsSubtotal: v.number(), deliveryFee: v.number(), commissionAmount: v.number(), netPayoutAmount: v.number(), completedAt: v.string() })),
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
  return { itemsSubtotal: order.subtotal, deliveryFee: order.deliveryFee, commissionAmount, netPayoutAmount: getNetPayoutAmount({ ...order, commissionAmount }), rate: order.commissionRate ?? COMMISSION_RATE };
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
    && now - Date.parse(order.deliveredAt) >= RETURN_REQUEST_WINDOW_MS;
}

export const cancelPayout = mutation({
  args: { payoutRequestId: v.id("payoutRequests") },
  returns: v.null(),
  async handler(ctx, args) {
    const user = await currentUser(ctx);
    const request = await ctx.db.get("payoutRequests", args.payoutRequestId);
    if (!user || user.role !== "seller" || !request || request.sellerId !== user._id) throw new Error("Payout request not found.");
    if (request.status !== "pending" || request.statusV2 === "on-hold") throw new Error("Only a requested payout can be cancelled before the transfer is recorded.");
    const now = new Date().toISOString();
    await ctx.db.patch("payoutRequests", request._id, { status: "rejected", statusV2: "cancelled", rejectionReason: "Cancelled by seller", events: [...(request.events ?? []), { type: "cancelled", actorId: String(user._id), actorRole: "seller", at: now }] });
    for (const orderId of request.orderIds) {
      const order = await ctx.db.get("orders", orderId);
      if (order?.payoutRequestId === request._id) await ctx.db.patch("orders", orderId, { payoutRequestId: undefined, updatedAt: now });
    }
    return null;
  },
});

export const saveSellerPayoutDestination = mutation({
  args: { gcashName: v.string(), gcashNumber: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const user = await currentUser(ctx);
    if (!user || user.role !== "seller") throw new Error("Seller account required.");
    const stall = await ctx.db.query("stalls").withIndex("by_ownerId", q => q.eq("ownerId", user._id)).first();
    if (!stall) throw new Error("Stall not found.");
    const name = args.gcashName.trim();
    const number = args.gcashNumber.trim().replace(/[\s-]/g, "");
    if (name.length < 2 || name.length > 100 || !/^((\+?63)|0)?9\d{9}$/.test(number)) throw new Error("Enter a valid GCash account name and Philippine mobile number.");
    await ctx.db.patch("stalls", stall._id, { payoutGcashName: name, payoutGcashNumber: number, updatedAt: new Date().toISOString() });
    return null;
  },
});

export const getSellerPayouts = query({
  args: {},
  returns: v.union(v.null(), v.object({
    eligibleAmount: v.number(),
    eligibleOrderCount: v.number(),
    isPayoutDay: v.boolean(),
    nextPayoutAt: v.string(),
    payoutGcashName: v.union(v.string(), v.null()),
    payoutGcashNumber: v.union(v.string(), v.null()),
    codRefundBlocked: v.boolean(),
    codRefundOverdueAmount: v.number(),
    orders: v.array(sellerOrderValidator),
    requests: v.array(payoutValidator),
  })),
  async handler(ctx) {
    const user = await currentUser(ctx);
    if (!user || user.role !== "seller") return null;
    const stall = await ctx.db.query("stalls").withIndex("by_ownerId", q => q.eq("ownerId", user._id)).first();
    if (!stall) return null;
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
        amount: commissionValues(order).netPayoutAmount,
        itemsSubtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        commissionAmount: order.commissionAmount ?? commissionValues(order).commissionAmount,
        netPayoutAmount: commissionValues(order).netPayoutAmount,
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
      isPayoutDay: isPayoutDay(now),
      nextPayoutAt: nextPayoutDate(now).toISOString(),
      payoutGcashName: stall?.payoutGcashName ?? null,
      payoutGcashNumber: stall?.payoutGcashNumber ?? null,
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
        statusV2: request.statusV2 ?? (request.status === "pending" ? "requested" : request.status),
        requestedAt: request.requestedAt,
        reviewedAt: request.reviewedAt ?? null,
        transferReference: request.transferReference ?? null,
        rejectionReason: request.rejectionReason ?? null,
        itemsSubtotal: (request.orderSnapshots ?? []).reduce((sum, item) => sum + (item.itemsSubtotal ?? item.amount), 0),
        deliveryFee: (request.orderSnapshots ?? []).reduce((sum, item) => sum + (item.deliveryFee ?? 0), 0),
        commissionAmount: (request.orderSnapshots ?? []).reduce((sum, item) => sum + (item.commissionAmount ?? 0), 0),
        netPayoutAmount: request.amount,
        orders: (request.orders ?? (request.orderSnapshots ?? []).map(item => ({ orderId: item.orderId, itemsSubtotal: item.itemsSubtotal ?? item.amount, deliveryFee: item.deliveryFee ?? 0, commissionAmount: item.commissionAmount ?? 0, netPayoutAmount: item.netPayoutAmount ?? item.amount, completedAt: item.completedAt ?? item.deliveredAt }))),
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
  args: {},
  returns: v.id("payoutRequests"),
  async handler(ctx) {
    const user = await currentUser(ctx);
    if (!user || user.role !== "seller") throw new Error("Seller account required.");
    const stall = await ctx.db.query("stalls")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (!stall) throw new Error("Create a stall before requesting a payout.");
    const nowMs = Date.now();
    if (!isPayoutDay(nowMs)) throw new Error("Payouts can only be requested on Sundays.");
    const batchWeek = payoutBatchWeek(nowMs);
    const existingBatch = await ctx.db.query("payoutRequests").withIndex("by_stallId_and_batchWeek", q => q.eq("stallId", stall._id).eq("batchWeek", batchWeek)).first();
    if (existingBatch && ["pending", "paid"].includes(existingBatch.status) && existingBatch.statusV2 !== "cancelled" && existingBatch.statusV2 !== "rejected") throw new Error("Already requested for this Sunday.");
    const sellerOrders = await ctx.db.query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .take(500);
    if (sellerOrders.some((order) => isCodRefundOverdue(order))) {
      throw new Error("Payout requests are unavailable while you have an overdue COD refund. Send the refund and submit proof first.");
    }
    const gcashName = (stall.payoutGcashName ?? "").trim();
    const gcashNumber = (stall.payoutGcashNumber ?? "").trim();
    const normalizedNumber = gcashNumber.replace(/[\s-]/g, "");
    if (gcashName.length < 2 || gcashName.length > 100) throw new Error("Enter a GCash account name between 2 and 100 characters.");
    if (!/^(\+?63|0)?9\d{9}$/.test(normalizedNumber)) throw new Error("Enter a valid Philippine GCash mobile number.");
    if (!gcashName || !normalizedNumber) throw new Error("Add your GCash payout number before requesting a payout.");
    const selectedOrders = sellerOrders.filter((order) => isPayoutEligible(order, nowMs));
    if (selectedOrders.length === 0) throw new Error("No available balance.");
    const now = new Date().toISOString();
    const snapshots = selectedOrders.map((order) => {
      const values = commissionValues(order);
      return { orderId: order._id, amount: getNetPayoutAmount(order), placedAt: order.placedAt, deliveredAt: order.deliveredAt!, paymentMethod: order.paymentMethod, itemsSubtotal: values.itemsSubtotal, deliveryFee: values.deliveryFee, commissionAmount: values.commissionAmount, netPayoutAmount: getNetPayoutAmount(order), completedAt: order.completedAt ?? order.deliveredAt! };
    });
    const amount = snapshots.reduce((total, item) => total + item.netPayoutAmount, 0);
    if (amount <= 0 || amount < MIN_PAYOUT_AMOUNT) throw new Error("Available payout total is below the minimum payout amount.");
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
      type: "weekly",
      batchWeek,
      requestedBy: user._id,
      statusV2: "requested",
      orders: snapshots.map(item => ({ orderId: item.orderId, itemsSubtotal: item.itemsSubtotal ?? item.amount, deliveryFee: item.deliveryFee ?? 0, commissionAmount: item.commissionAmount ?? 0, netPayoutAmount: item.netPayoutAmount ?? item.amount, completedAt: item.completedAt ?? item.deliveredAt })),
      totalNet: amount,
      events: [{ type: "requested", actorId: String(user._id), actorRole: "seller", at: now }],
    });
    for (const order of selectedOrders) await ctx.db.patch("orders", order._id, { payoutRequestId: requestId, updatedAt: now });
    const admin = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", ADMIN_EMAIL)).first();
    if (admin) await ctx.db.insert("notifications", { userId: admin._id, role: "admin", type: "payout_requested", title: "New seller payout request", body: `${stall.stallName} requested ${amount.toFixed(2)} for ${selectedOrders.length} GCash orders.`, refId: String(requestId), read: false, createdAt: now });
    await ctx.db.insert("notifications", { userId: user._id, role: "seller", type: "payout_requested", title: "Payout request received", body: `Your ${amount.toFixed(2)} payout request is waiting for the admin to send your transfer.`, refId: String(requestId), read: false, createdAt: now });
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
  args: { payoutRequestId: v.id("payoutRequests"), transferReference: v.string(), recordedAmount: v.optional(v.number()) },
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
    const normalizedReference = reference.toLowerCase().replace(/\s+/g, "");
    const priorRequests = await ctx.db.query("payoutRequests").take(2000);
    if (priorRequests.some(item => item._id !== request._id && (item.transferReference ?? "").toLowerCase().replace(/\s+/g, "") === normalizedReference)) throw new Error("This transfer reference has already been recorded.");
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
    const recordedAmount = args.recordedAmount ?? request.amount;
    if (!Number.isFinite(recordedAmount) || recordedAmount < 0) throw new Error("Enter a valid recorded transfer amount.");
    await ctx.db.patch("payoutRequests", request._id, { status: "paid", statusV2: "paid", reviewedAt: now, reviewedBy: actorEmail, recordedBy: actorEmail, paidAt: now, recordedAmount, transferReference: reference, events: [...(request.events ?? []), { type: "paid", actorId: actorEmail, actorRole: "admin", amount: recordedAmount, at: now }] });
    await ctx.db.insert("adminAuditLog", { actorEmail, action: "payout_paid", payoutRequestId: request._id, payoutReference: reference, payoutAmount: recordedAmount, createdAt: now });
    await ctx.db.insert("notifications", { userId: request.sellerId, role: "seller", type: "payout_paid", title: "Payout transfer recorded", body: `Your ${recordedAmount.toFixed(2)} transfer was recorded. Reference: ${reference}.`, refId: String(request._id), read: false, createdAt: now });
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
    await ctx.db.patch("payoutRequests", request._id, { status: "rejected", statusV2: "rejected", reviewedAt: now, reviewedBy: actorEmail, rejectionReason: reason, events: [...(request.events ?? []), { type: "rejected", actorId: actorEmail, actorRole: "admin", reason, at: now }] });
    for (const orderId of request.orderIds) {
      const order = await ctx.db.get("orders", orderId);
      if (order?.payoutRequestId === request._id) await ctx.db.patch("orders", orderId, { payoutRequestId: undefined, updatedAt: now });
    }
    await ctx.db.insert("adminAuditLog", { actorEmail, action: "payout_rejected", payoutRequestId: request._id, payoutAmount: request.amount, reason, createdAt: now });
    await ctx.db.insert("notifications", { userId: request.sellerId, role: "seller", type: "payout_rejected", title: "Payout request rejected", body: reason, refId: String(request._id), read: false, createdAt: now });
    return null;
  },
});
