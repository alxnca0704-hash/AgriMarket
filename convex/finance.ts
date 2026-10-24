import { v } from "convex/values";
import { ADMIN_EMAIL } from "../constants/roles";
import { RETURN_REQUEST_WINDOW_MS } from "../constants/refunds";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { receivablePeriodStarts, resolveReceivableLedger } from "./receivableHelpers";
import { orderStatusValidator } from "./shared";
import { STALL_DEPOSIT_AMOUNT } from "../constants/deposits";

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function inRange(date: string, from: string | null, to: string | null) {
  return (!from || date >= from) && (!to || date <= to);
}

function financeDate(order: Doc<"orders">) {
  return order.completedAt ?? order.deliveredAt ?? order.reviewedAt ?? order.submittedAt ?? order.placedAt;
}

function commissionValues(order: Doc<"orders">) {
  const amount = order.commissionAmount ?? roundMoney(order.subtotal * 0.05);
  return {
    amount,
    netPayoutAmount: order.netPayoutAmount ?? roundMoney(order.subtotal + order.deliveryFee - amount),
  };
}

function isReturnStatus(status: Doc<"orders">["status"]) {
  return status === "refund-requested" || status === "return-approved" || status === "return-in-transit" || status === "return-received";
}

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || identity.email?.toLowerCase() !== ADMIN_EMAIL || identity.emailVerified !== true) throw new Error("Not authorized");
  return identity.email.toLowerCase();
}

const financeArgsValidator = {
  from: v.union(v.string(), v.null()),
  to: v.union(v.string(), v.null()),
  now: v.number(),
};

const codStatusValidator = v.union(v.literal("accrued"), v.literal("invoiced"), v.literal("overdue"), v.literal("paid"), v.literal("waived"));
const payoutStatusValidator = v.union(v.literal("not-requested"), v.literal("requested"), v.literal("paid"), v.literal("hold"), v.literal("refunded"), v.literal("cancelled"));
const gcashCommissionStatusValidator = v.union(v.literal("pending"), v.literal("collected"), v.literal("reversed"), v.literal("none"));

const codSectionValidator = v.object({
  unbilled: v.number(), invoiced: v.number(), overdue: v.number(), collected: v.number(), waived: v.number(), totalOwed: v.number(), orderCount: v.number(),
});
const gcashSectionValidator = v.object({
  totalReceived: v.number(), inReturnWindow: v.number(), payoutReady: v.number(), payoutRequested: v.number(), paidOut: v.number(),
  onHold: v.number(), refunded: v.number(), needsRefund: v.number(), owedToSellers: v.number(), commissionKept: v.number(), expectedBalance: v.number(),
});
const commissionSectionValidator = v.object({
  gcashPending: v.number(), gcashCollected: v.number(), gcashReversed: v.number(), codCollected: v.number(),
  totalEarned: v.number(), expectedAdditional: v.number(),
  collectedToday: v.number(), collectedThisWeek: v.number(), collectedThisMonth: v.number(), collectedAllTime: v.number(),
});
const codRecordValidator = v.object({
  orderId: v.id("orders"), stallId: v.id("stalls"), stallName: v.string(), saleDate: v.string(),
  commission: v.number(), amountPaid: v.number(), amountOwed: v.number(), status: codStatusValidator,
  invoiceNumber: v.union(v.string(), v.null()), paidAt: v.union(v.string(), v.null()),
});
const gcashRecordValidator = v.object({
  orderId: v.id("orders"), stallId: v.id("stalls"), stallName: v.string(), date: v.string(),
  orderTotal: v.number(), netPayout: v.number(), commission: v.number(), status: orderStatusValidator,
  payoutStatus: payoutStatusValidator, payoutReference: v.union(v.string(), v.null()),
  refundedAmount: v.number(), commissionStatus: gcashCommissionStatusValidator,
  commissionCollectedAt: v.union(v.string(), v.null()),
});
const stallRowValidator = v.object({
  stallId: v.id("stalls"), stallName: v.string(),
  codOwed: v.number(), codOverdue: v.number(), gcashOwedToSeller: v.number(), gcashPaidOut: v.number(),
  gcashCommissionCollected: v.number(), codCommissionCollected: v.number(), totalCommission: v.number(),
});
const reconciliationValidator = v.object({
  _id: v.id("financeReconciliations"), actualBalance: v.number(), expectedBalance: v.number(), difference: v.number(),
  from: v.union(v.string(), v.null()), to: v.union(v.string(), v.null()), adminEmail: v.string(), createdAt: v.string(),
});
const sellerFinanceValidator = v.object({
  cod: codSectionValidator, gcash: gcashSectionValidator, commission: commissionSectionValidator,
});
const adminFinanceValidator = v.object({
  cod: codSectionValidator, gcash: gcashSectionValidator, commission: commissionSectionValidator,
  stalls: v.array(stallRowValidator), codRecords: v.array(codRecordValidator), gcashRecords: v.array(gcashRecordValidator),
  reconciliations: v.array(reconciliationValidator),
});
const stallFinanceValidator = v.object({
  stallId: v.id("stalls"), stallName: v.string(),
  orders: v.array(v.object({
    orderId: v.id("orders"), date: v.string(), paymentMethod: v.union(v.literal("cod"), v.literal("gcash")),
    itemsSubtotal: v.number(), deliveryFee: v.number(), commission: v.number(), status: orderStatusValidator,
    invoiceNumber: v.union(v.string(), v.null()), payoutReference: v.union(v.string(), v.null()),
  })),
});

