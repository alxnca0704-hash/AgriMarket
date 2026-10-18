import { Order, OrderStatus } from '@/types/order';
import { ORDER_FILTER_STATUSES, OrderListFilter } from '@/constants/orders';

export type SellerOrderGroupKey = OrderListFilter;

export const SELLER_ORDER_GROUP_LABELS: Record<SellerOrderGroupKey, string> = {
  all: 'all orders',
  active: 'in-progress orders',
  past: 'past orders',
  returns: 'returns',
};

export const SELLER_ORDER_FILTER_STATUSES = ORDER_FILTER_STATUSES;

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
