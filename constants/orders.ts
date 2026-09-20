import { OrderStatus } from '@/types/order';

export const PAYMENT_METHOD = {
  COD: 'cod',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  'to-ship': 'To Ship',
  'to-receive': 'To Receive',
  'to-review': 'To Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_TAG_COLORS: Record<OrderStatus, string> = {
  'to-ship': 'processing',
  'to-receive': 'geekblue',
  'to-review': 'warning',
  completed: 'success',
  cancelled: 'default',
};

export interface OrderStatusTab {
  key: 'all' | OrderStatus;
  label: string;
}

export const ORDER_STATUS_TABS: OrderStatusTab[] = [
  { key: 'to-ship', label: 'To Ship' },
  { key: 'to-receive', label: 'To Receive' },
  { key: 'to-review', label: 'To Review' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export const ORDER_STATUSES: OrderStatus[] = [
  'to-ship',
  'to-receive',
  'to-review',
  'completed',
  'cancelled',
];