const stallAccountRowValidator = v.object({
  stallId: v.id("stalls"), stallName: v.string(), sellerName: v.string(), verificationStatus: v.string(),
  gcashSales: v.number(), gcashOwed: v.number(), gcashPaidOut: v.number(), codSales: v.number(),
  codOwed: v.number(), codOverdue: v.number(), commissionEarned: v.number(),
  depositRequired: v.number(), depositPaid: v.number(), depositRemaining: v.number(), depositStatus: v.string(),
  refundedAmount: v.number(), refundedGcash: v.number(), refundedCod: v.number(), refundedCount: v.number(),
  inProgressAmount: v.number(), inProgressCount: v.number(), needsRefundAmount: v.number(), needsRefundCount: v.number(),
});
const stallAccountsValidator = v.object({ rows: v.array(stallAccountRowValidator), expectedGcashBalance: v.number(), reconciliations: v.array(reconciliationValidator) });

type CodRecord = {
  orderId: Id<"orders">; stallId: Id<"stalls">; stallName: string; saleDate: string;
  commission: number; amountPaid: number; amountOwed: number; status: "accrued" | "invoiced" | "overdue" | "paid" | "waived";
  invoiceNumber: string | null; paidAt: string | null;
};
type GcashRecord = {
  orderId: Id<"orders">; stallId: Id<"stalls">; stallName: string; date: string;
  orderTotal: number; netPayout: number; commission: number; status: Doc<"orders">["status"];
  payoutStatus: "not-requested" | "requested" | "paid" | "hold" | "refunded" | "cancelled";
  payoutReference: string | null; refundedAmount: number;
  commissionStatus: "pending" | "collected" | "reversed" | "none"; commissionCollectedAt: string | null;
};

