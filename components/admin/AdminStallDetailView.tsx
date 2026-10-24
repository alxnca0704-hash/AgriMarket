'use client';

import Link from 'next/link';
import { Alert, Badge, Skeleton, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { APP_ROUTES } from '@/constants/routes';
import { useAdminStallDetail } from '@/hooks/useAdminStallDetail';
import { formatPrice } from '@/lib/format';
import { useAdminStalls } from '@/hooks/useAdminStalls';

export function AdminStallDetailView({ stallId }: { stallId: string }) {
  const { data, isLoading, error } = useAdminStallDetail(stallId);
  const { data: stallsData } = useAdminStalls();

  const stallRow = (stallsData?.rows || []).find((row) => row.stallId === stallId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
        <Skeleton active paragraph={{ rows: 2 }} />
        <Skeleton active paragraph={{ rows: 1 }} />
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Alert type="error" showIcon message="Stall details could not be loaded" description={error} />
      </div>
    );
  }

  const gcashBalance = stallRow?.gcashOwed ?? 0;
  const codOwed = stallRow?.codOwed ?? 0;
  const codOverdue = stallRow?.codOverdue ?? 0;
  const depositPaid = stallRow?.depositPaid ?? 0;
  const depositRequired = stallRow?.depositRequired ?? 0;
  const depositStatus = stallRow?.depositStatus || 'unpaid';
  const refundAmount = (stallRow?.inProgressAmount ?? 0) + (stallRow?.needsRefundAmount ?? 0);

  const attentionItems = [];
  if (codOverdue > 0) attentionItems.push({ label: `Overdue commission: ${formatPrice(codOverdue)}`, href: APP_ROUTES.adminCommissions });
  if (depositStatus === 'overdue') attentionItems.push({ label: 'Deposit overdue', href: APP_ROUTES.adminDeposits });
  if (depositStatus === 'unpaid' || depositStatus === 'partial') attentionItems.push({ label: 'Deposit awaiting review', href: APP_ROUTES.adminDeposits });
  if (stallRow?.needsRefundCount && stallRow.needsRefundCount > 0) attentionItems.push({ label: 'Return needing refund', href: APP_ROUTES.adminRefunds });
  if (stallRow?.inProgressCount && stallRow.inProgressCount > 0) attentionItems.push({ label: 'Return awaiting review', href: APP_ROUTES.adminRefunds });

  const recentActivity = [
    ...((data?.orders || []).slice(0, 8).map((order) => ({
      date: order.date,
      text: `${order.paymentMethod.toUpperCase()} order ${order.orderId.slice(-6)} - ${order.status}`,
      href: APP_ROUTES.adminPayments,
    }))),
  ];

  const getDepositBadge = () => {
    if (depositStatus === 'paid') return <Tag className="m-0">Paid</Tag>;
    if (depositStatus === 'partial') return <Tag className="m-0">Partial</Tag>;
    if (depositStatus === 'overdue') return <Tag className="m-0">Overdue</Tag>;
    return <Tag className="m-0">Unpaid</Tag>;
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      <div>
        <Link href={APP_ROUTES.adminStalls} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700">
          <ArrowLeftOutlined />
          Stall Accounts
        </Link>
      </div>

      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">{data?.stallName ?? 'Stall details'}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <span>{stallRow?.sellerName ?? 'Seller'}</span>
          <span>·</span>
          <Tag className="m-0">{stallRow?.verificationStatus ?? '—'}</Tag>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500">GCash balance</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900 tabular-nums sm:text-[26px]">{formatPrice(gcashBalance)}</p>
          <Link href={APP_ROUTES.adminPayouts} className="mt-4 inline-block text-sm text-stone-600 hover:text-stone-900">
            View records
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500">COD commission owed</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900 tabular-nums sm:text-[26px]">{formatPrice(codOwed)}</p>
          {codOverdue > 0 && <p className="mt-1 text-xs text-red-600 tabular-nums">{formatPrice(codOverdue)} overdue</p>}
          <Link href={APP_ROUTES.adminCommissions} className="mt-4 inline-block text-sm text-stone-600 hover:text-stone-900">
            View records
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500">Deposit</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900 tabular-nums sm:text-[26px]">
            {formatPrice(depositPaid)} of {formatPrice(depositRequired)}
          </p>
          <div className="mt-1.5">{getDepositBadge()}</div>
          <Link href={APP_ROUTES.adminDeposits} className="mt-4 inline-block text-sm text-stone-600 hover:text-stone-900">
            View records
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500">Refunds</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900 tabular-nums sm:text-[26px]">
            {refundAmount > 0 ? formatPrice(refundAmount) : <span className="text-stone-400">None</span>}
          </p>
          <Link href={APP_ROUTES.adminRefunds} className="mt-4 inline-block text-sm text-stone-600 hover:text-stone-900">
            View records
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-900">Needs attention</h2>
          </div>
          {attentionItems.length === 0 ? (
            <p className="mt-4 text-sm text-stone-400">All clear</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {attentionItems.slice(0, 5).map((item, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span className="text-sm text-stone-700">{item.label}</span>
                  <Link href={item.href} className="text-sm text-stone-500 hover:text-stone-700">
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-900">Recent activity</h2>
            <Link href={APP_ROUTES.adminPayments} className="text-sm text-stone-500 hover:text-stone-700">
              View all
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="mt-4 text-sm text-stone-400">No activity yet</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentActivity.map((item, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span className="text-sm text-stone-700">{item.text}</span>
                  <span className="text-xs text-stone-400">{item.date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>


    </div>
  );
}
