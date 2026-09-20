'use client';

import React from 'react';
import { CheckCircleFilled } from '@ant-design/icons';
import { formatPrice } from '@/lib/format';

interface PaymentMethodCardProps {
  total: number;
}

export function PaymentMethodCard({ total }: PaymentMethodCardProps) {
  return (
    <section className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-stone-900 mb-4">Payment method</h2>

      <div className="rounded-xl bg-stone-50/80 p-4 flex items-start gap-3.5">
        <span className="mt-0.5">
          <CheckCircleFilled className="text-[#2D6A4F] text-lg" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-stone-900">Cash on Delivery</p>
            <span className="text-sm font-semibold text-stone-900">
              {formatPrice(total)}
            </span>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed mt-1">
            Pay in cash (or via GCash scan) to the courier when your order arrives. No online
            payment needed today.
          </p>
        </div>
      </div>
    </section>
  );
}