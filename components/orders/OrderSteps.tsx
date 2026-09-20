'use client';

import React from 'react';
import { Steps } from 'antd';
import { Order } from '@/types/order';
import { formatOrderTime } from '@/lib/format';

export function OrderSteps({ order }: { order: Order }) {
  const isCancelled = order.status === 'cancelled';
  const lastIndex = order.events.length - 1;

  const items = order.events.map((event, index) => {
    const isLast = index === lastIndex;
    return {
      status: (isLast
        ? isCancelled
          ? 'error'
          : 'process'
        : 'finish') as 'finish' | 'process' | 'error',
      title: event.label,
      content: (
        <span className="text-xs text-stone-400">{formatOrderTime(event.at)}</span>
      ),
    };
  });

  return (
    <Steps
      orientation="vertical"
      size="small"
      current={lastIndex}
      items={items}
      className="!mt-1"
    />
  );
}