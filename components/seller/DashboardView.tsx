'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Skeleton } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useSellerDashboard } from '@/hooks/useSellerDashboard';
import { APP_ROUTES } from '@/constants/routes';
import { formatPrice } from '@/lib/format';

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</p>
      <p className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1">{value}</p>
      <p className="text-xs text-stone-400 mt-1">{hint}</p>
    </div>
  );
}

export function DashboardView() {
  const router = useRouter();
  const { isLoading, error, stall, stats, lowStock, outOfStockCount, listingCount } =
    useSellerDashboard();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-4">
        <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton.Button key={i} active block className="!h-28 !rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Seller dashboard</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
          {stall?.stallName ?? 'Seller dashboard'}
        </h1>
      </div>

      {error && <Alert type="error" title={error} showIcon />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Today's orders"
          value={String(stats.todayOrders)}
          hint="Placed today"
        />
        <StatTile
          label="Pending"
          value={String(stats.pendingOrders)}
          hint="New or preparing"
        />
        <StatTile
          label="Total sales"
          value={formatPrice(stats.totalSales)}
          hint="Shipped + completed"
        />
        <StatTile
          label="Low stock"
          value={String(lowStock.length)}
          hint={`${listingCount} active listings`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-stone-900 mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="primary" onClick={() => router.push(APP_ROUTES.sellerProductNew)} className="!rounded-xl">
              Add product
            </Button>
            <Button onClick={() => router.push(APP_ROUTES.sellerOrders)} className="!rounded-xl">
              View orders
            </Button>
            <Button onClick={() => router.push(APP_ROUTES.sellerEarnings)} className="!rounded-xl">
              View earnings
            </Button>
            <Button onClick={() => router.push(APP_ROUTES.sellerStall)} className="!rounded-xl">
              Edit stall
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-900">Stock health</h2>
            <span className="text-xs text-stone-400">
              {outOfStockCount} out of stock
            </span>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-stone-500">No low-stock items. Your shelves look healthy.</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between rounded-xl bg-stone-50/80 px-3 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <WarningOutlined className="text-amber-500 shrink-0" />
                    <span className="text-stone-800 truncate">{listing.name}</span>
                  </span>
                  <span className="text-stone-500 shrink-0 ml-3">
                    {listing.stockQty} {listing.unit} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}