'use client';

import { Alert, Button, DatePicker, Drawer, Empty, Input, Select, Skeleton, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { SALE_STATUS_OPTIONS, SALES_PAGE_SIZE } from '@/constants/sales';
import { formatOrderTime, formatPrice } from '@/lib/format';
import type { SaleRecord } from '@/types/sales';
import { useSalesPage } from '@/hooks/useSalesPage';

const { RangePicker } = DatePicker;
interface SalesViewProps { isAdmin: boolean }

export function SalesView({ isAdmin }: SalesViewProps) {
  const sales = useSalesPage(isAdmin);
  if (sales.isLoading) return <div className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6"><Skeleton active paragraph={{ rows: 7 }} /></div>;
  if (sales.error) return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Alert type="error" showIcon title="Sales could not be loaded" description={sales.error} /></div>;
  const summary = sales.summary;
  const cards = [
    ['Total sales', formatPrice(summary?.totalSales ?? 0)], ['GCash sales', formatPrice(summary?.gcashSales ?? 0)],
    ['COD sales', formatPrice(summary?.codSales ?? 0)], ['Orders', String(summary?.orderCount ?? 0)],
    ['COD commission owed', formatPrice(summary?.codCommissionOwed ?? 0)], ['GCash commission', formatPrice(summary?.gcashCommission ?? 0)],
    ['Total commission', formatPrice(summary?.totalCommission ?? 0)],
  ];
  const columns: TableProps<SaleRecord>['columns'] = [
    { title: 'Completed', dataIndex: 'completedAt', render: (value: string) => formatOrderTime(value) },
    { title: 'Order', dataIndex: 'orderId', render: (value: string) => <span className="font-mono">#{value.slice(-6).toUpperCase()}</span> },
    { title: 'Buyer', dataIndex: 'buyerName' }, { title: 'Stall', dataIndex: 'stallName' },
    { title: 'Items', dataIndex: 'itemSummary', ellipsis: true },
    { title: 'Subtotal', dataIndex: 'itemsSubtotal', render: (value: number) => formatPrice(value) },
    { title: 'Delivery', dataIndex: 'deliveryFee', render: (value: number) => formatPrice(value) },
    { title: 'Total', dataIndex: 'orderTotal', render: (value: number) => formatPrice(value) },
    { title: 'Payment', dataIndex: 'paymentMethod', render: (value: SaleRecord['paymentMethod']) => value.toUpperCase() },
    { title: 'Status', dataIndex: 'saleStatus', render: (value: SaleRecord['saleStatus']) => <Tag color={value === 'refunded' ? 'default' : value === 'refund-requested' ? 'warning' : 'success'}>{value}</Tag> },
    { title: 'Commission', dataIndex: 'commissionAmount', render: (value: number | null) => value === null ? 'n/a' : formatPrice(value) },
    { title: 'Commission status', dataIndex: 'commissionStatus', render: (value: SaleRecord['commissionStatus']) => <Tag>{value}</Tag> },
    { title: 'Invoice', dataIndex: 'invoiceNumber', render: (value: string | null) => value ? `#${value.slice(-7).toUpperCase()}` : '—' },
  ];
  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{isAdmin ? 'Platform' : 'Seller'} records</p><h1 className="mt-1 text-2xl font-semibold text-stone-900">Sales</h1><p className="mt-1 text-sm text-stone-500">Completed orders, derived from their checkout snapshots.</p></div><Button icon={<DownloadOutlined />} onClick={() => void sales.exportCsv()}>Export CSV</Button></header>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9">{cards.map(([label, value]) => <article key={label} className="rounded-xl bg-white p-4"><p className="text-xs text-stone-500">{label}</p><p className="mt-2 text-base font-semibold text-stone-900">{value}</p></article>)}</section>
    {isAdmin && <section className="rounded-2xl bg-white p-4 sm:p-5"><h2 className="mb-3 font-semibold text-stone-900">Sales by stall</h2><div className="overflow-x-auto"><Table rowKey="stallId" size="small" pagination={false} dataSource={sales.stalls ?? []} columns={[{ title: 'Stall', dataIndex: 'stallName' }, { title: 'Orders', dataIndex: 'orders' }, { title: 'GCash', dataIndex: 'gcashTotal', render: (value: number) => formatPrice(value) }, { title: 'COD', dataIndex: 'codTotal', render: (value: number) => formatPrice(value) }, { title: 'Total', dataIndex: 'total', render: (value: number) => formatPrice(value) }, { title: 'Refunded', dataIndex: 'refundedTotal', render: (value: number) => formatPrice(value) }, { title: '', render: (_, row) => <Button type="link" onClick={() => { sales.setStallId(row.stallId); }}>Orders</Button> }]} /></div></section>}
    <section className="space-y-4 rounded-2xl bg-white p-4 sm:p-5"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><Input.Search allowClear placeholder="Search order ID or buyer" value={sales.search} onChange={event => sales.setSearch(event.target.value)} /><Select value={sales.paymentMethod} onChange={sales.setPaymentMethod} options={[{ value: 'all', label: 'All payment methods' }, { value: 'gcash', label: 'GCash' }, { value: 'cod', label: 'COD' }]} /><Select value={sales.saleStatus} onChange={sales.setSaleStatus} options={[{ value: 'all', label: 'All sale statuses' }, ...SALE_STATUS_OPTIONS]} /><RangePicker className="w-full" value={sales.range[0] ? [dayjs(sales.range[0]), dayjs(sales.range[1])] : null} onChange={dates => sales.setRange(dates ? [dates[0]?.startOf('day').toISOString() ?? null, dates[1]?.endOf('day').toISOString() ?? null] : [null, null])} />{isAdmin && <Select allowClear showSearch optionFilterProp="label" placeholder="All stalls" value={sales.stallId ?? undefined} onChange={value => sales.setStallId(value ?? null)} options={(sales.stalls ?? []).map(stall => ({ value: stall.stallId, label: stall.stallName }))} />}</div>
      {sales.records?.length ? <div className="overflow-x-auto"><Table<SaleRecord> rowKey="orderId" size="middle" dataSource={sales.records} columns={columns} onRow={record => ({ onClick: () => sales.setSelected(record), className: 'cursor-pointer' })} pagination={{ current: sales.page, pageSize: SALES_PAGE_SIZE, total: sales.total, onChange: sales.setPage, showSizeChanger: false }} /></div> : <Empty description="No completed sales match these filters." />}
    </section>
    <Drawer title="Sale order details" open={Boolean(sales.selected)} onClose={() => sales.setSelected(null)} size="min(92vw, 560px)">{sales.selected && <div className="space-y-4 text-sm"><div className="rounded-xl bg-stone-50 p-4"><p className="font-mono font-semibold">Order #{sales.selected.orderId.slice(-6).toUpperCase()}</p><p className="mt-2">Completed {formatOrderTime(sales.selected.completedAt)}</p><p>Buyer: {sales.selected.buyerName}</p><p>Stall: {sales.selected.stallName}</p></div><div className="rounded-xl bg-stone-50 p-4"><p className="font-medium">{sales.selected.itemSummary}</p><p className="mt-2">Items subtotal {formatPrice(sales.selected.itemsSubtotal)}</p><p>Delivery fee {formatPrice(sales.selected.deliveryFee)}</p><p className="font-semibold">Order total {formatPrice(sales.selected.orderTotal)}</p><p>Payment: {sales.selected.paymentMethod.toUpperCase()}{sales.selected.gcashReference ? ` · Reference ${sales.selected.gcashReference}` : ''}</p><p>Sale status: {sales.selected.saleStatus}</p></div></div>}</Drawer>
  </div>;
}
