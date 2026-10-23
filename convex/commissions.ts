import { v } from "convex/values";
import { ADMIN_EMAIL } from "../constants/roles";
import { COMMISSION_RATE, INVOICE_DUE_MS, MIN_INVOICE_AMOUNT } from "../constants/commissions";
import { APP_ROUTES } from "../constants/routes";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { createNotification } from "./notifications";
import { resolveReceivableLedger, receivablePeriodStarts } from "./receivableHelpers";
import type { Id } from "./_generated/dataModel";

async function seller(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db.query("users").withIndex("by_token_identifier", q => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
}
async function admin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || identity.email?.toLowerCase() !== ADMIN_EMAIL || identity.emailVerified !== true) throw new Error("Not authorized");
  return identity.email.toLowerCase();
}
async function notifyAdmin(ctx: MutationCtx, type: string, title: string, body: string) {
  const user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", ADMIN_EMAIL)).first();
  if (user) await createNotification(ctx, { userId: user._id, role: "admin", type, title, body });
}
const roundMoney = (amount: number) => Math.round(amount * 100) / 100;
const invoiceRemaining = (invoice: { amount: number; paidAmount: number }) => Math.max(0, roundMoney(invoice.amount - invoice.paidAmount));
const invoiceStatusValidator = v.union(v.literal("issued"), v.literal("pending-review"), v.literal("partial"), v.literal("paid"), v.literal("overdue"));
const sellerCommissionDataValidator = v.union(v.null(), v.object({
  unbilled: v.number(),
  invoices: v.array(v.object({
    _id: v.id("commissionInvoices"), periodStart: v.string(), periodEnd: v.string(), amount: v.number(), paidAmount: v.number(), remaining: v.number(),
    dueAt: v.number(), status: invoiceStatusValidator, pending: v.boolean(), canResubmit: v.boolean(),
    orders: v.array(v.object({ orderId: v.id("orders"), amount: v.number(), date: v.string() })),
  })),
  gcash: v.union(v.null(), v.object({ qrUrl: v.string(), number: v.string() })),
}));

export const getSellerCommissions = query({
  args: { now: v.number() }, returns: sellerCommissionDataValidator,
  async handler(ctx, args) {
    const user = await seller(ctx); if (!user) return null;
    const stall = await ctx.db.query("stalls").withIndex("by_ownerId", q => q.eq("ownerId", user._id)).first(); if (!stall) return null;
    const accruals = await ctx.db.query("commissionAccruals").withIndex("by_stallId_and_status", q => q.eq("stallId", stall._id).eq("status", "accrued")).take(500);
    const invoices = await ctx.db.query("commissionInvoices").withIndex("by_stallId", q => q.eq("stallId", stall._id)).order("desc").take(100);
    const gcash = await ctx.db.query("gcashSettings").withIndex("by_key", q => q.eq("key", "primary")).first();
    const hydrated = await Promise.all(invoices.map(async invoice => {
      const currentStatus = invoiceRemaining(invoice) > 0 && invoice.dueAt <= args.now ? "overdue" : invoice.status;
      const items = await Promise.all(invoice.accrualIds.map(async id => {
        const accrual = await ctx.db.get("commissionAccruals", id); if (!accrual) return null;
        const order = await ctx.db.get("orders", accrual.orderId);
        return { orderId: accrual.orderId, amount: accrual.amount, date: order?.completedAt ?? accrual.createdAt };
      }));
      const latestPayment = await ctx.db.query("commissionPayments").withIndex("by_invoiceId", q => q.eq("invoiceId", invoice._id)).order("desc").first();
      const pending = latestPayment?.status === "pending";
      return { _id: invoice._id, periodStart: invoice.periodStart, periodEnd: invoice.periodEnd, amount: invoice.amount, paidAmount: invoice.paidAmount, dueAt: invoice.dueAt, status: currentStatus, remaining: invoiceRemaining(invoice), orders: items.filter((item): item is NonNullable<typeof item> => item !== null), pending, canResubmit: !pending };
    }));
    return {
      unbilled: roundMoney(accruals.reduce((sum, item) => sum + item.amount, 0)),
      invoices: hydrated,
      gcash: gcash ? { qrUrl: gcash.qrUrl, number: gcash.number } : null,
    };
  },
});

