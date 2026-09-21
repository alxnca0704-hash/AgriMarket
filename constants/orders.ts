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
};

export const ORDER_STATUS_TAG_COLORS: Record<OrderStatus, string> = {
  pending: 'gold',
  confirmed: 'processing',
  'to-receive': 'geekblue',
  delivered: 'cyan',
  completed: 'success',
  cancelled: 'default',
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
];

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'to-receive',
  'delivered',
  'completed',
  'cancelled',
];
