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
  { key: 'refund-requested', label: 'Return Requested' },
  { key: 'return-approved', label: 'Return Approved' },
  { key: 'return-in-transit', label: 'Return In Transit' },
  { key: 'return-received', label: 'Return Received' },
  { key: 'refunded', label: 'Refunded' },
];

export const SELLER_ORDER_GROUP_LABELS: Record<SellerOrderGroupKey, string> = {
  all: 'all',
  pending: 'New',
  confirmed: 'Confirmed',
  'to-receive': 'To receive',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'refund-requested': 'Return Requested',
  'return-approved': 'Return Approved',
  'return-in-transit': 'Return In Transit',
  'return-received': 'Return Received',
  refunded: 'Refunded',
};

export const SELLER_ORDER_TAG_COLORS: Record<OrderStatus, string> = {
  pending: 'gold',
  confirmed: 'processing',
  'to-receive': 'geekblue',
  delivered: 'cyan',
  completed: 'success',
  cancelled: 'default',
  'refund-requested': 'orange',
  'return-approved': 'blue',
  'return-in-transit': 'processing',
  'return-received': 'cyan',
  refunded: 'red',
};

export function getSellerOrderGroup(order: Order): OrderStatus {
  return order.status;
}