export const sellerUnpaidCount = query({ args: {}, returns: v.number(), async handler(ctx) {
  const user = await seller(ctx); if (!user) return 0;
  const stall = await ctx.db.query("stalls").withIndex("by_ownerId", q => q.eq("ownerId", user._id)).first(); if (!stall) return 0;
  return (await ctx.db.query("commissionInvoices").withIndex("by_stallId", q => q.eq("stallId", stall._id)).take(200)).filter(invoice => invoiceRemaining(invoice) > 0).length;
} });

export const submitPayment = mutation({
  args: { invoiceId: v.id("commissionInvoices"), amount: v.number(), referenceNumber: v.string() }, returns: v.null(),
  async handler(ctx, args) {
    const user = await seller(ctx); if (!user) throw new Error("Not authenticated");
    const invoice = await ctx.db.get("commissionInvoices", args.invoiceId);
    if (!invoice || invoice.sellerId !== user._id) throw new Error("Invoice not found");
    const remaining = invoiceRemaining(invoice); if (remaining <= 0) throw new Error("This invoice is already paid.");
    if (!Number.isFinite(args.amount) || args.amount <= 0 || args.amount > remaining) throw new Error("Enter an amount above zero and no greater than the remaining balance.");
    const referenceNumber = args.referenceNumber.trim(); if (referenceNumber.length < 4 || referenceNumber.length > 80) throw new Error("Enter a valid GCash reference number.");
    if (await ctx.db.query("commissionPayments").withIndex("by_referenceNumber", q => q.eq("referenceNumber", referenceNumber)).first()) throw new Error("This reference number has already been submitted.");
    const existing = await ctx.db.query("commissionPayments").withIndex("by_invoiceId", q => q.eq("invoiceId", invoice._id)).take(100);
    if (existing.some(payment => payment.status === "pending")) throw new Error("A payment is already awaiting admin review.");
    const now = new Date().toISOString();
    await ctx.db.insert("commissionPayments", { invoiceId: invoice._id, stallId: invoice.stallId, amount: roundMoney(args.amount), referenceNumber, status: "pending", createdAt: now });
    await ctx.db.patch("commissionInvoices", invoice._id, { status: "pending-review", events: [...invoice.events, { type: "payment_submitted", label: "Payment submitted", at: now, amount: roundMoney(args.amount) }] });
    await notifyAdmin(ctx, "commission_payment_submitted", "Commission payment submitted", `A seller submitted ₱${roundMoney(args.amount).toFixed(2)} for invoice ${invoice._id}.`);
    return null;
  },
});

export const listPendingPayments = query({ args: {}, returns: v.array(v.object({
  _id: v.id("commissionPayments"), invoiceId: v.id("commissionInvoices"), stallId: v.id("stalls"), amount: v.number(), referenceNumber: v.string(), createdAt: v.string(), status: v.literal("pending"),
  invoice: v.union(v.null(), v.object({ periodStart: v.string(), periodEnd: v.string(), remaining: v.number() })), stallName: v.string(), sellerName: v.string(),
})), async handler(ctx) {
  await admin(ctx);
  const payments = await ctx.db.query("commissionPayments").withIndex("by_status", q => q.eq("status", "pending")).order("desc").take(200);
  return Promise.all(payments.map(async payment => {
    const [invoice, stall] = await Promise.all([ctx.db.get("commissionInvoices", payment.invoiceId), ctx.db.get("stalls", payment.stallId)]);
    const sellerDoc = invoice ? await ctx.db.get("users", invoice.sellerId) : null;
    return { _id: payment._id, invoiceId: payment.invoiceId, stallId: payment.stallId, amount: payment.amount, referenceNumber: payment.referenceNumber, createdAt: payment.createdAt, status: "pending" as const, invoice: invoice ? { periodStart: invoice.periodStart, periodEnd: invoice.periodEnd, remaining: invoiceRemaining(invoice) } : null, stallName: stall?.stallName ?? "Unknown stall", sellerName: sellerDoc?.fullName ?? "Seller" };
  }));
} });

