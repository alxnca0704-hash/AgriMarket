'use client';

import React from 'react';
import { Order } from '@/types/order';
import { ORDER_STATUS_LABELS } from '@/constants/orders';
import { formatOrderTime } from '@/lib/format';

interface OrderProgressProps {
  order: Order;
  audience: 'buyer' | 'seller';
  compact?: boolean;
}

const FULFILLMENT_STEPS = [
  { status: 'pending', label: 'Placed' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'to-receive', label: 'On the way' },
  { status: 'delivered', label: 'Delivered' },
  { status: 'completed', label: 'Complete' },
] as const;

export function OrderProgress({ order, audience, compact = false }: OrderProgressProps) {
  const currentIndex = FULFILLMENT_STEPS.findIndex(({ status }) => status === order.status);
  const activeStep = FULFILLMENT_STEPS[currentIndex];
  const latestEvent = order.events.at(-1);
  const isReturn = order.status.startsWith('return-')
    || order.status === 'refund-requested'
    || order.status === 'seller-rejected'
    || order.status === 'escalated'
    || order.status === 'repayment-submitted'
    || order.status === 'buyer-confirmed'
    || order.status === 'buyer-disputed'
    || order.status === 'refunded';
  const isClosed = order.status === 'cancelled';

  if (currentIndex < 0 || isReturn || isClosed) {
    return (
      <div className={`rounded-xl bg-stone-50 ${compact ? 'px-3 py-3' : 'px-4 py-4 sm:px-5'}`}>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
          {isReturn ? 'Return progress' : 'Order update'}
        </p>
        <p className="mt-1 text-sm font-semibold text-stone-800">{ORDER_STATUS_LABELS[order.status]}</p>
        {latestEvent && (
          <p className="mt-0.5 text-xs text-stone-500">{latestEvent.label} · {formatOrderTime(latestEvent.at)}</p>
        )}
      </div>
    );
  }

  const nextStep = FULFILLMENT_STEPS[currentIndex + 1];
  const description = order.status === 'pending'
    ? audience === 'buyer' ? 'Waiting for the seller to confirm.' : 'Review the items and confirm this order.'
    : order.status === 'confirmed'
      ? audience === 'buyer' ? 'The seller is preparing your order.' : 'Prepare the order for delivery.'
      : order.status === 'to-receive'
        ? audience === 'buyer' ? 'Your order is on its way.' : 'The order is with the buyer.'
        : audience === 'buyer' ? 'Confirm receipt when everything arrives.' : 'Waiting for the buyer to confirm receipt.';

  return (
    <section aria-label="Order progress" className={`rounded-xl bg-sage-soft/60 ${compact ? 'px-3 py-3' : 'px-4 py-4 sm:px-5 sm:py-5'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Order progress</p>
          <p className="mt-1 text-sm font-semibold text-stone-900">{activeStep.label}</p>
          <p className="mt-0.5 text-xs text-stone-600">{description}</p>
        </div>
        {nextStep && <p className="text-xs text-stone-500">Next: {nextStep.label}</p>}
      </div>
      <ol className="mt-4 grid grid-cols-5 gap-1" aria-label={`Step ${currentIndex + 1} of ${FULFILLMENT_STEPS.length}`}>
        {FULFILLMENT_STEPS.map((step, index) => {
          const complete = index <= currentIndex;
          return (
            <li key={step.status} className="min-w-0 text-center">
              <span className={`mx-auto block h-1.5 rounded-full ${complete ? 'bg-sage' : 'bg-white'}`} />
              <span className={`mt-1.5 block truncate text-[10px] sm:text-xs ${index === currentIndex ? 'font-semibold text-sage' : 'text-stone-500'}`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
