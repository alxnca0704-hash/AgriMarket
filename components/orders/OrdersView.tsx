'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Empty, Skeleton } from 'antd';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatusTabs } from '@/components/orders/OrderStatusTabs';
import { OrderCard } from '@/components/orders/OrderCard';
import { APP_ROUTES } from '@/constants/routes';

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl bg-white shadow-sm p-5">
          <Skeleton active paragraph={{ rows: 3 }} title={{ width: '40%' }} />
        </div>
      ))}
    </div>
  );
}

export function OrdersView() {
  const router = useRouter();
  const {
    isLoading,
    error,
    orders,
    activeTab,
    counts,
    visibleOrders,
    setActiveTab,
    handleCancel,
    handleConfirmDelivery,
    handleRequestRefund,
    isActionPending,
  } = useOrders();

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pb-16 pt-6 sm:space-y-6 sm:px-6 sm:pt-10">

      {error && <Alert type="error" title={error} showIcon />}

      {isLoading ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm py-14">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="space-y-1.5">
                <p className="text-stone-800 font-medium">No orders yet</p>
                <p className="text-sm text-stone-400">
                  Farm-fresh produce is waiting. Place your first order in a few taps.
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
      ) : (
        <>
          <OrderStatusTabs activeTab={activeTab} counts={counts} onChange={setActiveTab} />

          {visibleOrders.length === 0 ? (
            <div className="rounded-2xl bg-white shadow-sm py-10">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="space-y-1.5">
                    <p className="text-stone-800 font-medium">Nothing here yet</p>
                    <p className="text-sm text-stone-400">
                      No orders in this status right now.
                    </p>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {visibleOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isActionPending={isActionPending}
                  onConfirmDelivery={() => handleConfirmDelivery(order)}
                  onCancel={(reason) => handleCancel(order, reason)}
                  onRequestRefund={(reason, evidenceUrls) => handleRequestRefund(order, reason, evidenceUrls)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
