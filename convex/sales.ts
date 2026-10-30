import { v } from 'convex/values';
import { ADMIN_EMAIL } from '../constants/roles';
import { query } from './_generated/server';
import type { QueryCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { resolveReceivableLedger } from './receivableHelpers';
import { loadCodCommissionAccrualsForOrders } from './commissionAccruals';
import { orderItemValidator } from './shared';

const filtersValidator = {
  search: v.string(),
  paymentMethod: v.union(v.literal('all'), v.literal('gcash'), v.literal('cod')),
  saleStatus: v.union(v.literal('all'), v.literal('counted'), v.literal('refund-requested'), v.literal('refunded')),
  from: v.union(v.string(), v.null()),
  to: v.union(v.string(), v.null()),
  stallId: v.union(v.id('stalls'), v.null()),
  page: v.number(),
  pageSize: v.number(),
  now: v.number(),
};

const recordValidator = v.object({
  orderId: v.string(), completedAt: v.string(), buyerName: v.string(), stallName: v.string(),
  itemSummary: v.string(), items: v.array(orderItemValidator), itemsSubtotal: v.number(), deliveryFee: v.number(), orderTotal: v.number(),
  paymentMethod: v.union(v.literal('gcash'), v.literal('cod')), gcashReference: v.union(v.string(), v.null()),
  saleStatus: v.union(v.literal('counted'), v.literal('refund-requested'), v.literal('refunded')),
  stallId: v.string(),
  commissionAmount: v.union(v.number(), v.null()), commissionStatus: v.union(v.literal('accrued'), v.literal('invoiced'), v.literal('overdue'), v.literal('paid'), v.literal('waived'), v.literal('pending'), v.literal('collected'), v.literal('reversed'), v.literal('n/a')),
  invoiceNumber: v.union(v.string(), v.null()),
  payoutReference: v.union(v.string(), v.null()),
  refundAmount: v.union(v.number(), v.null()),
  refundMethod: v.union(v.literal('gcash'), v.literal('cash'), v.literal('seller-gcash'), v.null()),
  refundReference: v.union(v.string(), v.null()),
  refundConfirmedAt: v.union(v.string(), v.null()),
});
const summaryValidator = v.object({ totalSales: v.number(), gcashSales: v.number(), codSales: v.number(), orderCount: v.number(), today: v.number(), thisWeek: v.number(), thisMonth: v.number(), commissionAccrued: v.number(), commissionCollected: v.number(), codCommissionOwed: v.number(), gcashCommission: v.number(), totalCommission: v.number() });
const resultValidator = v.object({
  records: v.array(recordValidator), total: v.number(), summary: summaryValidator,
  stalls: v.array(v.object({ stallId: v.string(), stallName: v.string(), orders: v.number(), gcashTotal: v.number(), codTotal: v.number(), total: v.number(), refundedTotal: v.number() })),
});

function getSaleStatus(order: Doc<'orders'>) {
  if (order.status === 'refunded') return 'refunded' as const;
  if (order.status === 'refund-requested' || order.status === 'return-approved' || order.status === 'return-in-transit' || order.status === 'return-received') return 'refund-requested' as const;
  return 'counted' as const;
}

const PH_TIME_OFFSET_MS = 8 * 60 * 60 * 1000;
function phStart(now: number, period: 'day' | 'week' | 'month') {
  const local = new Date(now + PH_TIME_OFFSET_MS);
  if (period === 'month') local.setDate(1);
  local.setHours(0, 0, 0, 0);
  if (period === 'week') local.setDate(local.getDate() - ((local.getDay() + 6) % 7));
  return new Date(local.getTime() - PH_TIME_OFFSET_MS).toISOString();
}

async function listSales(ctx: QueryCtx, args: { search: string; paymentMethod: 'all' | 'gcash' | 'cod'; saleStatus: 'all' | 'counted' | 'refund-requested' | 'refunded'; from: string | null; to: string | null; stallId: Doc<'stalls'>['_id'] | null; page: number; pageSize: number; now: number }, admin: boolean) {
  const identity = await ctx.auth.getUserIdentity();
  let sellerId: Doc<'users'>['_id'] | null = null;
  if (!admin) {
    if (!identity) return { records: [], total: 0, summary: { totalSales: 0, gcashSales: 0, codSales: 0, orderCount: 0, today: 0, thisWeek: 0, thisMonth: 0, commissionAccrued: 0, commissionCollected: 0, codCommissionOwed: 0, gcashCommission: 0, totalCommission: 0 }, stalls: [] };
    const user = await ctx.db.query('users').withIndex('by_token_identifier', q => q.eq('tokenIdentifier', identity.tokenIdentifier)).first();
    if (!user) return { records: [], total: 0, summary: { totalSales: 0, gcashSales: 0, codSales: 0, orderCount: 0, today: 0, thisWeek: 0, thisMonth: 0, commissionAccrued: 0, commissionCollected: 0, codCommissionOwed: 0, gcashCommission: 0, totalCommission: 0 }, stalls: [] };
    sellerId = user._id;
  } else if (!identity || identity.email?.toLowerCase() !== ADMIN_EMAIL || identity.emailVerified !== true) {
    throw new Error('Not authorized');
  }

  let stallId = args.stallId;
  if (sellerId) {
    const ownerId = sellerId;
    if (!ownerId) return { records: [], total: 0, summary: { totalSales: 0, gcashSales: 0, codSales: 0, orderCount: 0, today: 0, thisWeek: 0, thisMonth: 0, commissionAccrued: 0, commissionCollected: 0, codCommissionOwed: 0, gcashCommission: 0, totalCommission: 0 }, stalls: [] };
    const stall = await ctx.db.query('stalls').withIndex('by_ownerId', q => q.eq('ownerId', ownerId)).first();
    if (!stall) return { records: [], total: 0, summary: { totalSales: 0, gcashSales: 0, codSales: 0, orderCount: 0, today: 0, thisWeek: 0, thisMonth: 0, commissionAccrued: 0, commissionCollected: 0, codCommissionOwed: 0, gcashCommission: 0, totalCommission: 0 }, stalls: [] };
    stallId = stall._id;
  }
  const search = args.search.trim().toLowerCase();
  const searchOrders = async (orders: Doc<'orders'>[]) => Promise.all(orders.map(async order => {
    const buyer = await ctx.db.get('users', order.buyerId);
    const buyerName = order.address.receiverName || buyer?.fullName || 'Buyer';
    const saleStatus = getSaleStatus(order);
    const searchable = `${order._id} ${order._id.slice(-6)} ${buyerName}`.toLowerCase();
    if (search && !searchable.includes(search)) return null;
    if (args.saleStatus !== 'all' && args.saleStatus !== saleStatus) return null;
    return { order, buyerName, saleStatus };
  }));

  // completedAt is the leading range key; stall and payment indexes keep their common scoped views selective.
  let source;
  if (stallId) source = ctx.db.query('orders').withIndex('by_stallId_and_completedAt', q => {
    return q.eq('stallId', stallId).gte('completedAt', args.from ?? '').lte('completedAt', args.to ?? '\uffff');
  });
  else if (args.paymentMethod !== 'all') source = ctx.db.query('orders').withIndex('by_paymentMethod_and_completedAt', q => {
    return q.eq('paymentMethod', args.paymentMethod as 'cod' | 'gcash').gte('completedAt', args.from ?? '').lte('completedAt', args.to ?? '\uffff');
  });
  else source = ctx.db.query('orders').withIndex('by_completedAt', q => q.gte('completedAt', args.from ?? '').lte('completedAt', args.to ?? '\uffff'));

  const orders = await source.order('desc').collect();
  const completed = orders.filter(order => order.completedAt && ['completed', 'refund-requested', 'return-approved', 'return-in-transit', 'return-received', 'refunded'].includes(order.status) && (args.paymentMethod === 'all' || order.paymentMethod === args.paymentMethod));
  const visible = (await searchOrders(completed)).filter((row): row is NonNullable<typeof row> => row !== null);
  const codPairs = await loadCodCommissionAccrualsForOrders(ctx, visible.map(({ order }) => order));
  const gcashCommissions = (await Promise.all(visible.filter(({ order }) => order.paymentMethod === 'gcash').map(({ order }) => ctx.db.query('platformCommissions').withIndex('by_orderId', q => q.eq('orderId', order._id)).unique()))).filter((commission): commission is NonNullable<typeof commission> => commission !== null);
  const receivableLedger = await resolveReceivableLedger(ctx, codPairs.map(pair => pair.accrual), args.now);
  const pairByOrderId = new Map(codPairs.map(pair => [String(pair.order._id), pair]));
  const codCommissionOwed = codPairs.reduce((sum, { accrual, eligible }) => { const allocation = receivableLedger.allocations.get(accrual._id); return sum + (eligible && allocation && allocation.status !== 'waived' ? allocation.amountOwed : 0); }, 0);
  const gcashCommission = gcashCommissions.filter(item => item.status === 'pending' || item.status === 'collected').reduce((sum, item) => sum + item.amount, 0);
  const commissionAccrued = codCommissionOwed;
  const commissionCollected = gcashCommissions.filter(item => item.status === 'collected').reduce((sum, item) => sum + item.amount, 0);
  const periodTotals = (from: string) => visible.filter(({ order }) => (order.completedAt ?? '') >= from && getSaleStatus(order) !== 'refunded').reduce((sum, { order }) => sum + order.total, 0);
  const counted = visible.filter(({ order }) => getSaleStatus(order) !== 'refunded');
  const summary = { totalSales: counted.reduce((sum, row) => sum + row.order.total, 0), gcashSales: counted.filter(row => row.order.paymentMethod === 'gcash').reduce((sum, row) => sum + row.order.total, 0), codSales: counted.filter(row => row.order.paymentMethod === 'cod').reduce((sum, row) => sum + row.order.total, 0), orderCount: counted.length, today: periodTotals(phStart(args.now, 'day')), thisWeek: periodTotals(phStart(args.now, 'week')), thisMonth: periodTotals(phStart(args.now, 'month')), commissionAccrued, commissionCollected, codCommissionOwed, gcashCommission, totalCommission: codCommissionOwed + gcashCommission };
  const stallsMap = new Map<string, { stallId: string; stallName: string; orders: number; gcashTotal: number; codTotal: number; total: number; refundedTotal: number }>();
  for (const { order } of visible) {
    const key = String(order.stallId);
    const row = stallsMap.get(key) ?? { stallId: key, stallName: order.sellerName, orders: 0, gcashTotal: 0, codTotal: 0, total: 0, refundedTotal: 0 };
    row.orders++;
    if (getSaleStatus(order) === 'refunded') row.refundedTotal += order.total;
    else { row.total += order.total; if (order.paymentMethod === 'gcash') row.gcashTotal += order.total; else row.codTotal += order.total; }
    stallsMap.set(key, row);
  }
  const start = Math.max(0, (args.page - 1) * args.pageSize);
  const page = visible.slice(start, start + args.pageSize);
  const records = await Promise.all(page.map(async ({ order, buyerName, saleStatus }) => {
    const payoutRequest = order.payoutRequestId ? await ctx.db.get('payoutRequests', order.payoutRequestId) : null;
    const codPair = pairByOrderId.get(String(order._id));
    const codAllocation = codPair ? receivableLedger.allocations.get(codPair.accrual._id) : undefined;
    const commissionStatus: 'accrued' | 'invoiced' | 'overdue' | 'paid' | 'waived' | 'pending' | 'collected' | 'reversed' | 'n/a' = order.status === 'refunded' ? (order.paymentMethod === 'gcash' ? 'reversed' : 'waived') : order.paymentMethod === 'gcash' ? gcashCommissions.find(item => String(item.orderId) === String(order._id))?.status ?? 'pending' : codPair ? (codPair.eligible ? codAllocation?.status ?? 'accrued' : 'waived') : 'n/a';
    return {
      orderId: String(order._id), completedAt: order.completedAt ?? '', buyerName, stallName: order.sellerName,
      itemSummary: order.items.map(item => `${item.name} - ${item.variantName ?? item.unit} x ${item.qty}`).join(', '),
      items: order.items, itemsSubtotal: order.subtotal,
      deliveryFee: order.deliveryFee, orderTotal: order.total, paymentMethod: order.paymentMethod,
      gcashReference: order.paymentMethod === 'gcash' ? order.paymentReference ?? null : null, saleStatus, stallId: String(order.stallId),
      commissionAmount: order.paymentMethod === 'gcash' ? gcashCommissions.find(item => String(item.orderId) === String(order._id))?.amount ?? order.commissionAmount ?? 0 : codPair?.amount ?? 0,
      commissionStatus,
      invoiceNumber: order.paymentMethod === 'gcash' ? null : codPair?.accrual.invoiceId ? String(receivableLedger.invoices.get(codPair.accrual.invoiceId)?._id ?? codPair.accrual.invoiceId) : null,
      payoutReference: payoutRequest?.transferReference ?? null,
      refundAmount: order.refundAmount ?? null,
      refundMethod: order.refundMethod ?? null,
      refundReference: order.refundReference ?? null,
      refundConfirmedAt: order.refundConfirmedAt ?? null,
    };
  }));
  return { records, total: visible.length, summary, stalls: Array.from(stallsMap.values()).sort((a, b) => a.stallName.localeCompare(b.stallName)) };
}

export const sellerSales = query({ args: filtersValidator, returns: resultValidator, handler: (ctx, args) => listSales(ctx, args, false) });
export const adminSales = query({ args: filtersValidator, returns: resultValidator, handler: (ctx, args) => listSales(ctx, args, true) });
