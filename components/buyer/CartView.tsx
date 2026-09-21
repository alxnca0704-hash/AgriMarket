'use client';

import React from 'react';
import { Alert, Button, Empty } from 'antd';
import { useCart } from '@/hooks/useCart';
import { CartSellerGroup } from '@/components/buyer/CartSellerGroup';
import { PriceSummary } from '@/components/buyer/PriceSummary';
import { APP_ROUTES } from '@/constants/routes';
import { formatPrice } from '@/lib/format';
import { useRouter } from 'next/navigation';

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200/80 ${className}`} />;
}

function CartSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-10 pb-10 space-y-6 sm:space-y-7">
      <SkeletonBlock className="h-8 w-44 sm:w-52" />

      <div className="space-y-4 sm:space-y-5">
        {[0, 1].map((group) => (
          <div key={group} className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-2 border-b border-stone-100">
              <div className="flex items-center gap-3 min-w-0">
                <SkeletonBlock className="w-9 h-9 rounded-xl shrink-0" />
                <div className="min-w-0 space-y-2">
                  <SkeletonBlock className="h-4 w-36" />
                  <SkeletonBlock className="h-3 w-44" />
                </div>
              </div>
              <SkeletonBlock className="h-5 w-16 shrink-0" />
            </div>
            <div className="divide-y divide-stone-100">
              {[0, 1].map((line) => (
                <div key={line} className="px-4 sm:px-5 py-4 flex items-center gap-3.5">
                  <SkeletonBlock className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <SkeletonBlock className="h-4 w-3/4 max-w-xs" />
                    <SkeletonBlock className="h-3 w-24" />
                    <SkeletonBlock className="h-6 w-24 rounded-lg" />
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <SkeletonBlock className="h-5 w-14" />
                    <SkeletonBlock className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6 space-y-3">
        {[0, 1].map((row) => (
          <div key={row} className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-4 w-16" />
          </div>
        ))}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <SkeletonBlock className="h-4 w-12" />
          <SkeletonBlock className="h-6 w-20" />
        </div>
      </div>

      <SkeletonBlock className="h-12 w-full rounded-xl" />
    </div>
  );
}

export function CartView() {
  const router = useRouter();
  const {
    isLoading,
    error,
    groups,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    handleQtyChange,
    handleRemove,
  } = useCart();

  if (isLoading) {
    return <CartSkeleton />;
  }

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
    router.push(APP_ROUTES.checkout);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-10 pb-10 space-y-6 sm:space-y-7">
      {error && <Alert type="error" title={error} showIcon />}

      <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-stone-900">
        Cart{' '}
        <span className="text-stone-400 font-normal text-lg sm:text-xl">
          ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
      </h1>

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