async function computeCodFinance(ctx: QueryCtx, stallId: Id<"stalls"> | null, from: string | null, to: string | null, now: number) {
  const source = stallId
    ? ctx.db.query("commissionAccruals").withIndex("by_stallId_and_createdAt", q => q.eq("stallId", stallId).gte("createdAt", from ?? "").lte("createdAt", to ?? "\uffff"))
    : ctx.db.query("commissionAccruals").withIndex("by_createdAt", q => q.gte("createdAt", from ?? "").lte("createdAt", to ?? "\uffff"));
  const raw = await source.order("desc").take(2000);
  const hydrated = await Promise.all(raw.map(async accrual => {
    const order = await ctx.db.get("orders", accrual.orderId);
    return order ? { accrual, order } : null;
  }));
  const pairs = hydrated
    .filter((pair): pair is NonNullable<typeof pair> => pair !== null)
    .filter(pair => inRange(pair.order.completedAt ?? pair.accrual.createdAt, from, to));
  const accruals = pairs.map(pair => pair.accrual);
  const orderByOrderId = new Map(pairs.map(pair => [String(pair.accrual.orderId), pair.order]));
  const ledger = await resolveReceivableLedger(ctx, accruals, now);

  let unbilled = 0;
  let invoiced = 0;
  let overdue = 0;
  let collected = 0;
  let waived = 0;
  const records: CodRecord[] = [];

  for (const accrual of accruals) {
    const order = orderByOrderId.get(String(accrual.orderId));
    const allocation = ledger.allocations.get(accrual._id);
    if (!order || !allocation) continue;
    const invoice = accrual.invoiceId ? ledger.invoices.get(accrual.invoiceId) : undefined;
    if (allocation.status === "accrued") unbilled += allocation.amountOwed;
    if (allocation.status === "invoiced") invoiced += allocation.amountOwed;
    if (allocation.status === "overdue") overdue += allocation.amountOwed;
    if (allocation.status === "waived") waived += accrual.amount;
    collected += allocation.amountPaid;
    records.push({
      orderId: accrual.orderId,
      stallId: accrual.stallId,
      stallName: order.sellerName,
      saleDate: order.completedAt ?? accrual.createdAt,
      commission: accrual.amount,
      amountPaid: allocation.amountPaid,
      amountOwed: allocation.amountOwed,
      status: allocation.status,
      invoiceNumber: invoice ? String(invoice._id) : null,
      paidAt: allocation.paidAt,
    });
  }

  return {
    section: {
      unbilled: roundMoney(unbilled), invoiced: roundMoney(invoiced), overdue: roundMoney(overdue),
      collected: roundMoney(collected), waived: roundMoney(waived),
      totalOwed: roundMoney(unbilled + invoiced + overdue), orderCount: records.length,
    },
    records,
  };
}

async function computeGcashFinance(ctx: QueryCtx | MutationCtx, stallId: Id<"stalls"> | null, from: string | null, to: string | null, now: number) {
  const orderSource = stallId
    ? await ctx.db.query("orders").withIndex("by_stallId", q => q.eq("stallId", stallId)).order("desc").take(2000)
    : await ctx.db.query("orders").withIndex("by_paymentMethod_and_paymentStatus", q => q.eq("paymentMethod", "gcash").eq("paymentStatus", "paid")).order("desc").take(2000);
  const paidOrders = stallId
    ? orderSource.filter(order => order.paymentMethod === "gcash" && order.paymentStatus === "paid")
    : orderSource;
  const orders = paidOrders.filter(order => inRange(financeDate(order), from, to));
  const orderIds = new Set(orders.map(order => String(order._id)));

  const payoutGroups = await Promise.all((["pending", "paid", "rejected"] as const).map(status =>
    ctx.db.query("payoutRequests").withIndex("by_status", q => q.eq("status", status)).take(1000)
  ));
  const payoutById = new Map(payoutGroups.flat().map(request => [String(request._id), request]));

  const commissionGroups = await Promise.all((["pending", "collected", "reversed"] as const).map(status =>
    ctx.db.query("platformCommissions").withIndex("by_status_and_collectedAt", q => q.eq("status", status)).take(2000)
  ));
  const platformCommissions = commissionGroups.flat().filter(commission => orderIds.has(String(commission.orderId)));
  const commissionByOrderId = new Map(platformCommissions.map(commission => [String(commission.orderId), commission]));

  let totalReceived = 0;
  let inReturnWindow = 0;
  let payoutReady = 0;
  let payoutRequested = 0;
  let paidOut = 0;
  let onHold = 0;
  let refunded = 0;
  let needsRefund = 0;
  let owedToSellers = 0;
  const records: GcashRecord[] = [];

  for (const order of orders) {
    const request = order.payoutRequestId ? payoutById.get(String(order.payoutRequestId)) : undefined;
    const platformCommission = commissionByOrderId.get(String(order._id));
    const values = commissionValues(order);
    const commission = platformCommission?.amount ?? order.commissionAmount ?? values.amount;
    const netPayout = order.netPayoutAmount ?? values.netPayoutAmount;
    const held = order.status !== "refunded" && (order.refundPayoutHold === true || isReturnStatus(order.status));
    const requestPaid = request?.status === "paid";
    const requestPending = request?.status === "pending";
    const refundedAmount = order.status === "refunded" ? order.refundAmount ?? order.total : 0;

    totalReceived += order.total;
    refunded += refundedAmount;
    if (order.status === "cancelled") needsRefund += order.total;
    if (held) onHold += netPayout;
    if (order.status === "completed" && order.deliveredAt) {
      const elapsed = now - Date.parse(order.deliveredAt);
      if (!held && !order.payoutRequestId && elapsed >= 0 && elapsed < RETURN_REQUEST_WINDOW_MS) inReturnWindow += netPayout;
      if (!held && !order.payoutRequestId && elapsed >= RETURN_REQUEST_WINDOW_MS) payoutReady += netPayout;
    }
    if (requestPending) payoutRequested += netPayout;
    if (requestPaid) paidOut += netPayout;
    else if (order.status === "completed" && !held) owedToSellers += netPayout;

    const payoutStatus: GcashRecord["payoutStatus"] = order.status === "refunded"
      ? "refunded"
      : order.status === "cancelled"
        ? "cancelled"
        : held
          ? "hold"
          : requestPaid
            ? "paid"
            : requestPending
              ? "requested"
              : "not-requested";

    records.push({
      orderId: order._id,
      stallId: order.stallId,
      stallName: order.sellerName,
      date: financeDate(order),
      orderTotal: order.total,
      netPayout,
      commission,
      status: order.status,
      payoutStatus,
      payoutReference: request?.transferReference ?? null,
      refundedAmount,
      commissionStatus: platformCommission?.status ?? "none",
      commissionCollectedAt: platformCommission?.status === "collected" ? platformCommission.collectedAt ?? null : null,
    });
  }

  const commissionKept = sum(platformCommissions.filter(commission => commission.status === "collected").map(commission => commission.amount));

  return {
    section: {
      totalReceived: roundMoney(totalReceived), inReturnWindow: roundMoney(inReturnWindow), payoutReady: roundMoney(payoutReady),
      payoutRequested: roundMoney(payoutRequested), paidOut: roundMoney(paidOut), onHold: roundMoney(onHold),
      refunded: roundMoney(refunded), needsRefund: roundMoney(needsRefund), owedToSellers: roundMoney(owedToSellers),
      commissionKept: roundMoney(commissionKept), expectedBalance: roundMoney(totalReceived - paidOut - refunded - commissionKept),
    },
    records,
    platformCommissions,
  };
}