export const pendingCount = query({ args: {}, returns: v.number(), async handler(ctx) { await admin(ctx); return (await ctx.db.query("commissionPayments").withIndex("by_status", q => q.eq("status", "pending")).take(500)).length; } });

export const listOverdueInvoices = query({ args: { now: v.number() }, returns: v.array(v.object({ invoiceId: v.id("commissionInvoices"), amount: v.number(), daysOverdue: v.number(), stallName: v.string() })), async handler(ctx, args) {
  await admin(ctx);
  const invoices = await ctx.db.query("commissionInvoices").withIndex("by_status", q => q.eq("status", "overdue")).take(200);
  const alsoDue = await ctx.db.query("commissionInvoices").withIndex("by_dueAt", q => q.lte("dueAt", args.now)).take(200);
  const all = [...new Map([...invoices, ...alsoDue].filter(item => invoiceRemaining(item) > 0).map(item => [item._id, item])).values()];
  return Promise.all(all.map(async invoice => ({ invoiceId: invoice._id, amount: invoiceRemaining(invoice), daysOverdue: Math.max(0, Math.floor((args.now - invoice.dueAt) / 86400000)), stallName: (await ctx.db.get("stalls", invoice.stallId))?.stallName ?? "Unknown stall" })));
} });

export const approvePayment = mutation({ args: { paymentId: v.id("commissionPayments"), approvedAmount: v.number() }, returns: v.null(), async handler(ctx, args) {
  const actor = await admin(ctx); const payment = await ctx.db.get("commissionPayments", args.paymentId);
  if (!payment || payment.status !== "pending") throw new Error("This payment is no longer pending.");
  const invoice = await ctx.db.get("commissionInvoices", payment.invoiceId); if (!invoice) throw new Error("Invoice not found.");
  const remaining = invoiceRemaining(invoice); const approvedAmount = roundMoney(args.approvedAmount);
  if (!Number.isFinite(approvedAmount) || approvedAmount <= 0 || approvedAmount > remaining) throw new Error("Confirmed amount must be above zero and no greater than the remaining balance.");
  const now = new Date().toISOString(); const paidAmount = roundMoney(invoice.paidAmount + approvedAmount); const status = paidAmount >= invoice.amount ? "paid" : "partial";
  await ctx.db.patch("commissionPayments", payment._id, { status: "approved", approvedAmount, reviewedBy: actor, reviewedAt: now });
  await ctx.db.patch("commissionInvoices", invoice._id, { paidAmount, status, events: [...invoice.events, { type: "payment_approved", label: "Payment approved", at: now, actor, amount: approvedAmount }] });
  await ctx.db.insert("adminAuditLog", { actorEmail: actor, action: "commission_payment_approved", commissionPaymentId: payment._id, paymentReference: payment.referenceNumber, payoutAmount: approvedAmount, createdAt: now });
  await createNotification(ctx, { userId: invoice.sellerId, role: "seller", refId: invoice._id, type: "commission_payment_approved", title: "Commission payment approved", body: `₱${approvedAmount.toFixed(2)} was applied to your invoice.` });
  return null;
} });

export const rejectPayment = mutation({ args: { paymentId: v.id("commissionPayments"), reason: v.string() }, returns: v.null(), async handler(ctx, args) {
  const actor = await admin(ctx); const payment = await ctx.db.get("commissionPayments", args.paymentId);
  const reason = args.reason.trim(); if (!reason) throw new Error("A rejection reason is required.");
  if (!payment || payment.status !== "pending") throw new Error("This payment is no longer pending.");
  const invoice = await ctx.db.get("commissionInvoices", payment.invoiceId); if (!invoice) throw new Error("Invoice not found.");
  const now = new Date().toISOString(); const status = invoiceRemaining(invoice) > 0 && invoice.dueAt <= Date.now() ? "overdue" : invoice.paidAmount > 0 ? "partial" : "issued";
  await ctx.db.patch("commissionPayments", payment._id, { status: "rejected", rejectionReason: reason, reviewedBy: actor, reviewedAt: now });
  await ctx.db.patch("commissionInvoices", invoice._id, { status, events: [...invoice.events, { type: "payment_rejected", label: "Payment rejected", at: now, actor, reason }] });
  await ctx.db.insert("adminAuditLog", { actorEmail: actor, action: "commission_payment_rejected", commissionPaymentId: payment._id, paymentReference: payment.referenceNumber, reason, createdAt: now });
  await createNotification(ctx, { userId: invoice.sellerId, role: "seller", refId: invoice._id, type: "commission_payment_rejected", title: "Commission payment rejected", body: reason });
  return null;
} });

