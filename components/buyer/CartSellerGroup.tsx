'use client';

import React from 'react';
import { Image, InputNumber, App } from 'antd';
import { DeleteOutlined, TruckOutlined } from '@ant-design/icons';
import { Seller } from '@/types/product';
import { formatPrice } from '@/lib/format';

export interface CartLineItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  stockQty: number;
  qty: number;
}

interface CartSellerGroupProps {
  seller: Seller;
  lines: CartLineItem[];
  subtotal: number;
  onQtyChange: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}

export function CartSellerGroup({
  seller,
  lines,
  subtotal,
  onQtyChange,
  onRemove,
}: CartSellerGroupProps) {
  const { message } = App.useApp();

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-2 border-b border-stone-100">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-sage-soft text-sage flex items-center justify-center shrink-0">
            <TruckOutlined />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 truncate">{seller.name}</p>
            <p className="text-xs text-stone-400">
              {seller.location} · Delivery {formatPrice(seller.deliveryFeePeso)}
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-stone-900 shrink-0">
          {formatPrice(subtotal)}
        </span>
      </div>

      <ul className="divide-y divide-stone-100">
        {lines.map((line) => {
          const maxReached = line.qty >= line.stockQty;
          return (
            <li key={line.productId} className="px-4 sm:px-5 py-4 flex items-center gap-3.5">
              <Image
                src={line.imageUrl}
                alt={line.name}
                preview={false}
                className="!w-14 !h-14 sm:!w-16 sm:!h-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm font-medium text-stone-800 truncate">{line.name}</p>
                <p className="text-xs text-stone-400">
                  {formatPrice(line.price)}/{line.unit}
                </p>
                <div className="flex items-center gap-2">
                  <InputNumber
                    size="small"
                    min={1}
                    max={line.stockQty}
                    value={line.qty}
                    onChange={(value) => onQtyChange(line.productId, value ?? 1)}
                    aria-label={`Quantity for ${line.name}`}
                  />
                  {maxReached && (
                    <span className="text-xs text-amber-600">Max stock</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-sm font-semibold text-stone-900">
                  {formatPrice(line.price * line.qty)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${line.name}`}
                  onClick={() => {
                    onRemove(line.productId);
                    message.info(`${line.name} removed from cart`);
                  }}
                  className="text-xs text-stone-400 hover:text-[#A64D42] cursor-pointer transition-colors"
                >
                  <DeleteOutlined /> Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}