async function buildStallRows(ctx: QueryCtx, stallId: Id<"stalls"> | null, codRecords: CodRecord[], gcashRecords: GcashRecord[]) {
  const selectedStall = stallId ? await ctx.db.get("stalls", stallId) : null;
  const stalls = stallId ? (selectedStall ? [selectedStall] : []) : await ctx.db.query("stalls").take(500);
  const rows = new Map<string, {
    stallId: Id<"stalls">; stallName: string; codOwed: number; codOverdue: number; gcashOwedToSeller: number;
    gcashPaidOut: number; gcashCommissionCollected: number; codCommissionCollected: number; totalCommission: number;
  }>();
  const ensure = (id: Id<"stalls">, name: string) => {
    let row = rows.get(String(id));
    if (!row) {
      row = { stallId: id, stallName: name, codOwed: 0, codOverdue: 0, gcashOwedToSeller: 0, gcashPaidOut: 0, gcashCommissionCollected: 0, codCommissionCollected: 0, totalCommission: 0 };
      rows.set(String(id), row);
    }
    return row;
  };
  for (const stall of stalls) if (stall) ensure(stall._id, stall.stallName);
  for (const record of codRecords) {
    const row = ensure(record.stallId, record.stallName);
    row.codOwed += record.amountOwed;
    row.codCommissionCollected += record.amountPaid;
    if (record.status === "overdue") row.codOverdue += record.amountOwed;
  }
  for (const record of gcashRecords) {
    const row = ensure(record.stallId, record.stallName);
    if (record.payoutStatus === "paid") row.gcashPaidOut += record.netPayout;
    if (record.status === "completed" && record.payoutStatus !== "paid" && record.payoutStatus !== "hold") row.gcashOwedToSeller += record.netPayout;
    if (record.commissionStatus === "collected") row.gcashCommissionCollected += record.commission;
  }
  return [...rows.values()]
    .map(row => ({
      ...row,
      codOwed: roundMoney(row.codOwed),
      codOverdue: roundMoney(row.codOverdue),
      gcashOwedToSeller: roundMoney(row.gcashOwedToSeller),
      gcashPaidOut: roundMoney(row.gcashPaidOut),
      gcashCommissionCollected: roundMoney(row.gcashCommissionCollected),
      codCommissionCollected: roundMoney(row.codCommissionCollected),
      totalCommission: roundMoney(row.gcashCommissionCollected + row.codCommissionCollected),
    }))
    .sort((a, b) => b.totalCommission - a.totalCommission || a.stallName.localeCompare(b.stallName));
}