export const issueWeeklyInvoices = internalMutation({ args: {}, returns: v.null(), async handler(ctx) {
  const now = Date.now(); const periodEnd = new Date(now); periodEnd.setUTCHours(0, 0, 0, 0); periodEnd.setUTCDate(periodEnd.getUTCDate() - 1);
  const periodStart = new Date(periodEnd); periodStart.setUTCDate(periodStart.getUTCDate() - 6);
  const stalls = await ctx.db.query("stalls").take(1000);
  for (const stall of stalls) {
    const accruals = await ctx.db.query("commissionAccruals").withIndex("by_stallId_and_status", q => q.eq("stallId", stall._id).eq("status", "accrued")).take(500);
    const amount = roundMoney(accruals.reduce((sum, item) => sum + item.amount, 0)); if (amount < MIN_INVOICE_AMOUNT) continue;
    const createdAt = new Date(now).toISOString(); const dueAt = now + INVOICE_DUE_MS;
    const invoiceId = await ctx.db.insert("commissionInvoices", { stallId: stall._id, sellerId: stall.ownerId, periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString(), amount, paidAmount: 0, status: "issued", dueAt, accrualIds: accruals.map(item => item._id), events: [{ type: "issued", label: "Weekly invoice issued", at: createdAt }], createdAt });
    for (const accrual of accruals) await ctx.db.patch("commissionAccruals", accrual._id, { status: "invoiced", invoiceId });
    await createNotification(ctx, { userId: stall.ownerId, role: "seller", refId: invoiceId, type: "commission_invoice_issued", title: "Weekly commission invoice", body: `Your ₱${amount.toFixed(2)} invoice covers ${accruals.length} orders and is due ${new Date(dueAt).toLocaleDateString("en-PH")}. Open ${APP_ROUTES.sellerCommissions} to pay.` });
  }
  return null;
} });

export const processInvoiceReminders = internalMutation({ args: {}, returns: v.null(), async handler(ctx) {
  const now = Date.now(); const invoices = await ctx.db.query("commissionInvoices").withIndex("by_dueAt", q => q.lte("dueAt", now + 2 * 86400000)).take(500);
  for (const invoice of invoices) {
    const remaining = invoiceRemaining(invoice); if (remaining <= 0 || invoice.events.some(event => event.type === (invoice.dueAt <= now ? "overdue_notified" : "due_reminder"))) continue;
    if (invoice.dueAt <= now) {
      await ctx.db.patch("commissionInvoices", invoice._id, { status: "overdue", events: [...invoice.events, { type: "overdue_notified", label: "Invoice overdue", at: new Date(now).toISOString() }] });
      await createNotification(ctx, { userId: invoice.sellerId, role: "seller", refId: invoice._id, type: "commission_overdue", title: "Commission invoice overdue", body: `₱${remaining.toFixed(2)} remains due. Please open ${APP_ROUTES.sellerCommissions}.` });
      await notifyAdmin(ctx, "commission_invoice_overdue", "Commission invoice overdue", `Invoice ${invoice._id} has ₱${remaining.toFixed(2)} outstanding.`);
    } else if (invoice.dueAt - now <= 2 * 86400000) {
      await ctx.db.patch("commissionInvoices", invoice._id, { events: [...invoice.events, { type: "due_reminder", label: "Due in two days reminder sent", at: new Date(now).toISOString() }] });
      await createNotification(ctx, { userId: invoice.sellerId, role: "seller", refId: invoice._id, type: "commission_due_soon", title: "Commission due in two days", body: `₱${remaining.toFixed(2)} remains due on your invoice.` });
    }
  }
  return null;
} });

