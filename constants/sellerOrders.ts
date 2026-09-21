import { Order, OrderStatus } from '@/types/order';

export type SellerOrderGroupKey = 'all' | OrderStatus;

export interface SellerOrderTab {
  key: SellerOrderGroupKey;
  label: string;
}

export const SELLER_ORDER_TABS: SellerOrderTab[] = [
  { key: 'pending', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'to-receive', label: 'To receive' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export const SELLER_ORDER_GROUP_LABELS: Record<SellerOrderGroupKey, string> = {
  all: 'all',
  pending: 'New',
  confirmed: 'Confirmed',
  'to-receive': 'To receive',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const SELLER_ORDER_TAG_COLORS: Record<OrderStatus, string> = {
  pending: 'gold',
  confirmed: 'processing',
  'to-receive': 'geekblue',
  delivered: 'cyan',
  completed: 'success',
  cancelled: 'default',
};

export function getSellerOrderGroup(order: Order): OrderStatus {
  return order.status;
}
