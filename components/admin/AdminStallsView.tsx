'use client';

import Link from 'next/link';
import { Alert, Input, Select, Skeleton, Tag } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { APP_ROUTES } from '@/constants/routes';
import { useAdminStalls } from '@/hooks/useAdminStalls';
import { formatPrice } from '@/lib/format';
import type { StallAccountRow } from '@/types/stallAccount';


type FilterKey = 'all' | 'needs' | 'deposit' | 'overdue' | 'refund';
type SortKey = 'name' | 'owedSeller' | 'owedPlatform';

export function AdminStallsView() {
  const { data, isLoading, error } = useAdminStalls();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('name');

  const rows = useMemo(() => {
    const base = data?.rows ?? [];
    let list = base.filter((row) =>
      `${row.stallName} ${row.sellerName}`.toLowerCase().includes(search.toLowerCase())
    );

    if (filter === 'needs') {
      list = list.filter(
        (row) =>
          row.needsRefundCount > 0 ||
          row.inProgressCount > 0 ||
          row.codOverdue > 0 ||
          row.depositStatus?.toLowerCase().includes('overdue') ||
          row.depositStatus?.toLowerCase().includes('unpaid') ||
          row.depositStatus?.toLowerCase().includes('partial')
      );
    } else if (filter === 'deposit') {
      list = list.filter(
        (row) =>
          row.depositStatus?.toLowerCase().includes('incomplete') ||
          row.depositStatus?.toLowerCase().includes('unpaid') ||
          row.depositStatus?.toLowerCase().includes('partial')
      );
    } else if (filter === 'overdue') {
      list = list.filter((row) => row.codOverdue > 0 || row.depositStatus?.toLowerCase().includes('overdue'));
    } else if (filter === 'refund') {
      list = list.filter((row) => row.inProgressCount > 0 || row.needsRefundCount > 0);
    }

    list = [...list].sort((a, b) => {
      if (sort === 'owedSeller') return b.gcashOwed - a.gcashOwed;
      if (sort === 'owedPlatform') return b.codOwed - a.codOwed;
      return a.stallName.localeCompare(b.stallName);
    });

    return list;
  }, [data?.rows, search, filter, sort]);

  const summary = useMemo(() => {
    const base = data?.rows ?? [];
    const owedToSellers = base.reduce((sum, row) => sum + (row.gcashOwed || 0), 0);
    const owedToPlatform = base.reduce((sum, row) => sum + (row.codOwed || 0), 0);
    const overdueCommission = base.reduce((sum, row) => sum + (row.codOverdue || 0), 0);
    const depositsHeld = base.reduce((sum, row) => sum + (row.depositPaid || 0), 0);
    let needsCount = 0;
    base.forEach((row) => {
      if (
        row.needsRefundCount > 0 ||
        row.inProgressCount > 0 ||
        row.codOverdue > 0 ||
        row.depositStatus?.toLowerCase().includes('overdue') ||
        row.depositStatus?.toLowerCase().includes('unpaid') ||
        row.depositStatus?.toLowerCase().includes('partial')
      ) {
        needsCount += 1;
      }
    });
    return { owedToSellers, owedToPlatform, overdueCommission, depositsHeld, needsCount };
  }, [data?.rows]);

  const getAttentionBadges = (row: StallAccountRow) => {
    const badges: string[] = [];
    if (row.needsRefundCount > 0) badges.push('Needs refund');
    else if (row.inProgressCount > 0) badges.push('Refund in progress');
    if (row.codOverdue > 0) badges.push('Overdue commission');
    if (row.depositStatus?.toLowerCase().includes('overdue')) badges.push('Deposit overdue');
    return badges;
  };


  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
        <Skeleton active paragraph={{ rows: 2 }} />
        <Skeleton active paragraph={{ rows: 1 }} />
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <Alert type="error" showIcon message="Stall accounts could not be loaded" description={error} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">Stall Accounts</h1>
        <p className="text-sm text-stone-500">Manage seller balances across GCash, COD, deposits, and refunds.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500">Owed to sellers (GCash)</p>
          <p className="mt-2 text-lg font-semibold text-stone-900 tabular-nums sm:text-xl">{formatPrice(summary.owedToSellers)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500">Owed to platform (COD commission)</p>
          <p className="mt-2 text-lg font-semibold text-stone-900 tabular-nums sm:text-xl">{formatPrice(summary.owedToPlatform)}</p>
          {summary.overdueCommission > 0 && (
            <p className="mt-1 text-xs text-red-600 tabular-nums">{formatPrice(summary.overdueCommission)} overdue</p>
          )}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500">Deposits held</p>
          <p className="mt-2 text-lg font-semibold text-stone-900 tabular-nums sm:text-xl">{formatPrice(summary.depositsHeld)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500">Needs attention</p>
          <p className="mt-2 text-lg font-semibold text-stone-900 tabular-nums sm:text-xl">{summary.needsCount}</p>
        </div>
      </section>

      <p className="text-sm text-stone-500">Reconciliation has moved to the <Link href={APP_ROUTES.admin} className="text-sage">admin dashboard</Link>.</p>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'needs', label: 'Needs attention' },
              { key: 'deposit', label: 'Deposit incomplete' },
              { key: 'overdue', label: 'Overdue commission' },
              { key: 'refund', label: 'Refund in progress' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key as FilterKey)}
                className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
                  filter === item.key ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input.Search
              allowClear
              placeholder="Search stall or seller"
              className="w-full sm:w-64"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              value={sort}
              onChange={(value) => setSort(value as SortKey)}
              options={[
                { value: 'name', label: 'Name' },
                { value: 'owedSeller', label: 'Owed to seller' },
                { value: 'owedPlatform', label: 'Owed to platform' },
              ]}
              className="w-full sm:w-44"
            />
          </div>
        </div>

        <div className="hidden lg:block space-y-3">
          {rows.map((row) => {
            const badges = getAttentionBadges(row);
            return (
              <Link
                key={row.stallId}
                href={APP_ROUTES.adminStallDetail(row.stallId)}
                className="group grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-6 rounded-2xl bg-white px-6 py-5 shadow-sm transition hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="font-medium text-stone-900 whitespace-nowrap truncate">{row.stallName}</p>
                  <p className="mt-1 text-xs text-stone-500 whitespace-nowrap truncate">
                    {row.sellerName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 whitespace-nowrap">We owe seller</p>
                  <p className="mt-1 text-base font-medium text-stone-900 tabular-nums whitespace-nowrap">{formatPrice(row.gcashOwed)}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 whitespace-nowrap">Owes platform</p>
                  <p className="mt-1 text-base font-medium text-stone-900 tabular-nums whitespace-nowrap">{formatPrice(row.codOwed)}</p>
                  {row.codOverdue > 0 && (
                    <p className="mt-1 text-xs text-red-600 tabular-nums whitespace-nowrap">{formatPrice(row.codOverdue)} overdue</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-stone-500 whitespace-nowrap">Deposit</p>
                  <p className="mt-1 text-base font-medium text-stone-900 tabular-nums whitespace-nowrap">
                    {formatPrice(row.depositPaid)} of {formatPrice(row.depositRequired)}
                  </p>
                  <Tag className="mt-1.5 m-0 whitespace-nowrap">{row.depositStatus || '—'}</Tag>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {badges.length === 0 ? (
                      <span className="text-xs text-stone-400 whitespace-nowrap">All clear</span>
                    ) : (
                      <>
                        {badges.slice(0, 2).map((badge) => (
                          <Tag
                            key={badge}
                            className={`m-0 whitespace-nowrap ${
                              badge === 'Needs refund' || badge === 'Overdue commission' || badge === 'Deposit overdue'
                                ? 'bg-red-50 text-red-600 border-0'
                                : 'bg-stone-100 text-stone-600 border-0'
                            }`}
                          >
                            {badge}
                          </Tag>
                        ))}
                        {badges.length > 2 && <span className="text-xs text-stone-500">+{badges.length - 2}</span>}
                      </>
                    )}
                  </div>
                  <RightOutlined className="text-stone-400" />
                </div>
              </Link>
            );
          })}
          {rows.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-sm text-stone-500">No stalls found</div>}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:hidden">
          {rows.map((row) => {
            const badges = getAttentionBadges(row);
            return (
              <Link
                key={row.stallId}
                href={APP_ROUTES.adminStallDetail(row.stallId)}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900">{row.stallName}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {row.sellerName}
                    </p>
                  </div>
                  <RightOutlined className="mt-1 text-stone-400" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-stone-500">We owe seller</p>
                    <p className="mt-1 text-sm font-medium text-stone-900 tabular-nums">{formatPrice(row.gcashOwed)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Owes platform</p>
                    <p className="mt-1 text-sm font-medium text-stone-900 tabular-nums">{formatPrice(row.codOwed)}</p>
                    {row.codOverdue > 0 && <p className="mt-1 text-xs text-red-600 tabular-nums">{formatPrice(row.codOverdue)} overdue</p>}
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Deposit</p>
                    <p className="mt-1 text-sm font-medium text-stone-900 tabular-nums">
                      {formatPrice(row.depositPaid)} of {formatPrice(row.depositRequired)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Status</p>
                    <Tag className="mt-1.5 m-0">{row.depositStatus || '—'}</Tag>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {badges.length === 0 ? (
                    <span className="text-xs text-stone-400">All clear</span>
                  ) : (
                    badges.slice(0, 2).map((badge) => (
                      <Tag
                        key={badge}
                        className={`m-0 ${
                          badge === 'Needs refund' || badge === 'Overdue commission' || badge === 'Deposit overdue'
                            ? 'bg-red-50 text-red-600 border-0'
                            : 'bg-stone-100 text-stone-600 border-0'
                        }`}
                      >
                        {badge}
                      </Tag>
                    ))
                  )}
                  {badges.length > 2 && <span className="text-xs text-stone-500">+{badges.length - 2}</span>}
                </div>
              </Link>
            );
          })}
          {rows.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-sm text-stone-500">No stalls found</div>}
        </div>
      </section>

    </div>
  );
}