async function computeFinance(ctx: QueryCtx, stallId: Id<"stalls"> | null, from: string | null, to: string | null, now: number) {
  const [cod, gcash] = await Promise.all([
    computeCodFinance(ctx, stallId, from, to, now),
    computeGcashFinance(ctx, stallId, from, to, now),
  ]);
  const starts = receivablePeriodStarts(now);
  const [allCollectedCommissions, allApprovedPayments] = await Promise.all([
    stallId
      ? ctx.db.query("platformCommissions").withIndex("by_stallId_and_status", q => q.eq("stallId", stallId).eq("status", "collected")).take(2000)
      : ctx.db.query("platformCommissions").withIndex("by_status_and_collectedAt", q => q.eq("status", "collected")).take(2000),
    ctx.db.query("commissionPayments").withIndex("by_status", q => q.eq("status", "approved")).take(2000),
  ]);
  const scopedCommissions = allCollectedCommissions.filter(item => !stallId || item.stallId === stallId);
  const scopedPayments = allApprovedPayments.filter(item => !stallId || item.stallId === stallId);
  const gcashCollected = sum(gcash.platformCommissions.filter(item => item.status === "collected").map(item => item.amount));
  const gcashPending = sum(gcash.platformCommissions.filter(item => item.status === "pending").map(item => item.amount));
  const gcashReversed = sum(gcash.platformCommissions.filter(item => item.status === "reversed").map(item => item.amount));
  const paymentAmount = (payment: Doc<"commissionPayments">) => payment.approvedAmount ?? payment.amount;
  const gcashCollectedSince = (start: string) => sum(scopedCommissions
    .filter(item => (item.collectedAt ?? "") >= start)
    .map(item => item.amount));
  const codCollectedSince = (start: string) => sum(scopedPayments
    .filter(item => (item.reviewedAt ?? "") >= start)
    .map(paymentAmount));
  const allTimeGcashCollected = sum(scopedCommissions.map(item => item.amount));
  const allTimeCodCollected = sum(scopedPayments.map(paymentAmount));

  const commission = {
    gcashPending: roundMoney(gcashPending),
    gcashCollected: roundMoney(gcashCollected),
    gcashReversed: roundMoney(gcashReversed),
    codCollected: cod.section.collected,
    totalEarned: roundMoney(gcashCollected + cod.section.collected),
    expectedAdditional: roundMoney(gcashPending + cod.section.totalOwed),
    collectedToday: roundMoney(gcashCollectedSince(starts.today) + codCollectedSince(starts.today)),
    collectedThisWeek: roundMoney(gcashCollectedSince(starts.thisWeek) + codCollectedSince(starts.thisWeek)),
    collectedThisMonth: roundMoney(gcashCollectedSince(starts.thisMonth) + codCollectedSince(starts.thisMonth)),
    collectedAllTime: roundMoney(allTimeGcashCollected + allTimeCodCollected),
  };

  return {
    cod: cod.section,
    gcash: gcash.section,
    commission,
    stalls: await buildStallRows(ctx, stallId, cod.records, gcash.records),
    codRecords: cod.records,
    gcashRecords: gcash.records,
  };
}

const emptySellerFinance = () => ({
  cod: { unbilled: 0, invoiced: 0, overdue: 0, collected: 0, waived: 0, totalOwed: 0, orderCount: 0 },
  gcash: {
    totalReceived: 0, inReturnWindow: 0, payoutReady: 0, payoutRequested: 0, paidOut: 0,
    onHold: 0, refunded: 0, needsRefund: 0, owedToSellers: 0, commissionKept: 0, expectedBalance: 0,
  },
  commission: {
    gcashPending: 0, gcashCollected: 0, gcashReversed: 0, codCollected: 0, totalEarned: 0, expectedAdditional: 0,
    collectedToday: 0, collectedThisWeek: 0, collectedThisMonth: 0, collectedAllTime: 0,
  },
});

