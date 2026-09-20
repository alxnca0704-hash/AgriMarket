'use client';

import React from 'react';
import { Button } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';
import { PriceSummary } from '@/components/buyer/PriceSummary';
import { formatPrice } from '@/lib/format';

interface PlaceOrderBarProps {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  disabled?: boolean;
  onPlaceOrder: () => void;
}

function PlaceOrderButton({
  total,
  disabled,
  onPlaceOrder,
}: Pick<PlaceOrderBarProps, 'total' | 'disabled' | 'onPlaceOrder'>) {
  return (
    <Button
      type="primary"
      size="large"
      block
      disabled={disabled}
      onClick={onPlaceOrder}
      icon={<ShoppingOutlined />}
      className="!h-12 !rounded-xl !font-semibold"
    >
      Place order · {formatPrice(total)}
    </Button>
  );
}

export function PlaceOrderBar(props: PlaceOrderBarProps) {
  return (
    <>
      <aside className="hidden lg:block sticky top-20 space-y-4">
        <PriceSummary
          subtotal={props.subtotal}
          deliveryFee={props.deliveryFee}
          total={props.total}
          itemCount={props.itemCount}
          note="Delivery fee is charged once per farm. Confirmed in the pop-up before placing."
        />
        <PlaceOrderButton
          total={props.total}
          disabled={props.disabled}
          onPlaceOrder={props.onPlaceOrder}
        />
      </aside>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur-md shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">
              {props.itemCount} {props.itemCount === 1 ? 'item' : 'items'} · Cash on Delivery
            </span>
            <span className="text-lg font-bold text-stone-900">
              {formatPrice(props.total)}
            </span>
          </div>
          <PlaceOrderButton
            total={props.total}
            disabled={props.disabled}
            onPlaceOrder={props.onPlaceOrder}
          />
        </div>
      </div>
    </>
  );
}