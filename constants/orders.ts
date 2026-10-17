import { OrderStatus } from '@/types/order';

export const PAYMENT_METHOD = {
  COD: 'cod',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  'to-receive': 'To receive',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'refund-requested': 'Refund requested',
  refunded: 'Refunded',
};

export const ORDER_STATUS_TAG_COLORS: Record<OrderStatus, string> = {
  pending: 'gold',
  confirmed: 'processing',
  'to-receive': 'geekblue',
  delivered: 'cyan',
  completed: 'success',
  cancelled: 'default',
  'refund-requested': 'orange',
  refunded: 'red',
};

export interface OrderStatusTab {
  key: OrderStatus;
  label: string;
}

export const ORDER_STATUS_TABS: OrderStatusTab[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'to-receive', label: 'To receive' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refund-requested', label: 'Refund requested' },
  { key: 'refunded', label: 'Refunded' },
];

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'to-receive',
  'delivered',
  'completed',
  'cancelled',
  'refund-requested',
  'refunded',
];

export const ORDER_ACTIONS = {
  confirmOrder: 'confirmOrder',
  rejectOrder: 'rejectOrder',
  dispatchOrder: 'dispatchOrder',
  completeOrder: 'completeOrder',
  approveRefund: 'approveRefund',
  rejectRefund: 'rejectRefund',
  cancelOrder: 'cancelOrder',
  confirmDelivery: 'confirmDelivery',
  requestRefund: 'requestRefund',
} as const;

export type OrderAction = (typeof ORDER_ACTIONS)[keyof typeof ORDER_ACTIONS];

export const ORDER_ACTION_KEYS: Record<OrderAction, (orderId: string) => string> = {
  confirmOrder: (orderId) => `${ORDER_ACTIONS.confirmOrder}:${orderId}`,
  rejectOrder: (orderId) => `${ORDER_ACTIONS.rejectOrder}:${orderId}`,
  dispatchOrder: (orderId) => `${ORDER_ACTIONS.dispatchOrder}:${orderId}`,
  completeOrder: (orderId) => `${ORDER_ACTIONS.completeOrder}:${orderId}`,
  approveRefund: (orderId) => `${ORDER_ACTIONS.approveRefund}:${orderId}`,
  rejectRefund: (orderId) => `${ORDER_ACTIONS.rejectRefund}:${orderId}`,
  cancelOrder: (orderId) => `${ORDER_ACTIONS.cancelOrder}:${orderId}`,
  confirmDelivery: (orderId) => `${ORDER_ACTIONS.confirmDelivery}:${orderId}`,
  requestRefund: (orderId) => `${ORDER_ACTIONS.requestRefund}:${orderId}`,
};
