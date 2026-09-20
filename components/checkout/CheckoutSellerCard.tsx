'use client';

import React from 'react';
import { Image, Input } from 'antd';
import { TruckOutlined } from '@ant-design/icons';
import { Seller } from '@/types/product';
import { CartLineItem } from '@/components/buyer/CartSellerGroup';
import { formatPrice } from '@/lib/format';

interface CheckoutSellerCardProps {
  seller: Seller;
  lines: CartLineItem[];
  subtotal: number;
  note: string;
  onNoteChange: (value: string) => void;
}

export function CheckoutSellerCard({
  seller,
  lines,
  subtotal,
  note,
  onNoteChange,
}: CheckoutSellerCardProps) {
  const deliveryFee = seller.deliveryFeePeso || 0;

  return (
    <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-2 border-b border-stone-100">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-sage-soft text-sage flex items-center justify-center shrink-0">
            <TruckOutlined />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 truncate">{seller.name}</p>
            <p className="text-xs text-stone-400">
              {seller.location} · Delivery {formatPrice(deliveryFee)}
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-stone-900 shrink-0">
          {formatPrice(subtotal + deliveryFee)}
        </span>
      </div>

      <ul className="divide-y divide-stone-100">
        {lines.map((line) => (
          <li key={line.productId} className="px-4 sm:px-5 py-4 flex items-center gap-3.5">
            <Image
              src={line.imageUrl}
              alt={line.name}
              preview={false}
              className="!w-14 !h-14 sm:!w-16 sm:!h-16 rounded-xl object-cover shrink-0"
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

      <div className="px-4 sm:px-5 py-4 space-y-2 border-t border-stone-100">
        <div className="flex items-center justify-between text-sm text-stone-600">
          <span>Subtotal ({lines.length} {lines.length === 1 ? 'item' : 'items'})</span>
          <span className="font-medium text-stone-800">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-stone-600">
          <span>Delivery fee</span>
          <span className="font-medium text-stone-800">{formatPrice(deliveryFee)}</span>
        </div>
        <label className="block pt-3">
          <span className="block text-xs font-medium text-stone-500 mb-1.5">
            Note to {seller.name} (optional)
          </span>
          <Input.TextArea
            rows={2}
            maxLength={120}
            showCount
            placeholder="e.g. Ripe mangoes only, deliver before noon"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            className="!rounded-xl !bg-stone-50/70"
          />
        </label>
      </div>
    </section>
  );
}