export const accrueCodDelivery = internalMutation({ args: { orderId: v.id("orders") }, returns: v.null(), async handler(ctx, args) {
  const order = await ctx.db.get("orders", args.orderId); if (!order || order.paymentMethod !== "cod" || order.status !== "completed") return null;
  const existing = await ctx.db.query("commissionAccruals").withIndex("by_orderId", q => q.eq("orderId", order._id)).unique(); if (existing) return null;
  const amount = roundMoney(order.subtotal * COMMISSION_RATE); if (amount <= 0) return null;
  const accrualId = await ctx.db.insert("commissionAccruals", { orderId: order._id, stallId: order.stallId, sellerId: order.sellerId, amount, status: "accrued", createdAt: new Date().toISOString() });
  const accruals = await ctx.db.query("commissionAccruals").withIndex("by_stallId_and_status", q => q.eq("stallId", order.stallId).eq("status", "accrued")).take(500);
  const total = roundMoney(accruals.reduce((sum, item) => sum + item.amount, 0));
  await createNotification(ctx, { userId: order.sellerId, role: "seller", orderId: order._id, refId: accrualId, type: "commission_accrued", title: "COD commission added", body: `Delivery complete. ₱${amount.toFixed(2)} commission added to this week's invoice. Total unbilled: ₱${total.toFixed(2)}.` });
  return null;
} });

export const waiveRefundedOrder = internalMutation({ args: { orderId: v.id("orders") }, returns: v.null(), async handler(ctx, args) {
  const accrual = await ctx.db.query("commissionAccruals").withIndex("by_orderId", q => q.eq("orderId", args.orderId)).unique(); if (!accrual || accrual.status === "waived") return null;
  const now = new Date().toISOString();
  if (accrual.status === "accrued") { await ctx.db.patch("commissionAccruals", accrual._id, { status: "waived" }); return null; }
  if (!accrual.invoiceId) return null; const invoice = await ctx.db.get("commissionInvoices", accrual.invoiceId); if (!invoice) return null;
  const newAmount = roundMoney(Math.max(0, invoice.amount - accrual.amount)); const paidAmount = invoice.paidAmount;
  const status = paidAmount >= newAmount ? "paid" : invoice.dueAt <= Date.now() ? "overdue" : paidAmount > 0 ? "partial" : "issued";
  await ctx.db.patch("commissionAccruals", accrual._id, { status: "waived" });
  await ctx.db.patch("commissionInvoices", invoice._id, { amount: newAmount, paidAmount, status, events: [...invoice.events, { type: "accrual_waived", label: "Refunded order commission waived", at: now, amount: accrual.amount }] });
  await createNotification(ctx, { userId: accrual.sellerId, role: "seller", refId: invoice._id, type: "commission_waived", title: "Commission waived", body: `₱${accrual.amount.toFixed(2)} commission was removed from your invoice after the order refund.` });
  return null;
} });

