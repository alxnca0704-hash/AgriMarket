'use client';

import React from 'react';
import { OrderStatus } from '@/types/order';
import { ORDER_STATUS_LABELS } from '@/constants/orders';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const STATUS_TONES: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-800',
  confirmed: 'bg-sage-soft text-sage',
  'to-receive': 'bg-sage-soft text-sage',
  delivered: 'bg-sage-soft text-sage',
  completed: 'bg-stone-100 text-stone-700',
  cancelled: 'bg-stone-100 text-stone-500',
  'refund-requested': 'bg-amber-50 text-amber-800',
  'return-approved': 'bg-sage-soft text-sage',
  'return-in-transit': 'bg-amber-50 text-amber-800',
  'return-received': 'bg-sage-soft text-sage',
  refunded: 'bg-stone-100 text-stone-700',
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold ${STATUS_TONES[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
