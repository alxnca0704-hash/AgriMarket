'use client';

import React from 'react';
import { Alert, Button, Input, Modal, Skeleton } from 'antd';
import { WalletOutlined } from '@ant-design/icons';
import { useSellerEarnings, EARNINGS_PERIOD_OPTIONS } from '@/hooks/useSellerEarnings';
import { formatOrderTime, formatPrice } from '@/lib/format';

function EarningsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-4">
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton.Button key={i} active block className="!h-28 !rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function EarningsView() {
  const {
    isLoading,
    error,
    summary,
    period,
    setPeriod,
    payout,
    payoutOpen,
    payoutDraft,
    payoutErrors,
    openPayout,
    closePayout,
    updatePayoutField,
    savePayout,
  } = useSellerEarnings();

  if (isLoading) return <EarningsSkeleton />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Sales</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">Earnings</h1>
      </div>

      {error && <Alert type="error" title={error} showIcon />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Total sales</p>
          <p className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1">
            {formatPrice(summary.total)}
          </p>
          <p className="text-xs text-stone-400 mt-1">{summary.orderCount} paid orders</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Available balance</p>
          <p className="text-2xl sm:text-3xl font-semibold text-sage mt-1">
            {formatPrice(summary.availableBalance)}
          </p>
          <p className="text-xs text-stone-400 mt-1">Delivered + completed</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">In transit</p>
          <p className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1">
            {formatPrice(summary.inTransit)}
          </p>
          <p className="text-xs text-stone-400 mt-1">Shipped, not yet confirmed</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-stone-900">Sales summary</h2>
          <div className="flex gap-1.5">
            {EARNINGS_PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPeriod(opt.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  period === opt.key
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {summary.buckets.length === 0 ? (
          <p className="text-sm text-stone-500">No sales recorded yet for this period.</p>
        ) : (
          <div className="space-y-2">
            {summary.buckets.map((bucket) => (
              <div
                key={bucket.label}
                className="flex items-center justify-between rounded-xl bg-stone-50/80 px-4 py-3"
              >
                <span className="text-sm font-medium text-stone-800">{bucket.label}</span>
                <span className="text-sm text-stone-500">
                  {bucket.count} {bucket.count === 1 ? 'order' : 'orders'}
                </span>
                <span className="text-sm font-semibold text-stone-900">{formatPrice(bucket.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center">
            <WalletOutlined />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-stone-900">Payout method</h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Bank transfer · {payout.accountName} · {payout.accountNumber}
              {payout.bankName ? ` · ${payout.bankName}` : ''}
            </p>
            <p className="text-xs text-stone-400 mt-1">Payouts are simulated — no money moves in this prototype.</p>
          </div>
        </div>
        <Button onClick={openPayout} className="!rounded-xl shrink-0">
          Edit
        </Button>
      </div>

      <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Per-order breakdown</h2>
        {summary.entries.length === 0 ? (
          <p className="text-sm text-stone-500">No paid orders to show yet.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {summary.entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{entry.id}</p>
                  <p className="text-xs text-stone-400">
                    {entry.address.receiverName} · {formatOrderTime(entry.placedAt)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-stone-900 shrink-0">
                  {formatPrice(entry.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={payoutOpen}
        onCancel={closePayout}
        onOk={savePayout}
        okText="Save payout method"
        cancelText="Cancel"
        okButtonProps={{ className: '!rounded-lg' }}
        cancelButtonProps={{ className: '!rounded-lg' }}
        title="Payout method"
        width="min(92%, 440px)"
        centered
      >
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Account name</label>
            <Input
              size="large"
              className="!rounded-lg"
              value={payoutDraft.accountName}
              onChange={(e) => updatePayoutField('accountName', e.target.value)}
              status={payoutErrors.accountName ? 'error' : ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Account number
            </label>
            <Input
              size="large"
              className="!rounded-lg"
              value={payoutDraft.accountNumber}
              onChange={(e) => updatePayoutField('accountNumber', e.target.value)}
              status={payoutErrors.accountNumber ? 'error' : ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Bank name</label>
            <Input
              size="large"
              className="!rounded-lg"
              placeholder="e.g. BDO, BPI, LandBank"
              value={payoutDraft.bankName}
              onChange={(e) => updatePayoutField('bankName', e.target.value)}
              status={payoutErrors.bankName ? 'error' : ''}
            />
            {payoutErrors.bankName && (
              <p className="text-sm text-error mt-1">{payoutErrors.bankName}</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}