'use client';

import React from 'react';
import { App, Button, Empty } from 'antd';
import { EnvironmentOutlined, RightOutlined } from '@ant-design/icons';
import { useCart } from '@/hooks/useCart';
import { CartSellerGroup } from '@/components/buyer/CartSellerGroup';
import { PriceSummary } from '@/components/buyer/PriceSummary';
import { APP_ROUTES } from '@/constants/routes';
import { formatPrice } from '@/lib/format';
import { useRouter } from 'next/navigation';

export function CartView() {
  const router = useRouter();
  const { message } = App.useApp();
  const {
    user,
    groups,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    handleQtyChange,
    handleRemove,
  } = useCart();

  if (itemCount === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-20 pb-24">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="space-y-1.5">
              <p className="text-stone-800 font-medium">Your cart is empty</p>
              <p className="text-sm text-stone-400">
                Farm-fresh produce is waiting. Add something you&apos;ll love.
              </p>
            </div>
          }
        >
          <Button
            type="primary"
            size="large"
            onClick={() => router.push(APP_ROUTES.home)}
            className="!rounded-xl"
          >
            Browse products
          </Button>
        </Empty>
      </div>
    );
  }

  const handleCheckout = () => {
    message.info('Checkout is next on the roadmap — your cart is saved.');
  };

  const handleEditAddress = () => {
    message.info('Saved addresses come with the profile tools on the roadmap.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-10 pb-10 space-y-6 sm:space-y-7">
      <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-stone-900">
        Cart{' '}
        <span className="text-stone-400 font-normal text-lg sm:text-xl">
          ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
      </h1>

      <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5 flex items-center gap-3.5">
        <span className="w-10 h-10 rounded-xl bg-sage-soft text-sage flex items-center justify-center shrink-0">
          <EnvironmentOutlined />
        </span>
        <button
          type="button"
          onClick={handleEditAddress}
          className="flex-1 min-w-0 text-left cursor-pointer"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Delivering to
          </p>
          <p className="text-sm text-stone-700 leading-snug truncate">
            {user.defaultAddressSummary}
          </p>
        </button>
        <span className="text-[#2D6A4F] shrink-0">
          <RightOutlined />
        </span>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {groups.map((group) => (
          <CartSellerGroup
            key={group.seller.id}
            seller={group.seller}
            lines={group.lines}
            subtotal={group.subtotal}
            onQtyChange={handleQtyChange}
            onRemove={handleRemove}
          />
        ))}
      </div>

      <PriceSummary
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        total={total}
        itemCount={itemCount}
        note="Delivery fee is charged once per farm and shown up front. Full breakdown appears at checkout."
      />

      <Button type="primary" size="large" block onClick={handleCheckout} className="!h-12 !rounded-xl">
        Proceed to checkout · {formatPrice(total)}
      </Button>
    </div>
  );
}