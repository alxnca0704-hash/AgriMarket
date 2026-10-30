'use client';

import { Alert, Empty, Skeleton, Tag } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  RightOutlined,
  ShoppingOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { STALL_DEPOSIT_AMOUNT } from '@/constants/deposits';
import { formatOrderTime, formatPrice } from '@/lib/format';
import type { SellerStallPageResult } from '@/hooks/useSellerStallPage';
import { StallStatCard } from '@/components/seller/StallStatCard';

const activityIcons = {
  sale: ShoppingOutlined,
  payout: WalletOutlined,
  commission: FileTextOutlined,
  deposit: SafetyCertificateOutlined,
} as const;

const activityTabs = {
  sale: 'sales',
  payout: 'payouts',
  commission: 'platform',
  deposit: 'deposit',
} as const;

const attentionIcons = {
  error: ExclamationCircleOutlined,
  warning: ExclamationCircleOutlined,
  info: InfoCircleOutlined,
} as const;

const attentionColors = {
  error: 'text-red-700 bg-red-50',
  warning: 'text-amber-700 bg-amber-50',
  info: 'text-sky-700 bg-sky-50',
} as const;

export interface StallOverviewTabProps {
  page: SellerStallPageResult;
}

export function StallOverviewTab({ page }: StallOverviewTabProps) {
  const { finance, sales, deposit, attention, activity } = page;
  const cod = finance.finance?.cod;
  const gcash = finance.finance?.gcash;
  const summary = sales.summary;
  const overdue = cod?.overdue ?? 0;
  const depositPaid = deposit.data?.stall.depositPaidAmount ?? 0;
  const depositStatus = deposit.pending
    ? 'Under review'
    : deposit.data?.stall.depositStatus === 'paid'
      ? 'Paid'
      : deposit.remaining > 0
        ? `${formatPrice(deposit.remaining)} remaining`
        : 'Paid';
  const depositTone = deposit.data?.stall.depositStatus === 'paid'
    ? 'sage'
    : deposit.data?.stall.overdue
      ? 'error'
      : 'warning';

  if (page.error) {
    return <Alert type="error" title="Could not load your stall" description={page.error} showIcon />;
  }
  if (page.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StallStatCard label="Available payout" value={formatPrice(gcash?.availableBalance ?? 0)} note={`${page.earnings.payoutData && 'balance' in page.earnings.payoutData ? page.earnings.payoutData.balance.availableBalance.orderCount : 0} eligible orders`} tone="sage" />
        <StallStatCard label="Rolling payout" value={formatPrice(gcash?.rollingBalance ?? 0)} note={`${page.earnings.payoutData && 'balance' in page.earnings.payoutData ? page.earnings.payoutData.balance.rollingBalance.orderCount : 0} orders in return window or on hold`} />
        <StallStatCard label="Requested payout" value={formatPrice(gcash?.requestedBalance ?? 0)} note={`${page.earnings.payoutData && 'balance' in page.earnings.payoutData ? page.earnings.payoutData.balance.requestedBalance.orderCount : 0} orders requested or on hold`} />
        <StallStatCard label="Paid out" value={formatPrice(gcash?.paidOut ?? 0)} note={`${page.earnings.payoutData && 'balance' in page.earnings.payoutData ? page.earnings.payoutData.balance.paidOut.orderCount : 0} recorded GCash transfers`} />
        <StallStatCard
          label="COD commission owed"
          value={formatPrice(cod?.totalOwed ?? 0)}
          note={overdue > 0 ? <span className="text-red-700">{formatPrice(overdue)} overdue</span> : `${formatPrice(cod?.unbilled ?? 0)} unbilled`}
          tone={overdue > 0 ? 'error' : 'default'}
        />
        <StallStatCard
          label="Stall deposit"
          value={`${formatPrice(depositPaid)} / ${formatPrice(STALL_DEPOSIT_AMOUNT)}`}
          note={deposit.pending ? 'Awaiting admin review' : depositStatus}
          tone={depositTone}
        />
        <StallStatCard
          label="Total sales"
          value={formatPrice(summary?.totalSales ?? 0)}
          note={(
            <span>
              GCash {formatPrice(summary?.gcashSales ?? 0)} · COD {formatPrice(summary?.codSales ?? 0)}
              <span className="mt-1 block text-[11px] text-stone-400">Refunds excluded</span>
            </span>
          )}
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Needs attention</h3>
            <p className="mt-1 text-sm text-stone-500">The next things to take care of.</p>
          </div>
          {attention.length > 0 ? <Tag>{attention.length}</Tag> : null}
        </div>

        {attention.length === 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--color-sage-soft)] p-4 text-sm text-[#1f4a38]">
            <CheckCircleOutlined />
            <span>You&apos;re all caught up. Nothing needs your attention right now.</span>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {attention.map((item) => {
              const Icon = attentionIcons[item.tone];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => page.setTab(item.tab)}
                  className="flex w-full items-center gap-3 rounded-xl bg-stone-50 p-3.5 text-left"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${attentionColors[item.tone]}`}>
                    <Icon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-stone-900">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">{item.detail}</span>
                  </span>
                  <RightOutlined className="text-xs text-stone-400" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-stone-900">Recent activity</h3>
          <p className="mt-1 text-sm text-stone-500">The latest sales, payouts, commission, and deposit updates.</p>
        </div>

        {activity.length === 0 ? (
          <div className="mt-4 rounded-xl bg-stone-50 p-5">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No recent activity yet." />
          </div>
        ) : (
          <div className="mt-3 space-y-1">
            {activity.map((item) => {
              const Icon = activityIcons[item.type];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => page.setTab(activityTabs[item.type])}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-stone-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                    <Icon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-stone-900">{item.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-stone-500">{item.detail}</span>
                  </span>
                  <span className="whitespace-nowrap text-[11px] text-stone-400">{formatOrderTime(item.at)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