const receivableStatusValidator = v.union(v.literal("accrued"), v.literal("invoiced"), v.literal("overdue"), v.literal("paid"), v.literal("waived"));
const receivableArgsValidator = {
  search: v.string(), status: v.union(v.literal("all"), receivableStatusValidator), from: v.union(v.string(), v.null()), to: v.union(v.string(), v.null()),
  stallId: v.union(v.id("stalls"), v.null()), page: v.number(), pageSize: v.number(), now: v.number(),
};
const receivableRecordValidator = v.object({
  accrualId: v.id("commissionAccruals"), orderId: v.id("orders"), saleDate: v.string(), itemsSummary: v.string(), itemsSubtotal: v.number(),
  commission: v.number(), amountPaid: v.number(), amountOwed: v.number(), invoiceId: v.union(v.id("commissionInvoices"), v.null()),
  invoiceNumber: v.union(v.string(), v.null()), invoiceDueAt: v.union(v.number(), v.null()), status: receivableStatusValidator,
  paymentReference: v.union(v.string(), v.null()), paymentId: v.union(v.id("commissionPayments"), v.null()), paymentAmount: v.union(v.number(), v.null()), paidAt: v.union(v.string(), v.null()),
  invoiceAmount: v.union(v.number(), v.null()), invoicePaidAmount: v.union(v.number(), v.null()),
  stallId: v.id("stalls"), stallName: v.string(),
});
const receivableSummaryValidator = v.object({ totalOwed: v.number(), unbilled: v.number(), invoiced: v.number(), overdue: v.number(), paid: v.number(), waived: v.number(), collectedToday: v.number(), collectedThisWeek: v.number(), collectedThisMonth: v.number() });
const stallReceivableSummaryValidator = v.object({ stallId: v.id("stalls"), stallName: v.string(), unbilled: v.number(), invoiced: v.number(), overdue: v.number(), collected: v.number(), totalOwed: v.number(), oldestOverdueAt: v.union(v.string(), v.null()) });
const receivablesResultValidator = v.object({ records: v.array(receivableRecordValidator), total: v.number(), summary: receivableSummaryValidator, stalls: v.array(stallReceivableSummaryValidator) });

const emptyReceivables = { records: [], total: 0, summary: { totalOwed: 0, unbilled: 0, invoiced: 0, overdue: 0, paid: 0, waived: 0, collectedToday: 0, collectedThisWeek: 0, collectedThisMonth: 0 }, stalls: [] };

