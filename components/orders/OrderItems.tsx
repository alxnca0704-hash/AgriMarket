'use client';

import React from 'react';
import { Image } from 'antd';
import { OrderLineItem } from '@/types/order';
import { formatPrice } from '@/lib/format';

export function OrderItems({ items }: { items: OrderLineItem[] }) {
  return (
    <ul className="divide-y divide-stone-100">
      {items.map((line) => (
        <li key={line.productId} className="py-4 flex items-center gap-3.5 first:pt-0 last:pb-0">
          <Image
            src={line.imageUrl}
            alt={line.name}
            preview={false}
            className="!w-14 !h-14 rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-medium text-stone-800 truncate">{line.name}</p>
            <p className="text-xs text-stone-400">
              {formatPrice(line.price)}/{line.unit} × {line.qty}
            </p>
          </div>
          <span className="text-sm font-semibold text-stone-900 shrink-0">
            {formatPrice(line.price * line.qty)}
          </span>
        </li>
      ))}
    </ul>
  );
}