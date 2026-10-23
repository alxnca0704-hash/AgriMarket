'use client';

import { useState } from 'react';
import { Alert, Button, DatePicker, Drawer, Empty, Input, Select, Skeleton, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { COMMISSION_RECEIVABLE_STATUS_OPTIONS, RECEIVABLES_PAGE_SIZE } from '@/constants/commissions';
import { formatOrderTime, formatPrice } from '@/lib/format';
import type { CommissionReceivable } from '@/types/commissionReceivable';
import { useCommissionReceivables } from '@/hooks/useCommissionReceivables';

const { RangePicker } = DatePicker;
interface CommissionReceivablesPanelProps { isAdmin: boolean }

export function CommissionReceivablesPanel({ isAdmin }: CommissionReceivablesPanelProps) {
  const ledger = useCommissionReceivables(isAdmin);
  const [selected, setSelected] = useState<CommissionReceivable | null>(null);
  if (ledger.isLoading) return <div className="space-y-5"><Skeleton active paragraph={{ rows: 5 }} /></div>;
  if (ledger.error) return <Alert type="error" showIcon title="Commission receivables could not be loaded" description={ledger.error} />;
  const summary = ledger.summary;
  const cards = isAdmin
    ? [['Total owed', summary?.totalOwed ?? 0], ['Unbilled', summary?.unbilled ?? 0], ['Invoiced', summary?.invoiced ?? 0], ['Overdue', summary?.overdue ?? 0], ['Collected today', summary?.collectedToday ?? 0], ['This week', summary?.collectedThisWeek ?? 0], ['This month', summary?.collectedThisMonth ?? 0], ['Waived', summary?.waived ?? 0]] as const
    : [['Unbilled', summary?.unbilled ?? 0], ['Invoiced', summary?.invoiced ?? 0], ['Overdue', summary?.overdue ?? 0], ['Paid', summary?.paid ?? 0], ['Waived', summary?.waived ?? 0]] as const;
  const columns: TableProps<CommissionReceivable>['columns'] = [
    { title: 'Order', dataIndex: 'orderId', render: (id: string) => <span className="font-mono">#{id.slice(-6).toUpperCase()}</span> },
    { title: 'Sale date', dataIndex: 'saleDate', render: (value: string) => formatOrderTime(value) },
    { title: 'Order items', dataIndex: 'itemsSummary', ellipsis: true },
    { title: 'Items subtotal', dataIndex: 'itemsSubtotal', render: (value: number) => formatPrice(value) },
    { title: 'Commission', dataIndex: 'commission', render: (value: number) => formatPrice(value) },
    { title: 'Invoice', dataIndex: 'invoiceNumber', render: (invoice: string | null, row) => invoice ? <Button type="link" onClick={(event) => { event.stopPropagation(); setSelected(row); }}>#{invoice.slice(-7).toUpperCase()}</Button> : '—' },
    { title: 'Status', dataIndex: 'status', render: (value: CommissionReceivable['status']) => <Tag color={value === 'paid' ? 'success' : value === 'overdue' ? 'error' : value === 'waived' ? 'default' : value === 'invoiced' ? 'processing' : 'warning'}>{value}</Tag> },
    { title: 'Payment reference', dataIndex: 'paymentReference', render: (reference: string | null, row) => reference && row.paymentId ? <Button type="link" onClick={(event) => { event.stopPropagation(); setSelected(row); }}>{reference}</Button> : '—' },
    { title: 'Paid date', dataIndex: 'paidAt', render: (value: string | null) => value ? formatOrderTime(value) : '—' },
  ];
  return <div className="space-y-6">
    <section className={`grid grid-cols-2 gap-3 ${isAdmin ? 'sm:grid-cols-4 xl:grid-cols-8' : 'sm:grid-cols-3 lg:grid-cols-5'}`}>
      {cards.map(([title, amount]) => <article key={title} className="rounded-xl bg-white p-4"><p className="text-xs text-stone-500">{title}</p><p className="mt-2 text-base font-semibold text-stone-900">{formatPrice(amount)}</p></article>)}
    </section>
    {isAdmin && <section className="space-y-3 rounded-2xl bg-white p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-stone-900">Receivables by stall</h2>{ledger.stallId && <Button type="link" onClick={() => ledger.setStallId(null)}>Show all stalls</Button>}</div><div className="overflow-x-auto"><Table rowKey="stallId" size="small" pagination={false} dataSource={ledger.stalls ?? []} columns={[
      { title: 'Stall', dataIndex: 'stallName', sorter: (a, b) => a.stallName.localeCompare(b.stallName) },
      { title: 'Unbilled', dataIndex: 'unbilled', sorter: (a, b) => a.unbilled - b.unbilled, render: (value: number) => formatPrice(value) },
      { title: 'Invoiced', dataIndex: 'invoiced', sorter: (a, b) => a.invoiced - b.invoiced, render: (value: number) => formatPrice(value) },
      { title: 'Overdue', dataIndex: 'overdue', sorter: (a, b) => a.overdue - b.overdue, render: (value: number) => formatPrice(value) },
      { title: 'Collected', dataIndex: 'collected', sorter: (a, b) => a.collected - b.collected, render: (value: number) => formatPrice(value) },
      { title: 'Total owed', dataIndex: 'totalOwed', sorter: (a, b) => a.totalOwed - b.totalOwed, render: (value: number) => formatPrice(value) },
      { title: 'Oldest overdue', dataIndex: 'oldestOverdueAt', sorter: (a, b) => (a.oldestOverdueAt ?? '').localeCompare(b.oldestOverdueAt ?? ''), render: (value: string | null) => value ? formatOrderTime(value) : '—' },
      { title: '', render: (_, stall) => <Button type="link" onClick={() => ledger.setStallId(stall.stallId)}>View accruals</Button> },
    ]} /></div></section>}
    <section className="space-y-4 rounded-2xl bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-stone-900">{isAdmin ? 'Accrual records' : 'Your accrual records'}</h2><Button icon={<DownloadOutlined />} onClick={() => void ledger.exportCsv()}>Export CSV</Button></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><Input.Search allowClear placeholder="Search order ID or invoice number" value={ledger.search} onChange={event => ledger.setSearch(event.target.value)} /><Select value={ledger.status} onChange={ledger.setStatus} options={[{ value: 'all', label: 'All statuses' }, ...COMMISSION_RECEIVABLE_STATUS_OPTIONS]} /><RangePicker className="w-full" value={ledger.range[0] ? [dayjs(ledger.range[0]), dayjs(ledger.range[1])] : null} onChange={dates => ledger.setRange(dates ? [dates[0]?.startOf('day').toISOString() ?? null, dates[1]?.endOf('day').toISOString() ?? null] : [null, null])} />{isAdmin && <Select allowClear showSearch optionFilterProp="label" placeholder="All stalls" value={ledger.stallId ?? undefined} onChange={value => ledger.setStallId(value ?? null)} options={(ledger.stalls ?? []).map(stall => ({ value: stall.stallId, label: stall.stallName }))} />}</div>
      {ledger.records?.length ? <div className="overflow-x-auto"><Table<CommissionReceivable> rowKey="accrualId" size="middle" dataSource={ledger.records} columns={columns} onRow={record => ({ onClick: () => setSelected(record), className: 'cursor-pointer' })} pagination={{ current: ledger.page, pageSize: RECEIVABLES_PAGE_SIZE, total: ledger.total, onChange: ledger.setPage, showSizeChanger: false }} /></div> : <Empty description="No commission accruals match these filters." />}
    </section>
    <Drawer title="Commission receivable details" open={Boolean(selected)} onClose={() => setSelected(null)} size="min(92vw, 600px)">{selected && <div className="space-y-4 text-sm">
      <div className="rounded-xl bg-stone-50 p-4"><p className="font-mono font-semibold">Order #{selected.orderId.slice(-6).toUpperCase()}</p><p className="mt-2">Sale date: {formatOrderTime(selected.saleDate)}</p><p>{selected.itemsSummary}</p><p>Order items subtotal: {formatPrice(selected.itemsSubtotal)}</p><p>Commission: {formatPrice(selected.commission)}</p><p>Status: <Tag>{selected.status}</Tag></p>{selected.invoiceId && <a href={`#invoice-${selected.invoiceId}`} className="mr-4 font-medium text-sage">Invoice #{selected.invoiceId.slice(-7).toUpperCase()}</a>}{selected.paymentId && <a href={`#payment-${selected.paymentId}`} className="font-medium text-sage">Approved payment record</a>}</div>
      {selected.invoiceId && <section id={`invoice-${selected.invoiceId}`} className="rounded-xl bg-stone-50 p-4"><h3 className="font-semibold">Invoice record</h3><p className="mt-2 font-mono">{selected.invoiceNumber}</p><p>Amount: {formatPrice(selected.invoiceAmount ?? 0)}</p><p>Paid: {formatPrice(selected.invoicePaidAmount ?? 0)}</p><p>Due: {selected.invoiceDueAt ? formatOrderTime(new Date(selected.invoiceDueAt).toISOString()) : '—'}</p><p>Accrual status: {selected.status}</p></section>}
      {selected.paymentId && <section id={`payment-${selected.paymentId}`} className="rounded-xl bg-stone-50 p-4"><h3 className="font-semibold">Approved payment record</h3><p className="mt-2 font-mono">{selected.paymentId}</p><p>Reference: {selected.paymentReference}</p><p>Approved amount: {formatPrice(selected.paymentAmount ?? 0)}</p><p>Reviewed: {selected.paidAt ? formatOrderTime(selected.paidAt) : '—'}</p></section>}
    </div>}</Drawer>
  </div>;
}
