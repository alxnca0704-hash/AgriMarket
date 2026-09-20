'use client';

import React from 'react';
import { formatPrice } from '@/lib/format';

interface PriceSummaryProps {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  note?: string;
}

export function PriceSummary({
  subtotal,
  deliveryFee,
  total,
  itemCount,
  note,
}: PriceSummaryProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5 space-y-2.5 text-sm">
      <div className="flex items-center justify-between text-stone-600">
        <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
        <span className="font-medium text-stone-800">{formatPrice(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between text-stone-600">
        <span>Delivery fee</span>
        <span className="font-medium text-stone-800">
          {deliveryFee > 0 ? formatPrice(deliveryFee) : 'Free'}
        </span>
      </div>
      <div className="flex items-center justify-between pt-2.5 border-t border-stone-100">
        <span className="font-semibold text-stone-900">Total</span>
        <span className="text-lg font-semibold text-stone-900">{formatPrice(total)}</span>
      </div>
      {note && <p className="text-xs text-stone-400 leading-relaxed">{note}</p>}
    </div>
  );
}