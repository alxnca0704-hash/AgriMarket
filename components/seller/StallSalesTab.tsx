'use client';

import { useState } from 'react';
import { Alert, Button, DatePicker, Drawer, Empty, Input, Pagination, Select, Skeleton, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { SALES_PAGE_SIZE, SALE_STATUS_OPTIONS } from '@/constants/sales';
import { formatOrderId, formatOrderTime, formatPrice } from '@/lib/format';
import type { SaleRecord } from '@/types/sales';
import type { SellerStallPageResult } from '@/hooks/useSellerStallPage';
import { StallStatCard } from '@/components/seller/StallStatCard';

const saleStatusMeta = {
  counted: { label: 'Counted', color: 'green' },
  'refund-requested': { label: 'Refund requested', color: 'gold' },
  refunded: { label: 'Refunded', color: 'default' },
} as const;

export interface StallSalesTabProps {
  page: SellerStallPageResult;
}

export function StallSalesTab({ page }: StallSalesTabProps) {
  const { sales } = page;
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const records = sales.records ?? [];
  const selected = records.find((record) => record.orderId === selectedOrderId) ?? null;
  const summary = sales.summary;
  const rangeValue: [Dayjs | null, Dayjs | null] | null = sales.range[0] && sales.range[1]
    ? [dayjs(sales.range[0]), dayjs(sales.range[1])]
    : null;

  if (sales.error) {
    return <Alert type="error" title="Could not load sales" description={sales.error} showIcon />;
  }
  if (sales.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  const columns: TableProps<SaleRecord>['columns'] = [
    {
      title: 'Date',
      dataIndex: 'completedAt',
      render: (value: string) => <span className="whitespace-nowrap">{formatOrderTime(value)}</span>,
    },
    {
      title: 'Order',
      dataIndex: 'orderId',
      render: (value: string) => <span className="whitespace-nowrap font-mono text-xs text-stone-500">{formatOrderId(value)}</span>,
    },
    { title: 'Buyer', dataIndex: 'buyerName', ellipsis: true },
    {
      title: 'Payment',
      dataIndex: 'paymentMethod',
      render: (value: SaleRecord['paymentMethod']) => (
        <Tag color={value === 'gcash' ? 'green' : 'gold'}>{value === 'gcash' ? 'GCash' : 'COD'}</Tag>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'orderTotal',
      align: 'right',
      render: (value: number) => <span className="whitespace-nowrap font-medium tabular-nums">{formatPrice(value)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'saleStatus',
      render: (value: SaleRecord['saleStatus']) => (
        <Tag color={saleStatusMeta[value].color}>{saleStatusMeta[value].label}</Tag>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StallStatCard
          label="Total sales"
          value={formatPrice(summary?.totalSales ?? 0)}
          note={`${summary?.orderCount ?? 0} paid order${(summary?.orderCount ?? 0) === 1 ? '' : 's'} · refunds excluded`}
          tone="sage"
        />
        <StallStatCard
          label="GCash sales"
          value={formatPrice(summary?.gcashSales ?? 0)}
          note="Paid online before delivery"
        />
        <StallStatCard
          label="COD sales"
          value={formatPrice(summary?.codSales ?? 0)}
          note="Cash collected on delivery"
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-stone-400" />}
            placeholder="Search order or buyer"
            value={sales.search}
            onChange={(event) => sales.setSearch(event.target.value)}
            className="w-full md:max-w-xs"
          />
          <Select
            value={sales.paymentMethod}
            onChange={sales.setPaymentMethod}
            className="w-full md:w-36"
            options={[
              { value: 'all', label: 'All payments' },
              { value: 'gcash', label: 'GCash' },
              { value: 'cod', label: 'COD' },
            ]}
          />
          <Select
            value={sales.saleStatus}
            onChange={sales.setSaleStatus}
            className="w-full md:w-44"
            options={[{ value: 'all', label: 'All statuses' }, ...SALE_STATUS_OPTIONS]}
          />
          <DatePicker.RangePicker
            value={rangeValue}
            onChange={(values) => sales.setRange([values?.[0]?.toISOString() ?? null, values?.[1]?.toISOString() ?? null])}
            className="w-full md:w-auto"
          />
          <Button
            icon={<DownloadOutlined />}
            onClick={() => void sales.exportCsv()}
            className="w-full md:ml-auto md:w-auto"
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm md:block">
        <Table<SaleRecord>
          rowKey="orderId"
          columns={columns}
          dataSource={records}
          pagination={false}
          onRow={(record) => ({ onClick: () => setSelectedOrderId(record.orderId), className: 'cursor-pointer' })}
          locale={{ emptyText: <Empty description="No sales match these filters." /> }}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {records.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <Empty description="No sales match these filters." />
          </div>
        ) : records.map((record) => (
          <button
            key={record.orderId}
            type="button"
            onClick={() => setSelectedOrderId(record.orderId)}
            className="w-full rounded-2xl bg-white p-4 text-left shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-stone-500">{formatOrderId(record.orderId)}</p>
                <p className="mt-1 truncate font-medium text-stone-900">{record.buyerName}</p>
              </div>
              <Tag color={saleStatusMeta[record.saleStatus].color}>{saleStatusMeta[record.saleStatus].label}</Tag>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="text-xs text-stone-500">
                <p>{formatOrderTime(record.completedAt)}</p>
                <p className="mt-1">{record.paymentMethod === 'gcash' ? 'GCash' : 'COD'}</p>
              </div>
              <p className="whitespace-nowrap text-base font-semibold tabular-nums">{formatPrice(record.orderTotal)}</p>
            </div>
          </button>
        ))}
      </div>

      {records.length > 0 ? (
        <div className="flex justify-center md:justify-end">
          <Pagination
            current={sales.page}
            pageSize={SALES_PAGE_SIZE}
            total={sales.total ?? 0}
            showSizeChanger={false}
            onChange={(nextPage) => sales.setPage(nextPage)}
          />
        </div>
      ) : null}

      <Drawer title="Sale details" open={Boolean(selected)} onClose={() => setSelectedOrderId(null)} size="min(92vw, 560px)">
        {selected ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl bg-stone-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono font-semibold text-stone-900">{formatOrderId(selected.orderId)}</p>
                  <p className="mt-1 text-stone-500">Completed {formatOrderTime(selected.completedAt)}</p>
                </div>
                <Tag color={saleStatusMeta[selected.saleStatus].color}>{saleStatusMeta[selected.saleStatus].label}</Tag>
              </div>
              <p className="mt-3 text-stone-700">Buyer: {selected.buyerName}</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Items</p>
              <div className="space-y-2">
                {selected.items.map((item) => (
                  <div key={`${item.productId}-${item.name}`} className="flex items-start justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-stone-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{item.name} - {item.variantName ?? item.unit} x {item.qty} · {formatPrice(item.price)}</p>
                    </div>
                    <p className="whitespace-nowrap font-medium tabular-nums">{formatPrice(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl bg-stone-50 p-4">
              <div className="flex justify-between gap-3"><span>Items subtotal</span><span className="tabular-nums">{formatPrice(selected.itemsSubtotal)}</span></div>
              <div className="flex justify-between gap-3"><span>Delivery fee</span><span className="tabular-nums">{formatPrice(selected.deliveryFee)}</span></div>
              <div className="flex justify-between gap-3 font-semibold text-stone-900"><span>Order total</span><span className="tabular-nums">{formatPrice(selected.orderTotal)}</span></div>
              <div className="flex justify-between gap-3"><span>Payment</span><span>{selected.paymentMethod === 'gcash' ? 'GCash' : 'COD'}</span></div>
              {selected.gcashReference ? <div className="flex justify-between gap-3"><span>GCash reference</span><span className="text-right font-mono text-xs">{selected.gcashReference}</span></div> : null}
              {selected.payoutReference ? <div className="flex justify-between gap-3"><span>Payout reference</span><span className="text-right font-mono text-xs">{selected.payoutReference}</span></div> : null}
            </div>

            <div className="space-y-1.5 rounded-xl bg-stone-50 p-4">
              <div className="flex justify-between gap-3"><span>Commission</span><span className="tabular-nums">{formatPrice(selected.commissionAmount ?? 0)}</span></div>
              <div className="flex justify-between gap-3"><span>Commission status</span><span>{selected.commissionStatus.replaceAll('-', ' ')}</span></div>
              {selected.invoiceNumber ? <div className="flex justify-between gap-3"><span>Invoice</span><span className="font-mono text-xs">{selected.invoiceNumber}</span></div> : null}
            </div>

            {selected.saleStatus === 'refunded' || selected.refundAmount !== null ? (
              <Alert
                type="warning"
                showIcon
                title="Refunded sale"
                description={`${formatPrice(selected.refundAmount ?? selected.orderTotal)} refunded${selected.refundMethod ? ` via ${selected.refundMethod === 'gcash' ? 'GCash' : 'cash'}` : ''}. Refunded sales are excluded from totals.`}
              />
            ) : null}

            {selected.refundReference || selected.refundConfirmedAt ? (
              <div className="space-y-1.5 rounded-xl bg-stone-50 p-4">
                {selected.refundReference ? <div className="flex justify-between gap-3"><span>Refund reference</span><span className="text-right font-mono text-xs">{selected.refundReference}</span></div> : null}
                {selected.refundConfirmedAt ? <div className="flex justify-between gap-3"><span>Refund confirmed</span><span>{formatOrderTime(selected.refundConfirmedAt)}</span></div> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