export const getAdminFinance = query({
  args: financeArgsValidator,
  returns: adminFinanceValidator,
  async handler(ctx, args) {
    await requireAdmin(ctx);
    const [finance, reconciliations] = await Promise.all([
      computeFinance(ctx, null, args.from, args.to, args.now),
      ctx.db.query("financeReconciliations").withIndex("by_createdAt").order("desc").take(50),
    ]);
    return {
      cod: finance.cod,
      gcash: finance.gcash,
      commission: finance.commission,
      stalls: finance.stalls,
      codRecords: finance.codRecords,
      gcashRecords: finance.gcashRecords,
      reconciliations: reconciliations.map(item => ({
        _id: item._id,
        actualBalance: item.actualBalance,
        expectedBalance: item.expectedBalance,
        difference: item.difference,
        from: item.from,
        to: item.to,
        adminEmail: item.adminEmail,
        createdAt: item.createdAt,
      })),
    };
  },
});

/** Aggregates existing finance ledgers for the admin stall directory. */
export const getAdminStallAccounts = query({
  args: financeArgsValidator,
  returns: stallAccountsValidator,
  async handler(ctx, args) {
    await requireAdmin(ctx);
    const [finance, stalls, reconciliations] = await Promise.all([
      computeFinance(ctx, null, args.from, args.to, args.now),
      ctx.db.query("stalls").collect(),
      ctx.db.query("financeReconciliations").withIndex("by_createdAt").order("desc").take(50),
    ]);
    const rows = await Promise.all(stalls.map(async stall => {
      const [seller, orders, deposits] = await Promise.all([
        ctx.db.get("users", stall.ownerId),
        ctx.db.query("orders").withIndex("by_stallId", q => q.eq("stallId", stall._id)).collect(),
        ctx.db.query("stallDeposits").withIndex("by_stallId", q => q.eq("stallId", stall._id)).collect(),
      ]);
      const scopedOrders = orders.filter(order => inRange(financeDate(order), args.from, args.to));
      const isRefundInProgress = (order: Doc<"orders">) => isReturnStatus(order.status);
      const refunded = scopedOrders.filter(order => order.status === "refunded");
      const inProgress = scopedOrders.filter(isRefundInProgress);
      const needsRefund = scopedOrders.filter(order => order.paymentMethod === "gcash" && order.status === "cancelled" && order.paymentStatus === "paid");
      const approvedDeposit = deposits.filter(item => item.status === "approved").reduce((sum, item) => sum + (item.approvedAmount ?? item.amount), 0);
      const financeRow = finance.stalls.find(row => row.stallId === stall._id);
      const nonRefunded = scopedOrders.filter(order => order.status !== "refunded");
      const depositStatus = approvedDeposit >= STALL_DEPOSIT_AMOUNT ? "paid" : stall.depositOverdue ? "overdue" : approvedDeposit > 0 ? "partial" : "unpaid";
      return {
        stallId: stall._id, stallName: stall.stallName, sellerName: seller?.fullName ?? "Unknown seller", verificationStatus: stall.verification.status,
        gcashSales: roundMoney(nonRefunded.filter(order => order.paymentMethod === "gcash" && order.status === "completed").reduce((total, order) => total + order.total, 0)),
        gcashOwed: financeRow?.gcashOwedToSeller ?? 0, gcashPaidOut: financeRow?.gcashPaidOut ?? 0,
        codSales: roundMoney(nonRefunded.filter(order => order.paymentMethod === "cod" && order.status === "completed").reduce((total, order) => total + order.total, 0)),
        codOwed: financeRow?.codOwed ?? 0, codOverdue: financeRow?.codOverdue ?? 0,
        commissionEarned: financeRow?.totalCommission ?? 0, depositRequired: STALL_DEPOSIT_AMOUNT, depositPaid: roundMoney(approvedDeposit),
        depositRemaining: roundMoney(Math.max(0, STALL_DEPOSIT_AMOUNT - approvedDeposit)), depositStatus,
        refundedAmount: roundMoney(refunded.reduce((total, order) => total + (order.refundAmount ?? order.total), 0)),
        refundedGcash: roundMoney(refunded.filter(order => order.paymentMethod === "gcash").reduce((total, order) => total + (order.refundAmount ?? order.total), 0)),
        refundedCod: roundMoney(refunded.filter(order => order.paymentMethod === "cod").reduce((total, order) => total + (order.refundAmount ?? order.total), 0)),
        refundedCount: refunded.length, inProgressAmount: roundMoney(inProgress.reduce((total, order) => total + order.total, 0)), inProgressCount: inProgress.length,
        needsRefundAmount: roundMoney(needsRefund.reduce((total, order) => total + order.total, 0)), needsRefundCount: needsRefund.length,
      };
    }));
    return {
      rows,
      expectedGcashBalance: finance.gcash.expectedBalance,
      reconciliations: reconciliations.map(item => ({ _id: item._id, actualBalance: item.actualBalance, expectedBalance: item.expectedBalance, difference: item.difference, from: item.from, to: item.to, adminEmail: item.adminEmail, createdAt: item.createdAt })),
    };
  },
});

