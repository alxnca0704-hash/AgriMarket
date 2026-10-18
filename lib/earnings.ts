import { Order } from '@/types/order';

export type EarningsPeriod = 'daily' | 'weekly' | 'monthly';

function isSaleOrder(order: Order): boolean {
  return order.payment.status === 'paid' && order.status !== 'cancelled' && order.status !== 'refunded';
}

function getWeekLabel(date: Date): string {
  const base = new Date(date);
  const day = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - day + 3);
  const iso = new Date(base.getTime());
  const firstThursday = new Date(Date.UTC(iso.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((iso.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${week}`;
}

function bucketKey(order: Order, period: EarningsPeriod): string {
  const date = new Date(order.placedAt);
  if (period === 'daily') return date.toISOString().slice(0, 10);
  if (period === 'weekly') return `${date.getFullYear()}-W${getWeekLabel(date)}`;
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function bucketLabel(key: string, period: EarningsPeriod): string {
  if (period === 'monthly') {
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
  }
  if (period === 'weekly') return `Week ${key.split('-W')[1]}`;
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export interface EarningsBucket { label: string; total: number; count: number }
export interface EarningsSummary {
  period: EarningsPeriod;
  total: number;
  gcashTotal: number;
  codTotal: number;
  orderCount: number;
  availableBalance: number;
  inTransit: number;
  buckets: EarningsBucket[];
  entries: Order[];
}

export function getEarningsSummary(period: EarningsPeriod, orders: Order[]): EarningsSummary {
  const saleOrders = orders.filter(isSaleOrder);
  const grouped = new Map<string, { total: number; count: number }>();
  saleOrders.forEach((order) => {
    const key = bucketKey(order, period);
    const existing = grouped.get(key) ?? { total: 0, count: 0 };
    grouped.set(key, { total: existing.total + order.total, count: existing.count + 1 });
  });
  const buckets = Array.from(grouped.entries()).map(([key, value]) => ({ label: bucketLabel(key, period), ...value })).sort((a, b) => a.label.localeCompare(b.label));
  const now = Date.now();
  const availableBalance = orders.filter((order) => order.payment.method === 'gcash'
    && order.status === 'completed'
    && order.payment.status === 'paid'
    && order.refundPayoutHold !== true
    && !order.payoutRequestId
    && !!order.deliveredAt
    && now - Date.parse(order.deliveredAt) >= 24 * 60 * 60 * 1000).reduce((sum, order) => sum + order.total, 0);
  const inTransit = orders.filter((order) => order.status === 'confirmed' || order.status === 'to-receive').reduce((sum, order) => sum + order.total, 0);
  return {
    period,
    total: saleOrders.reduce((sum, order) => sum + order.total, 0),
    gcashTotal: saleOrders.filter((order) => order.payment.method === 'gcash').reduce((sum, order) => sum + order.total, 0),
    codTotal: saleOrders.filter((order) => order.payment.method === 'cod').reduce((sum, order) => sum + order.total, 0),
    orderCount: saleOrders.length,
    availableBalance,
    inTransit,
    buckets,
    entries: [...saleOrders].sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt)),
  };
}
