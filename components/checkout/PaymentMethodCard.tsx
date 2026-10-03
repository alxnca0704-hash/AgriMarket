'use client';

import React from 'react';
import { Radio } from 'antd';
import { formatPrice } from '@/lib/format';

interface PaymentMethodCardProps {
  total: number;
  value: 'cod' | 'gcash';
  onChange: (value: 'cod' | 'gcash') => void;
}

export function PaymentMethodCard({ total, value, onChange }: PaymentMethodCardProps) {
  return (
    <section className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-stone-900 mb-4">Payment method</h2>

      <Radio.Group value={value} onChange={(event) => onChange(event.target.value)} className="!flex !flex-col !gap-3">
        <label className="rounded-xl bg-stone-50/80 p-4 flex items-start gap-3.5 cursor-pointer">
          <Radio value="cod" className="!mt-0.5" />
          <span className="flex-1 min-w-0">
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-stone-900">Cash on Delivery</span>
              <span className="text-sm font-semibold text-stone-900">{formatPrice(total)}</span>
            </span>
            <span className="block text-xs text-stone-500 leading-relaxed mt-1">Pay the courier in cash when your order arrives.</span>
          </span>
        </label>
        <label className="rounded-xl bg-stone-50/80 p-4 flex items-start gap-3.5 cursor-pointer">
          <Radio value="gcash" className="!mt-0.5" />
          <span className="flex-1 min-w-0">
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-stone-900">GCash via PayMongo</span>
              <span className="text-sm font-semibold text-stone-900">{formatPrice(total)}</span>
            </span>
            <span className="block text-xs text-stone-500 leading-relaxed mt-1">Pay securely in GCash. Each seller order is paid separately.</span>
          </span>
        </label>
      </Radio.Group>
    </section>
  );
}
