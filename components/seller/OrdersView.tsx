'use client';

import React from 'react';
import { Alert, Empty, Skeleton } from 'antd';
import { useSellerOrders } from '@/hooks/useSellerOrders';
import { SellerOrderGroupKey, SELLER_ORDER_TABS, SELLER_ORDER_GROUP_LABELS } from '@/constants/sellerOrders';
import { SellerOrderCard } from '@/components/seller/SellerOrderCard';

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
    handleAccept,
    handleMarkReady,
    handleMarkShipped,
    handleCancel,
  } = useSellerOrders();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Incoming</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
          Orders{' '}
          <span className="text-stone-400 font-normal text-lg sm:text-xl">
            ({orders.length})
          </span>
        </h1>
      </div>

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
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#2D6A4F] text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              All
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {counts.all}
              </span>
            </button>
            {SELLER_ORDER_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as SellerOrderGroupKey)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-white text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

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
                  onAccept={() => handleAccept(order)}
                  onMarkReady={() => handleMarkReady(order)}
                  onMarkShipped={() => handleMarkShipped(order)}
                  onCancel={(reason) => handleCancel(order, reason)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}