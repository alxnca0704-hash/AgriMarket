'use client';

import React from 'react';
import { Checkbox, Image, InputNumber, App } from 'antd';
import { DeleteOutlined, MinusOutlined, PlusOutlined, TruckOutlined } from '@ant-design/icons';
import { Seller } from '@/types/product';
import { formatPrice } from '@/lib/format';

export interface CartLineItem {
  productId: string;
  variantId: string;
  variantName: string;
  name: string;
  price: number;
  priceUpdated: boolean;
  unavailable: boolean;
  imageUrl: string;
  stockQty: number;
  qty: number;
  selected: boolean;
}

interface CartSellerGroupProps {
  seller: Seller;
  lines: CartLineItem[];
  subtotal: number;
  onToggle: (productId: string, variantId: string, selected: boolean) => void;
  onToggleGroup: (selected: boolean) => void;
  onQtyChange: (productId: string, variantId: string, qty: number) => void;
  onRemove: (productId: string, variantId: string) => void;
}

export function CartSellerGroup({
  seller,
  lines,
  subtotal,
  onToggle,
  onToggleGroup,
  onQtyChange,
  onRemove,
}: CartSellerGroupProps) {
  const { message } = App.useApp();

  const allSelected = lines.length > 0 && lines.every((line) => line.selected);

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-2 border-b border-stone-100">
        <div className="flex items-center gap-3 min-w-0">
          <Checkbox
            checked={allSelected}
            onChange={(e) => onToggleGroup(e.target.checked)}
            aria-label={`Select all items from ${seller.name}`}
          />
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
          const maxReached = line.qty >= line.stockQty || line.unavailable;
          return (
            <li key={`${line.productId}:${line.variantId}`} className="px-4 sm:px-5 py-4 flex items-center gap-3.5">
              <Checkbox
                checked={line.selected}
                disabled={line.unavailable}
                onChange={(e) => onToggle(line.productId, line.variantId, e.target.checked)}
                aria-label={`Select ${line.name} for checkout`}
                className="shrink-0"
              />
              <Image
                src={line.imageUrl}
                alt={line.name}
                preview={false}
                className="!w-14 !h-14 sm:!w-16 sm:!h-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm font-medium text-stone-800 truncate">{line.name}</p>
                <p className="text-xs text-stone-500">{line.variantName} · {formatPrice(line.price)}</p>
                {line.priceUpdated && <p className="text-xs text-amber-700">Price updated</p>}
                {line.unavailable && <p className="text-xs text-error">Unavailable — remove to continue</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mobile: touch-friendly stepper */}
                  <div className="flex sm:hidden items-center gap-1 rounded-xl bg-stone-100 p-1">
                    <button
                      type="button"
                      disabled={line.qty <= 1}
                      onClick={() => onQtyChange(line.productId, line.variantId, line.qty - 1)}
                      aria-label={`Decrease quantity for ${line.name}`}
                      className="w-11 h-11 rounded-lg bg-white text-stone-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 active:bg-stone-200 transition-colors cursor-pointer shadow-sm"
                    >
                      <MinusOutlined />
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold text-stone-900">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      disabled={maxReached}
                      onClick={() => onQtyChange(line.productId, line.variantId, line.qty + 1)}
                      aria-label={`Increase quantity for ${line.name}`}
                      className="w-11 h-11 rounded-lg bg-white text-stone-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 active:bg-stone-200 transition-colors cursor-pointer shadow-sm"
                    >
                      <PlusOutlined />
                    </button>
                  </div>
                  {/* Desktop: compact numeric input */}
                  <div className="hidden sm:block">
                    <InputNumber
                      size="small"
                      min={1}
                      max={line.stockQty}
                      value={line.qty}
                      onChange={(value) => onQtyChange(line.productId, line.variantId, value ?? 1)}
                      aria-label={`Quantity for ${line.name}`}
                    />
                  </div>
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
                    onRemove(line.productId, line.variantId);
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