export const getSellerFinance = query({
  args: financeArgsValidator,
  returns: sellerFinanceValidator,
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return emptySellerFinance();
    const user = await ctx.db.query("users").withIndex("by_token_identifier", q => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
    if (!user) return emptySellerFinance();
    const stall = await ctx.db.query("stalls").withIndex("by_ownerId", q => q.eq("ownerId", user._id)).first();
    if (!stall) return emptySellerFinance();
    const finance = await computeFinance(ctx, stall._id, args.from, args.to, args.now);
    return { cod: finance.cod, gcash: finance.gcash, commission: finance.commission };
  },
});

export const getAdminFinanceStall = query({
  args: { stallId: v.id("stalls"), ...financeArgsValidator },
  returns: stallFinanceValidator,
  async handler(ctx, args) {
    await requireAdmin(ctx);
    const stall = await ctx.db.get("stalls", args.stallId);
    if (!stall) return { stallId: args.stallId, stallName: "Unknown stall", orders: [] };
    const orders = await ctx.db.query("orders")
      .withIndex("by_stallId", q => q.eq("stallId", args.stallId))
      .order("desc")
      .take(1000);
    const visible = orders.filter(order => inRange(financeDate(order), args.from, args.to));
    const result = await Promise.all(visible.map(async order => {
      let commission = order.commissionAmount ?? 0;
      let invoiceNumber: string | null = null;
      let payoutReference: string | null = null;
      if (order.paymentMethod === "cod") {
        const accrual = await ctx.db.query("commissionAccruals").withIndex("by_orderId", q => q.eq("orderId", order._id)).unique();
        commission = accrual?.amount ?? 0;
        invoiceNumber = accrual?.invoiceId ? String(accrual.invoiceId) : null;
      } else {
        const platformCommission = await ctx.db.query("platformCommissions").withIndex("by_orderId", q => q.eq("orderId", order._id)).unique();
        commission = order.commissionAmount ?? platformCommission?.amount ?? 0;
        if (order.payoutRequestId) {
          const request = await ctx.db.get("payoutRequests", order.payoutRequestId);
          payoutReference = request?.transferReference ?? null;
        }
      }
      return {
        orderId: order._id,
        date: financeDate(order),
        paymentMethod: order.paymentMethod,
        itemsSubtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        commission,
        status: order.status,
        invoiceNumber,
        payoutReference,
      };
    }));
    return { stallId: stall._id, stallName: stall.stallName, orders: result.sort((a, b) => b.date.localeCompare(a.date)) };
  },
});

export const recordReconciliation = mutation({
  args: { actualBalance: v.number(), ...financeArgsValidator },
  returns: v.id("financeReconciliations"),
  async handler(ctx, args) {
    const adminEmail = await requireAdmin(ctx);
    if (!Number.isFinite(args.actualBalance) || args.actualBalance < 0) throw new Error("Enter a valid actual GCash balance.");
    const gcash = await computeGcashFinance(ctx, null, args.from, args.to, args.now);
    const actualBalance = roundMoney(args.actualBalance);
    return ctx.db.insert("financeReconciliations", {
      actualBalance,
      expectedBalance: gcash.section.expectedBalance,
      difference: roundMoney(actualBalance - gcash.section.expectedBalance),
      from: args.from,
      to: args.to,
      adminEmail,
      createdAt: new Date().toISOString(),
    });
  },
});
