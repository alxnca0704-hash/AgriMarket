import { OrderStatus } from '@/types/order';

export const PAYMENT_METHOD = {
  COD: 'cod',
  GCASH: 'gcash',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
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

export const ORDER_STATUS_TAG_COLORS: Record<OrderStatus, string> = {
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
  refunded: 'success',
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
  { key: 'refund-requested', label: 'Return Requested' },
  { key: 'return-approved', label: 'Return Approved' },
  { key: 'return-in-transit', label: 'Return In Transit' },
  { key: 'return-received', label: 'Return Received' },
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
  'return-approved',
  'return-in-transit',
  'return-received',
  'refunded',
];

export const ORDER_ACTIONS = {
  confirmOrder: 'confirmOrder',
  rejectOrder: 'rejectOrder',
  dispatchOrder: 'dispatchOrder',
  completeOrder: 'completeOrder',
  cancelOrder: 'cancelOrder',
  confirmDelivery: 'confirmDelivery',
  requestRefund: 'requestRefund',
  submitReturnShipment: 'submitReturnShipment',
  confirmReturnReceived: 'confirmReturnReceived',
} as const;

export type OrderAction = (typeof ORDER_ACTIONS)[keyof typeof ORDER_ACTIONS];

export const ORDER_ACTION_KEYS: Record<OrderAction, (orderId: string) => string> = {
  confirmOrder: (orderId) => `${ORDER_ACTIONS.confirmOrder}:${orderId}`,
  rejectOrder: (orderId) => `${ORDER_ACTIONS.rejectOrder}:${orderId}`,
  dispatchOrder: (orderId) => `${ORDER_ACTIONS.dispatchOrder}:${orderId}`,
  completeOrder: (orderId) => `${ORDER_ACTIONS.completeOrder}:${orderId}`,
  cancelOrder: (orderId) => `${ORDER_ACTIONS.cancelOrder}:${orderId}`,
  confirmDelivery: (orderId) => `${ORDER_ACTIONS.confirmDelivery}:${orderId}`,
  requestRefund: (orderId) => `${ORDER_ACTIONS.requestRefund}:${orderId}`,
  submitReturnShipment: (orderId) => `${ORDER_ACTIONS.submitReturnShipment}:${orderId}`,
  confirmReturnReceived: (orderId) => `${ORDER_ACTIONS.confirmReturnReceived}:${orderId}`,
};
