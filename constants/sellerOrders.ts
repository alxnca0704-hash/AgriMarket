import { Order } from '@/types/order';

export type SellerOrderGroupKey =
  | 'all'
  | 'new'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface SellerOrderTab {
  key: SellerOrderGroupKey;
  label: string;
}

export const SELLER_ORDER_TABS: SellerOrderTab[] = [
  { key: 'new', label: 'New' },
  { key: 'preparing', label: 'To Prepare' },
  { key: 'ready', label: 'To Ship/Pickup' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export const SELLER_ORDER_GROUP_LABELS: Record<SellerOrderGroupKey, string> = {
  all: 'All',
  new: 'New',
  preparing: 'To Prepare',
  ready: 'To Ship/Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const SELLER_ORDER_TAG_COLORS: Record<SellerOrderGroupKey, string> = {
  all: 'default',
  new: 'processing',
  preparing: 'warning',
  ready: 'geekblue',
  completed: 'success',
  cancelled: 'default',
};

export function getSellerOrderGroup(order: Order): Exclude<SellerOrderGroupKey, 'all'> {
  if (order.status === 'completed') return 'completed';
  if (order.status === 'cancelled') return 'cancelled';
  if (order.status !== 'to-ship') return 'ready';
  if (!order.acceptedAt) return 'new';
  if (!order.readyAt) return 'preparing';
  return 'ready';
}

export function sellerActionLabel(order: Order): string | null {
  if (order.status !== 'to-ship') return null;
  if (!order.acceptedAt) return 'Accept order';
  if (!order.readyAt) return 'Mark as ready';
  if (!order.shippedAt) return 'Mark as shipped';
  return null;
}