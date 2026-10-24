'use client';

import React from 'react';
import { Alert, Empty, Skeleton } from 'antd';
import { useSellerOrders } from '@/hooks/useSellerOrders';
import { SELLER_ORDER_GROUP_LABELS } from '@/constants/sellerOrders';
import { SellerOrderCard } from '@/components/seller/SellerOrderCard';
import { OrderStatusTabs } from '@/components/orders/OrderStatusTabs';

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

export function SellerOrdersView() {
  const {
    isLoading,
    error,
    orders,
    activeTab,
    counts,
    sortedOrders,
    setActiveTab,
    handleConfirm,
    handleReject,
    handleDispatch,
    handleComplete,
    handleConfirmReturnReceived,
    isActionPending,
  } = useSellerOrders();

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pb-16 pt-6 sm:px-6">

      {error && <Alert type="error" title={error} showIcon />}

      {isLoading ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm py-14">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="space-y-1.5">
                <p className="text-stone-800 font-medium">No incoming orders yet</p>
                <p className="text-sm text-stone-400">
                  When buyers place orders on your listings, they show up here.
                </p>
              </div>
            }
          />
        </div>
      ) : (
        <>
          <OrderStatusTabs activeTab={activeTab} counts={counts} onChange={setActiveTab} />

          {sortedOrders.length === 0 ? (
            <div className="rounded-2xl bg-white shadow-sm py-10">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span className="text-stone-500">No orders in {SELLER_ORDER_GROUP_LABELS[activeTab]} yet.</span>}
              />
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {sortedOrders.map((order) => (
                <SellerOrderCard
                  key={order.id}
                  order={order}
                  isActionPending={isActionPending}
                  onConfirm={() => handleConfirm(order)}
                  onReject={(reason) => handleReject(order, reason)}
                  onDispatch={(courier, trackingNumber) => handleDispatch(order, courier, trackingNumber)}
                  onComplete={() => handleComplete(order)}
                  onConfirmReturnReceived={() => handleConfirmReturnReceived(order)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
