import { Order } from '@/types/order';
import { PayoutMethod } from '@/types/seller';

export type EarningsPeriod = 'daily' | 'weekly' | 'monthly';

const PAYOUT_STORAGE_KEY = 'agrimarket_payout';

export const DEMO_PAYOUT_METHOD: PayoutMethod = {
  channel: 'bank',
  accountName: 'Celso Farm',
  accountNumber: '4382 1109 5512',
  bankName: 'BDO',
};

export function getPayoutMethod(): PayoutMethod {
  if (typeof window === 'undefined') return DEMO_PAYOUT_METHOD;
  const raw = window.localStorage.getItem(PAYOUT_STORAGE_KEY);
  if (!raw) return DEMO_PAYOUT_METHOD;
  try {
    return JSON.parse(raw) as PayoutMethod;
  } catch {
    return DEMO_PAYOUT_METHOD;
  }
}

const payoutListeners = new Set<() => void>();
let payoutSnapshot: PayoutMethod | null = null;

export function getPayoutMethodSnapshot(): PayoutMethod {
  if (payoutSnapshot === null) payoutSnapshot = getPayoutMethod();
  return payoutSnapshot;
}

export function subscribePayout(listener: () => void): () => void {
  payoutListeners.add(listener);
  return () => {
    payoutListeners.delete(listener);
  };
}

export function savePayoutMethod(payout: PayoutMethod): void {
  payoutSnapshot = payout;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PAYOUT_STORAGE_KEY, JSON.stringify(payout));
  }
  payoutListeners.forEach((listener) => listener());
}

function isSaleOrder(order: Order): boolean {
  return order.status !== 'pending' && order.status !== 'cancelled';
}

function getWeekLabel(date: Date): string {
  const base = new Date(date);
  const day = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - day + 3);
  const iso = new Date(base.getTime());
  const firstThursday = new Date(Date.UTC(iso.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(
    ((iso.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
  );
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
    return new Date(year, month - 1, 1).toLocaleDateString('en-PH', {
      month: 'short',
      year: 'numeric',
    });
  }
  if (period === 'weekly') {
    const [, second] = key.split('-W');
    return `Week ${second}`;
  }
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });
}

export interface EarningsBucket {
  label: string;
  total: number;
  count: number;
}

export interface EarningsSummary {
  period: EarningsPeriod;
  total: number;
  orderCount: number;
  availableBalance: number;
  inTransit: number;
  buckets: EarningsBucket[];
  entries: Order[];
}

export function getEarningsSummary(period: EarningsPeriod, orders: Order[]): EarningsSummary {
  const saleOrders = orders.filter(isSaleOrder);
  const total = saleOrders.reduce((sum, o) => sum + o.total, 0);

  const grouped = new Map<string, { total: number; count: number }>();
  saleOrders.forEach((order) => {
    const key = bucketKey(order, period);
    const existing = grouped.get(key) ?? { total: 0, count: 0 };
    grouped.set(key, { total: existing.total + order.total, count: existing.count + 1 });
  });

  const buckets = Array.from(grouped.entries())
    .map(([key, value]) => ({
      label: bucketLabel(key, period),
      total: value.total,
      count: value.count,
    }))
    .sort((a, b) => (a.label > b.label ? 1 : -1));

  const availableBalance = orders
    .filter((o) => o.status === 'delivered' || o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);
  const inTransit = orders
    .filter((o) => o.status === 'confirmed' || o.status === 'to-receive')
    .reduce((sum, o) => sum + o.total, 0);

  return {
    period,
    total,
    orderCount: saleOrders.length,
    availableBalance,
    inTransit,
    buckets,
    entries: [...saleOrders].sort(
      (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    ),
  };
}