async function getReceivableRecords(
  ctx: QueryCtx,
  args: { search: string; status: "all" | "accrued" | "invoiced" | "overdue" | "paid" | "waived"; from: string | null; to: string | null; stallId: Id<"stalls"> | null; page: number; pageSize: number; now: number },
  ownedStallId: Id<"stalls"> | null,
) {
  const stallId = ownedStallId ?? args.stallId;
  let queryRange;
  if (stallId) queryRange = ctx.db.query("commissionAccruals").withIndex("by_stallId_and_createdAt", q => q.eq("stallId", stallId).gte("createdAt", args.from ?? "").lte("createdAt", args.to ?? "\uffff"));
  else queryRange = ctx.db.query("commissionAccruals").withIndex("by_createdAt", q => q.gte("createdAt", args.from ?? "").lte("createdAt", args.to ?? "\uffff"));
  const accruals = await queryRange.order("desc").collect();
  const ledger = await resolveReceivableLedger(ctx, accruals, args.now);
  const search = args.search.trim().toLowerCase();
  const hydrated = await Promise.all(accruals.map(async accrual => {
    const [order, stall] = await Promise.all([ctx.db.get("orders", accrual.orderId), ctx.db.get("stalls", accrual.stallId)]);
    if (!order) return null;
    const allocation = ledger.allocations.get(accrual._id);
    if (!allocation) return null;
    const invoice = accrual.invoiceId ? ledger.invoices.get(accrual.invoiceId) ?? null : null;
    const saleDate = order.completedAt ?? accrual.createdAt;
    if (args.from && saleDate < args.from || args.to && saleDate > args.to) return null;
    const matchesSearch = !search || String(order._id).toLowerCase().includes(search) || String(order._id).slice(-6).toLowerCase().includes(search) || String(invoice?._id ?? "").toLowerCase().includes(search);
    if (!matchesSearch || args.status !== "all" && allocation.status !== args.status) return null;
    return {
      accrualId: accrual._id, orderId: order._id, saleDate, itemsSummary: order.items.map(item => `${item.name} × ${item.qty}`).join(", "),
      itemsSubtotal: order.subtotal, commission: accrual.amount, amountPaid: allocation.amountPaid, amountOwed: allocation.amountOwed,
      invoiceId: invoice?._id ?? null, invoiceNumber: invoice ? String(invoice._id) : null, invoiceDueAt: invoice?.dueAt ?? null,
      status: allocation.status, paymentReference: allocation.paymentReference, paymentId: allocation.paymentId, paymentAmount: allocation.paymentAmount, paidAt: allocation.paidAt,
      invoiceAmount: invoice?.amount ?? null, invoicePaidAmount: invoice?.paidAmount ?? null,
      stallId: accrual.stallId, stallName: stall?.stallName ?? "Unknown stall",
    };
  }));
  const visible = hydrated.filter((row): row is NonNullable<typeof row> => row !== null);
  const sum = (status: "accrued" | "invoiced" | "overdue" | "paid" | "waived") => roundMoney(visible.filter(row => row.status === status).reduce((total, row) => total + (status === "paid" ? row.commission : status === "waived" ? row.commission : row.amountOwed), 0));
  const starts = receivablePeriodStarts(args.now);
  const visibleInvoiceIds = new Set(visible.flatMap(row => row.invoiceId ? [row.invoiceId] : []));
  const collectionTotal = (start: string) => roundMoney(ledger.approvedPayments.filter(payment => visibleInvoiceIds.has(payment.invoiceId) && (payment.reviewedAt ?? "") >= start).reduce((total, payment) => total + (payment.approvedAmount ?? 0), 0));
  const summary = { unbilled: sum("accrued"), invoiced: sum("invoiced"), overdue: sum("overdue"), paid: roundMoney(visible.reduce((total, row) => total + row.amountPaid, 0)), waived: sum("waived"), totalOwed: roundMoney(sum("accrued") + sum("invoiced") + sum("overdue")), collectedToday: collectionTotal(starts.today), collectedThisWeek: collectionTotal(starts.thisWeek), collectedThisMonth: collectionTotal(starts.thisMonth) };
  const stallsMap = new Map<string, { stallId: Id<"stalls">; stallName: string; unbilled: number; invoiced: number; overdue: number; collected: number; totalOwed: number; oldestOverdueAt: string | null }>();
  for (const row of visible) {
    const item = stallsMap.get(row.stallId) ?? { stallId: row.stallId, stallName: row.stallName, unbilled: 0, invoiced: 0, overdue: 0, collected: 0, totalOwed: 0, oldestOverdueAt: null };
    item.collected += row.amountPaid;
    if (row.status === "accrued") item.unbilled += row.amountOwed;
    if (row.status === "invoiced") item.invoiced += row.amountOwed;
    if (row.status === "overdue") { const dueDate = row.invoiceDueAt === null ? row.saleDate : new Date(row.invoiceDueAt).toISOString(); item.overdue += row.amountOwed; item.oldestOverdueAt = item.oldestOverdueAt === null || dueDate < item.oldestOverdueAt ? dueDate : item.oldestOverdueAt; }
    item.totalOwed += row.amountOwed;
    stallsMap.set(row.stallId, item);
  }
  const sorted = visible.sort((a, b) => b.saleDate.localeCompare(a.saleDate) || String(b.accrualId).localeCompare(String(a.accrualId)));
  const page = Math.max(1, Math.floor(args.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(args.pageSize)));
  return { records: sorted.slice((page - 1) * pageSize, page * pageSize), total: sorted.length, summary, stalls: [...stallsMap.values()].map(item => ({ ...item, unbilled: roundMoney(item.unbilled), invoiced: roundMoney(item.invoiced), overdue: roundMoney(item.overdue), collected: roundMoney(item.collected), totalOwed: roundMoney(item.totalOwed) })).sort((a, b) => a.stallName.localeCompare(b.stallName)) };
}

export const getSellerReceivables = query({ args: receivableArgsValidator, returns: receivablesResultValidator, async handler(ctx, args) {
  const user = await seller(ctx);
  if (!user) return emptyReceivables;
  const stall = await ctx.db.query("stalls").withIndex("by_ownerId", q => q.eq("ownerId", user._id)).first();
  if (!stall) return emptyReceivables;
  return getReceivableRecords(ctx, args, stall._id);
} });

export const getAdminReceivables = query({ args: receivableArgsValidator, returns: receivablesResultValidator, async handler(ctx, args) {
  await admin(ctx);
  return getReceivableRecords(ctx, args, null);
} });
