'use client';

import Link from 'next/link';
import { Alert, Button, Input, Modal, Skeleton, Table, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { APP_ROUTES } from '@/constants/routes';
import { useAdminStallDetail } from '@/hooks/useAdminStallDetail';
import { formatPrice } from '@/lib/format';
import { getGcashNetToSeller } from '@/lib/orderMoney';
import { useAdminStalls } from '@/hooks/useAdminStalls';
import type { StallFinanceOrder } from '@/types/finance';
import { useState } from 'react';

export function AdminStallDetailView({ stallId }: { stallId: string }) {
  const { data, isLoading, error, settle, waive, isSubmitting } = useAdminStallDetail(stallId);
  const [owingAction, setOwingAction] = useState<{ id: string; kind: 'settle' | 'waive' } | null>(null);
  const [owingNote, setOwingNote] = useState('');
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

  const gcashBalance = data?.payoutBalance.available ?? 0;
  const codOwed = stallRow?.codOwed ?? 0;
  const codOverdue = stallRow?.codOverdue ?? 0;
  const depositPaid = stallRow?.depositPaid ?? 0;
  const depositRequired = stallRow?.depositRequired ?? 0;
  const depositStatus = stallRow?.depositStatus || 'unpaid';
  const pendingRefundAmount = (stallRow?.inProgressAmount ?? 0) + (stallRow?.needsRefundAmount ?? 0);
  const recordedRefundAmount = stallRow?.refundedAmount ?? 0;
  const submitOwesAction = async () => {
    if (!owingAction) return;
    const ok = owingAction.kind === 'settle'
      ? await settle(owingAction.id, owingNote.trim())
      : await waive(owingAction.id, owingNote.trim());
    if (ok) setOwingAction(null);
  };

  const attentionItems = [];
  if (codOverdue > 0) attentionItems.push({ label: `Overdue commission: ${formatPrice(codOverdue)}`, href: APP_ROUTES.adminCommissions });
  if (depositStatus === 'overdue') attentionItems.push({ label: 'Deposit overdue', href: APP_ROUTES.adminDeposits });
  if (depositStatus === 'unpaid' || depositStatus === 'partial') attentionItems.push({ label: 'Deposit awaiting review', href: APP_ROUTES.adminDeposits });
  if (stallRow?.needsRefundCount && stallRow.needsRefundCount > 0) attentionItems.push({ label: 'Return needing refund', href: APP_ROUTES.adminRefunds });
  if (stallRow?.inProgressCount && stallRow.inProgressCount > 0) attentionItems.push({ label: 'Return awaiting review', href: APP_ROUTES.adminRefunds });

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
          Back to Stall Accounts
        </Link>
      </div>

      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">{data?.stallName ?? 'Stall details'}</h1>
        <p className="text-sm text-stone-500">{stallRow?.sellerName ?? 'Seller'}</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500 whitespace-nowrap">GCash balance</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900 tabular-nums sm:text-[26px] whitespace-nowrap">{formatPrice(gcashBalance)}</p>
          <div className="mt-2 space-y-1 text-xs text-stone-500">
            <p>Rolling {formatPrice(data?.payoutBalance.rolling ?? 0)}</p>
            <p>Requested {formatPrice(data?.payoutBalance.requested ?? 0)}</p>
            <p>Paid out {formatPrice(data?.payoutBalance.paidOut ?? 0)}</p>
          </div>
          <Link href={APP_ROUTES.adminPayouts} className="mt-4 inline-block text-sm text-stone-600 hover:text-stone-900">
            View records
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500 whitespace-nowrap">Seller owes platform</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900 tabular-nums sm:text-[26px] whitespace-nowrap">{formatPrice(stallRow?.sellerOwesPlatform ?? 0)}</p>
          <p className="mt-1 text-xs text-stone-500">Separate from payouts, commission, and deposit</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500 whitespace-nowrap">COD commission owed</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900 tabular-nums sm:text-[26px] whitespace-nowrap">{formatPrice(codOwed)}</p>
          {codOverdue > 0 && <p className="mt-1 text-xs text-red-600 tabular-nums whitespace-nowrap">{formatPrice(codOverdue)} overdue</p>}
          <Link href={APP_ROUTES.adminCommissions} className="mt-4 inline-block text-sm text-stone-600 hover:text-stone-900">
            View records
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500 whitespace-nowrap">Deposit</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900 tabular-nums sm:text-[26px] whitespace-nowrap">
            {formatPrice(depositPaid)} of {formatPrice(depositRequired)}
          </p>
          <div className="mt-1.5">{getDepositBadge()}</div>
          <Link href={APP_ROUTES.adminDeposits} className="mt-4 inline-block text-sm text-stone-600 hover:text-stone-900">
            View records
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-stone-500 whitespace-nowrap">Refunds recorded</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900 tabular-nums sm:text-[26px] whitespace-nowrap">
            {recordedRefundAmount > 0 ? formatPrice(recordedRefundAmount) : <span className="text-stone-400">None</span>}
          </p>
          {pendingRefundAmount > 0 && <p className="mt-1 text-xs text-stone-500 tabular-nums">Pending {formatPrice(pendingRefundAmount)}</p>}
          <Link href={APP_ROUTES.adminRefundRecords} className="mt-4 inline-block text-sm text-stone-600 hover:text-stone-900">
            View records
          </Link>
        </div>
      </section>

      {(data?.sellerOwesPlatform.length ?? 0) > 0 && <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-stone-900">Seller owes platform</h2>
        <p className="mt-1 text-sm text-stone-500">{formatPrice(stallRow?.sellerOwesPlatform ?? 0)} open. This stays separate from deposits and payout balances.</p>
        <div className="mt-4 space-y-3">{data?.sellerOwesPlatform.map(record => <div key={record._id} className="flex flex-col gap-3 rounded-xl bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-medium text-stone-900">{formatPrice(record.amount)} · order {record.orderId.slice(-8)}</p><p className="mt-1 text-xs text-stone-500">{record.reason}</p><p className="mt-1 text-xs text-stone-400">Opened {new Date(record.createdAt).toLocaleString()}</p></div>
          <div className="flex gap-2"><Button size="small" onClick={() => { setOwingNote(''); setOwingAction({ id: record._id, kind: 'settle' }); }}>Settle</Button><Button danger size="small" onClick={() => { setOwingNote(''); setOwingAction({ id: record._id, kind: 'waive' }); }}>Waive</Button></div>
        </div>)}</div>
      </section>}



      <section className="rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Order history</h2>
            <p className="mt-0.5 text-sm text-stone-500">Transactions with totals and amounts owed</p>
          </div>
        </div>
        <div className="overflow-x-auto p-2 sm:p-4">
          <Table
            rowKey="orderId"
            columns={[
              { title: 'Date', dataIndex: 'date', width: 110 },
              { title: 'Order ID', dataIndex: 'orderId', render: (value: string) => <span className="font-mono text-xs">{value.slice(-8)}</span> },
              { title: 'Method', dataIndex: 'paymentMethod', render: (value: string) => <Tag className="m-0">{value.toUpperCase()}</Tag> },
              { title: 'Total items', dataIndex: 'itemsSubtotal', align: 'right' as const, render: (value: number) => <span className="tabular-nums">{formatPrice(value)}</span> },
              { title: 'Delivery fee', dataIndex: 'deliveryFee', align: 'right' as const, render: (value: number) => <span className="tabular-nums">{formatPrice(value)}</span> },
              { title: 'Amount', align: 'right' as const, render: (_: unknown, row: StallFinanceOrder) => <span className="tabular-nums font-medium">{formatPrice(row.itemsSubtotal + row.deliveryFee)}</span> },
              { title: 'We owe seller / Owe platform', align: 'right' as const, render: (_: unknown, row: StallFinanceOrder) => <span className="tabular-nums">{row.status === 'refunded' ? 'Refunded' : row.paymentMethod === 'gcash' ? row.payoutReference ? 'Paid out' : formatPrice(getGcashNetToSeller(row)) : formatPrice(row.commissionAmount)}</span> },
              { title: 'Refund record', render: (_: unknown, row: StallFinanceOrder) => row.status === 'refunded' ? <span className="text-xs">{formatPrice(row.refundAmount ?? row.itemsSubtotal + row.deliveryFee)} · {row.refundMethod?.toUpperCase() ?? 'Recorded'}</span> : '—' },
              { title: 'Status', dataIndex: 'status' },
            ]}
            dataSource={data?.orders ?? []}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            scroll={{ x: 900 }}
            size="middle"
          />
        </div>
      </section>
      <Modal open={Boolean(owingAction)} title={owingAction?.kind === 'settle' ? 'Settle seller receivable' : 'Waive seller receivable'} onCancel={() => setOwingAction(null)} onOk={() => void submitOwesAction()} confirmLoading={isSubmitting} okButtonProps={{ disabled: owingAction?.kind === 'settle' ? owingNote.trim().length < 3 : owingNote.trim().length < 5 }}>
        <Input.TextArea rows={4} maxLength={500} value={owingNote} onChange={event => setOwingNote(event.target.value)} placeholder={owingAction?.kind === 'settle' ? 'Settlement reference or note' : 'Reason for waiver'} />
      </Modal>
    </div>
  );
}
