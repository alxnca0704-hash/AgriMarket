'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Modal,
  Skeleton,
  Table,
  Tabs,
  Tag,
} from 'antd';
import type { MenuProps, TableProps } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  COD_FINANCE_STATUS_COLORS,
  COD_FINANCE_STATUS_LABELS,
  GCASH_COMMISSION_STATUS_LABELS,
  GCASH_PAYOUT_STATUS_COLORS,
  GCASH_PAYOUT_STATUS_LABELS,
} from '@/constants/finance';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TAG_COLORS } from '@/constants/orders';
import { useAdminFinance } from '@/hooks/useAdminFinance';
import { formatOrderTime, formatPrice } from '@/lib/format';
import type {
  CodFinanceRecord,
  CodFinanceSection,
  CommissionFinanceSection,
  GcashFinanceRecord,
  GcashFinanceSection,
  StallFinanceRow,
} from '@/types/finance';

const { RangePicker } = DatePicker;

type DetailSection = 'cod' | 'gcash' | 'commission' | null;

function Metric({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <article className="rounded-xl bg-stone-50 p-3.5">
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`mt-1.5 text-lg font-semibold ${tone ?? 'text-stone-900'}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-stone-400">{hint}</p> : null}
    </article>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  onView,
  onExport,
  viewLabel = 'Included records',
}: {
  eyebrow: string;
  title: string;
  description: string;
  onView: () => void;
  onExport: () => void;
  viewLabel?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold text-stone-900">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm text-stone-500">{description}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button size="small" onClick={onView}>{viewLabel}</Button>
        <Button size="small" icon={<DownloadOutlined />} onClick={onExport}>CSV</Button>
      </div>
    </div>
  );
}

export function AdminFinanceView() {
  const finance = useAdminFinance();
  const [detail, setDetail] = useState<DetailSection>(null);

  if (finance.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6">
        <Skeleton active paragraph={{ rows: 3 }} />
        <Skeleton active paragraph={{ rows: 5 }} />
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    );
  }

  if (finance.error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Alert
          type="error"
          showIcon
          title="Finance could not be loaded"
          description={finance.error}
          action={<Button size="small" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>Retry</Button>}
        />
      </div>
    );
  }

  const cod: CodFinanceSection | undefined = finance.cod;
  const gcash: GcashFinanceSection | undefined = finance.gcash;
  const commission: CommissionFinanceSection | undefined = finance.commission;
  if (!cod || !gcash || !commission) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Empty description="No finance data is available for this period." />
      </div>
    );
  }

  const stalls = finance.stalls ?? [];
  const codRecords = finance.codRecords ?? [];
  const gcashRecords = finance.gcashRecords ?? [];
  const reconciliations = finance.reconciliations ?? [];
  const gcashCommissionRecords = gcashRecords.filter(row => row.commissionStatus !== 'none');
  const collectedCodRecords = codRecords.filter(row => row.amountPaid > 0);
  const actual = Number(finance.actualBalance);
  const difference = finance.actualBalance.trim() && Number.isFinite(actual) ? actual - gcash.expectedBalance : null;
  const stall = finance.stallDetail instanceof Error ? undefined : finance.stallDetail;

  const exportItems: MenuProps['items'] = [
    { key: 'cod', label: 'COD commissions CSV' },
    { key: 'gcash', label: 'GCash finance CSV' },
    { key: 'commission', label: 'Platform commissions CSV' },
    { key: 'stalls', label: 'Per-stall CSV' },
    { key: 'reconciliations', label: 'Reconciliations CSV' },
  ];

  const codColumns: TableProps<CodFinanceRecord>['columns'] = [
    { title: 'Order', dataIndex: 'orderId', render: (value: string) => <span className="font-mono">#{value.slice(-6).toUpperCase()}</span> },
    { title: 'Stall', dataIndex: 'stallName' },
    { title: 'Sale date', dataIndex: 'saleDate', render: (value: string) => formatOrderTime(value) },
    { title: 'Commission', dataIndex: 'commission', render: (value: number) => formatPrice(value) },
    { title: 'Paid', dataIndex: 'amountPaid', render: (value: number) => formatPrice(value) },
    { title: 'Owed', dataIndex: 'amountOwed', render: (value: number) => formatPrice(value) },
    { title: 'Status', dataIndex: 'status', render: (value: CodFinanceRecord['status']) => <Tag color={COD_FINANCE_STATUS_COLORS[value]}>{COD_FINANCE_STATUS_LABELS[value]}</Tag> },
    { title: 'Invoice', dataIndex: 'invoiceNumber', render: (value: string | null) => value ? `#${value.slice(-7).toUpperCase()}` : '—' },
  ];

  const gcashColumns: TableProps<GcashFinanceRecord>['columns'] = [
    { title: 'Order', dataIndex: 'orderId', render: (value: string) => <span className="font-mono">#{value.slice(-6).toUpperCase()}</span> },
    { title: 'Stall', dataIndex: 'stallName' },
    { title: 'Date', dataIndex: 'date', render: (value: string) => formatOrderTime(value) },
    { title: 'Order total', dataIndex: 'orderTotal', render: (value: number) => formatPrice(value) },
    { title: 'Net payout', dataIndex: 'netPayout', render: (value: number) => formatPrice(value) },
    { title: 'Commission', dataIndex: 'commission', render: (value: number) => formatPrice(value) },
    { title: 'Payout', dataIndex: 'payoutStatus', render: (value: GcashFinanceRecord['payoutStatus']) => <Tag color={GCASH_PAYOUT_STATUS_COLORS[value]}>{GCASH_PAYOUT_STATUS_LABELS[value]}</Tag> },
    { title: 'Reference', dataIndex: 'payoutReference', render: (value: string | null) => value ?? '—' },
  ];

  const stallColumns: TableProps<StallFinanceRow>['columns'] = [
    { title: 'Stall', dataIndex: 'stallName', ellipsis: true },
    {
      title: 'COD commission owed',
      children: [
        { title: 'Total', dataIndex: 'codOwed', render: (value: number) => formatPrice(value) },
        { title: 'Overdue', dataIndex: 'codOverdue', render: (value: number) => <span className={value > 0 ? 'text-red-600' : undefined}>{formatPrice(value)}</span> },
      ],
    },
    {
      title: 'GCash held',
      children: [
        { title: 'Owed to seller', dataIndex: 'gcashOwedToSeller', render: (value: number) => formatPrice(value) },
        { title: 'Paid out', dataIndex: 'gcashPaidOut', render: (value: number) => formatPrice(value) },
      ],
    },
    {
      title: 'Platform commission collected',
      children: [
        { title: 'GCash', dataIndex: 'gcashCommissionCollected', render: (value: number) => formatPrice(value) },
        { title: 'COD', dataIndex: 'codCommissionCollected', render: (value: number) => formatPrice(value) },
        { title: 'Total', dataIndex: 'totalCommission', render: (value: number) => <span className="font-semibold">{formatPrice(value)}</span> },
      ],
    },
    { title: '', render: (_, row) => <Button type="link" size="small" onClick={() => finance.openStall(row)}>Records</Button> },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">Platform ledger</p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">Finance</h1>
          <p className="mt-1 max-w-3xl text-sm text-stone-500">
            COD commission receivables, GCash funds held for sellers, and platform commission earned — derived from orders, payments, and payout records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dropdown menu={{ items: exportItems, onClick: ({ key }) => finance.exportCsv(key as 'cod' | 'gcash' | 'commission' | 'stalls' | 'reconciliations') }} trigger={['click']}>
            <Button icon={<DownloadOutlined />}>Export</Button>
          </Dropdown>
          <Button type="primary" onClick={finance.openReconciliation}>Reconcile GCash</Button>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-700">Reporting period</p>
          <p className="mt-0.5 text-xs text-stone-500">All sections and per-stall totals use the selected finance dates. Leave empty for all time.</p>
        </div>
        <RangePicker
          className="w-full sm:w-auto"
          value={finance.range[0] ? [dayjs(finance.range[0]), dayjs(finance.range[1])] : null}
          onChange={dates => finance.setRange(dates ? [dates[0]?.startOf('day').toISOString() ?? null, dates[1]?.endOf('day').toISOString() ?? null] : [null, null])}
        />
        {finance.range[0] ? <Button onClick={() => finance.setRange([null, null])}>Clear</Button> : null}
      </section>

      <section className="rounded-2xl bg-white p-4 sm:p-5">
        <SectionHeader
          eyebrow="Section A"
          title="COD commission owed to platform"
          description="Commission accrued from cash-on-delivery orders, grouped by receivable status. Total owed excludes collected and waived amounts."
          onView={() => setDetail('cod')}
          onExport={() => finance.exportCsv('cod')}
          viewLabel="View COD records"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="Unbilled" value={formatPrice(cod.unbilled)} hint={`${cod.orderCount} COD orders`} />
          <Metric label="Invoiced" value={formatPrice(cod.invoiced)} />
          <Metric label="Overdue" value={formatPrice(cod.overdue)} tone="text-red-600" />
          <Metric label="Total owed" value={formatPrice(cod.totalOwed)} tone="text-amber-700" hint="Unbilled + invoiced + overdue" />
          <Metric label="Collected" value={formatPrice(cod.collected)} tone="text-[#2D6A4F]" />
          <Metric label="Waived" value={formatPrice(cod.waived)} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 sm:p-5">
        <SectionHeader
          eyebrow="Section B"
          title="GCash held for stalls"
          description="Money received on the platform's GCash account. Expected balance is what should remain after completed seller payouts, refunds, and collected GCash commission."
          onView={() => setDetail('gcash')}
          onExport={() => finance.exportCsv('gcash')}
          viewLabel="View GCash records"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <Metric label="Total received" value={formatPrice(gcash.totalReceived)} />
          <Metric label="In return window" value={formatPrice(gcash.inReturnWindow)} hint="Not yet eligible for payout" />
          <Metric label="Payout ready" value={formatPrice(gcash.payoutReady)} tone="text-[#2D6A4F]" />
          <Metric label="Payout requested" value={formatPrice(gcash.payoutRequested)} tone="text-amber-700" />
          <Metric label="Paid out" value={formatPrice(gcash.paidOut)} />
          <Metric label="On hold" value={formatPrice(gcash.onHold)} tone="text-amber-700" hint="Returns and refund review" />
          <Metric label="Refunded" value={formatPrice(gcash.refunded)} tone="text-red-600" />
          <Metric label="Needs refund" value={formatPrice(gcash.needsRefund)} tone="text-red-600" hint="Paid orders cancelled before refund" />
          <Metric label="Owed to sellers" value={formatPrice(gcash.owedToSellers)} tone="text-[#2D6A4F]" hint="Completed orders not yet paid out" />
          <Metric label="Commission kept" value={formatPrice(gcash.commissionKept)} />
          <Metric label="Expected GCash balance" value={formatPrice(gcash.expectedBalance)} tone="text-stone-900" hint="Received − paid out − refunded − commission" />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 sm:p-5">
        <SectionHeader
          eyebrow="Section C"
          title="Platform commission earned"
          description="Commission actually collected from GCash and COD orders. Expected additional is still pending or owed, not yet earned."
          onView={() => setDetail('commission')}
          onExport={() => finance.exportCsv('commission')}
          viewLabel="View commission records"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <Metric label="GCash pending" value={formatPrice(commission.gcashPending)} />
          <Metric label="GCash collected" value={formatPrice(commission.gcashCollected)} tone="text-[#2D6A4F]" />
          <Metric label="GCash reversed" value={formatPrice(commission.gcashReversed)} tone="text-red-600" />
          <Metric label="COD collected" value={formatPrice(commission.codCollected)} tone="text-[#2D6A4F]" />
          <Metric label="Total earned" value={formatPrice(commission.totalEarned)} tone="text-[#2D6A4F]" hint="GCash + COD collected" />
          <Metric label="Expected additional" value={formatPrice(commission.expectedAdditional)} tone="text-amber-700" hint="GCash pending + COD owed" />
          <Metric label="Collected today" value={formatPrice(commission.collectedToday)} />
          <Metric label="This week" value={formatPrice(commission.collectedThisWeek)} />
          <Metric label="This month" value={formatPrice(commission.collectedThisMonth)} />
          <Metric label="All time" value={formatPrice(commission.collectedAllTime)} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">Per stall</p>
            <h2 className="mt-1 text-lg font-semibold text-stone-900">Stall finance summary</h2>
            <p className="mt-1 text-sm text-stone-500">COD commission owed, GCash owed to the seller, and commission collected for every stall in the period.</p>
          </div>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => finance.exportCsv('stalls')}>Export CSV</Button>
        </div>
        {stalls.length === 0 ? <Empty description="No stall finance activity in this period." /> : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table rowKey="stallId" size="middle" dataSource={stalls} columns={stallColumns} pagination={false} onRow={row => ({ onClick: () => finance.openStall(row), className: 'cursor-pointer' })} />
            </div>
            <div className="space-y-3 md:hidden">
              {stalls.map(row => (
                <article key={row.stallId} className="rounded-xl bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-stone-900">{row.stallName}</p>
                    <Button type="link" size="small" onClick={() => finance.openStall(row)}>Records</Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-stone-500">COD owed</p><p className="font-medium">{formatPrice(row.codOwed)}</p></div>
                    <div><p className="text-xs text-stone-500">COD overdue</p><p className={`font-medium ${row.codOverdue > 0 ? 'text-red-600' : ''}`}>{formatPrice(row.codOverdue)}</p></div>
                    <div><p className="text-xs text-stone-500">GCash owed to seller</p><p className="font-medium">{formatPrice(row.gcashOwedToSeller)}</p></div>
                    <div><p className="text-xs text-stone-500">GCash paid out</p><p className="font-medium">{formatPrice(row.gcashPaidOut)}</p></div>
                    <div><p className="text-xs text-stone-500">GCash commission</p><p className="font-medium">{formatPrice(row.gcashCommissionCollected)}</p></div>
                    <div><p className="text-xs text-stone-500">COD commission</p><p className="font-medium">{formatPrice(row.codCommissionCollected)}</p></div>
                    <div className="col-span-2"><p className="text-xs text-stone-500">Total commission</p><p className="font-semibold text-stone-900">{formatPrice(row.totalCommission)}</p></div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">Balance check</p>
            <h2 className="mt-1 text-lg font-semibold text-stone-900">GCash reconciliations</h2>
            <p className="mt-1 text-sm text-stone-500">Record the actual GCash balance for the selected period. Each entry is appended; history is never edited.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="small" icon={<DownloadOutlined />} onClick={() => finance.exportCsv('reconciliations')}>Export CSV</Button>
            <Button size="small" type="primary" onClick={finance.openReconciliation}>Reconcile GCash</Button>
          </div>
        </div>
        <div className="mb-4 rounded-xl bg-stone-50 p-4">
          <p className="text-xs text-stone-500">Expected GCash balance for the selected period</p>
          <p className="mt-1 text-xl font-semibold text-stone-900">{formatPrice(gcash.expectedBalance)}</p>
        </div>
        {reconciliations.length === 0 ? <Empty description="No reconciliations recorded yet." /> : (
          <div className="space-y-3">
            {reconciliations.map(entry => (
              <article key={entry._id} className="rounded-xl bg-stone-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{formatOrderTime(entry.createdAt)}</p>
                    <p className="text-xs text-stone-500">{entry.adminEmail}</p>
                  </div>
                  <p className={`text-sm font-semibold ${entry.difference === 0 ? 'text-[#2D6A4F]' : 'text-red-600'}`}>
                    {entry.difference > 0 ? '+' : ''}{formatPrice(entry.difference)}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><p className="text-xs text-stone-500">Actual</p><p className="font-medium">{formatPrice(entry.actualBalance)}</p></div>
                  <div><p className="text-xs text-stone-500">Expected</p><p className="font-medium">{formatPrice(entry.expectedBalance)}</p></div>
                  <div><p className="text-xs text-stone-500">From</p><p className="font-medium">{entry.from ? formatOrderTime(entry.from) : 'All time'}</p></div>
                  <div><p className="text-xs text-stone-500">To</p><p className="font-medium">{entry.to ? formatOrderTime(entry.to) : 'All time'}</p></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Drawer
        title="COD commission records"
        open={detail === 'cod'}
        onClose={() => setDetail(null)}
        size="min(96vw, 1080px)"
      >
        {codRecords.length === 0 ? <Empty description="No COD commission records in this period." /> : (
          <div className="overflow-x-auto">
            <Table rowKey="orderId" size="small" dataSource={codRecords} columns={codColumns} pagination={{ pageSize: 15, showSizeChanger: false }} />
          </div>
        )}
      </Drawer>

      <Drawer
        title="GCash finance records"
        open={detail === 'gcash'}
        onClose={() => setDetail(null)}
        size="min(96vw, 1080px)"
      >
        {gcashRecords.length === 0 ? <Empty description="No GCash orders in this period." /> : (
          <div className="overflow-x-auto">
            <Table rowKey="orderId" size="small" dataSource={gcashRecords} columns={gcashColumns} pagination={{ pageSize: 15, showSizeChanger: false }} />
          </div>
        )}
      </Drawer>

      <Drawer
        title="Platform commission records"
        open={detail === 'commission'}
        onClose={() => setDetail(null)}
        size="min(96vw, 1080px)"
      >
        <Tabs
          items={[
            {
              key: 'gcash',
              label: `GCash commission (${gcashCommissionRecords.length})`,
              children: gcashCommissionRecords.length === 0 ? <Empty description="No GCash commission records in this period." /> : (
                <div className="overflow-x-auto">
                  <Table
                    rowKey="orderId"
                    size="small"
                    dataSource={gcashCommissionRecords}
                    pagination={{ pageSize: 15, showSizeChanger: false }}
                    columns={[
                      { title: 'Order', dataIndex: 'orderId', render: (value: string) => <span className="font-mono">#{value.slice(-6).toUpperCase()}</span> },
                      { title: 'Stall', dataIndex: 'stallName' },
                      { title: 'Date', dataIndex: 'date', render: (value: string) => formatOrderTime(value) },
                      { title: 'Commission', dataIndex: 'commission', render: (value: number) => formatPrice(value) },
                      { title: 'Status', dataIndex: 'commissionStatus', render: (value: GcashFinanceRecord['commissionStatus']) => <Tag>{GCASH_COMMISSION_STATUS_LABELS[value]}</Tag> },
                      { title: 'Collected at', dataIndex: 'commissionCollectedAt', render: (value: string | null) => value ? formatOrderTime(value) : '—' },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'cod',
              label: `COD commission collected (${collectedCodRecords.length})`,
              children: collectedCodRecords.length === 0 ? <Empty description="No COD commission collected in this period." /> : (
                <div className="overflow-x-auto">
                  <Table
                    rowKey="orderId"
                    size="small"
                    dataSource={collectedCodRecords}
                    pagination={{ pageSize: 15, showSizeChanger: false }}
                    columns={[
                      { title: 'Order', dataIndex: 'orderId', render: (value: string) => <span className="font-mono">#{value.slice(-6).toUpperCase()}</span> },
                      { title: 'Stall', dataIndex: 'stallName' },
                      { title: 'Sale date', dataIndex: 'saleDate', render: (value: string) => formatOrderTime(value) },
                      { title: 'Commission', dataIndex: 'commission', render: (value: number) => formatPrice(value) },
                      { title: 'Paid', dataIndex: 'amountPaid', render: (value: number) => formatPrice(value) },
                      { title: 'Paid at', dataIndex: 'paidAt', render: (value: string | null) => value ? formatOrderTime(value) : '—' },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </Drawer>

      <Drawer
        title={finance.selectedStall ? `${finance.selectedStall.name} finance records` : 'Stall finance records'}
        open={finance.selectedStall !== null}
        onClose={finance.closeStall}
        size="min(96vw, 720px)"
      >
        {finance.stallLoading ? <Skeleton active paragraph={{ rows: 6 }} /> : null}
        {finance.stallError ? <Alert type="error" showIcon title="Stall records could not be loaded" description={finance.stallError} /> : null}
        {!finance.stallLoading && !finance.stallError && stall ? (
          stall.orders.length === 0 ? <Empty description="No orders for this stall in the selected period." /> : (
            <div className="space-y-3">
              {stall.orders.map(order => (
                <article key={order.orderId} className="rounded-xl bg-stone-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-semibold text-stone-900">#{order.orderId.slice(-6).toUpperCase()}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{formatOrderTime(order.date)}</p>
                    </div>
                    <Tag color={ORDER_STATUS_TAG_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Tag>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div><p className="text-xs text-stone-500">Payment</p><p className="font-medium uppercase">{order.paymentMethod}</p></div>
                    <div><p className="text-xs text-stone-500">Items subtotal</p><p className="font-medium">{formatPrice(order.itemsSubtotal)}</p></div>
                    <div><p className="text-xs text-stone-500">Delivery fee</p><p className="font-medium">{formatPrice(order.deliveryFee)}</p></div>
                    <div><p className="text-xs text-stone-500">Commission</p><p className="font-medium">{formatPrice(order.commission)}</p></div>
                  </div>
                  <p className="mt-3 text-xs text-stone-500">
                    {order.paymentMethod === 'cod'
                      ? `Invoice: ${order.invoiceNumber ? `#${order.invoiceNumber.slice(-7).toUpperCase()}` : 'Not invoiced yet'}`
                      : `Payout reference: ${order.payoutReference ?? 'Not paid out'}`}
                  </p>
                </article>
              ))}
            </div>
          )
        ) : null}
      </Drawer>

      <Modal
        title="Reconcile GCash balance"
        open={finance.reconciliationOpen}
        onCancel={finance.closeReconciliation}
        onOk={() => void finance.submitReconciliation()}
        confirmLoading={finance.isReconciliationPending}
        okText="Save reconciliation"
        width="min(92vw, 520px)"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-stone-500">
            Enter the actual GCash balance for the selected period. The expected balance is derived from the same orders, payouts, refunds, and commission records.
          </p>
          <div className="rounded-xl bg-stone-50 p-4 text-sm">
            <div className="flex items-center justify-between gap-3"><span className="text-stone-500">Expected balance</span><span className="font-semibold text-stone-900">{formatPrice(gcash.expectedBalance)}</span></div>
            <div className="mt-2 flex items-center justify-between gap-3"><span className="text-stone-500">Difference</span><span className={`font-semibold ${difference === null || difference === 0 ? 'text-stone-900' : 'text-red-600'}`}>{difference === null ? '—' : `${difference > 0 ? '+' : ''}${formatPrice(difference)}`}</span></div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Actual GCash balance</span>
            <Input
              value={finance.actualBalance}
              onChange={event => finance.setActualBalance(event.target.value)}
              inputMode="decimal"
              prefix="₱"
              placeholder="0.00"
              size="large"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
