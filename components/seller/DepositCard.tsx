'use client';

import { useState } from 'react';
import { Alert, Button, Image, Input, InputNumber, Skeleton, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { useSellerDeposit } from '@/hooks/useSellerDeposit';
import { STALL_DEPOSIT_AMOUNT } from '@/constants/deposits';
import { formatOrderTime, formatPrice } from '@/lib/format';

export function DepositCard() {
  const deposit = useSellerDeposit();
  const [copyMessage, setCopyMessage] = useState('');
  if (deposit.isLoading) return <div className="rounded-2xl bg-white p-5"><Skeleton active paragraph={{ rows: 4 }} /></div>;
  if (deposit.error) return <Alert type="error" showIcon title={deposit.error} />;
  if (!deposit.data) return <Alert type="error" showIcon title="Deposit information is unavailable." />;
  const { data } = deposit;
  const status = deposit.pending ? 'Pending review' : data.stall.depositPaidAmount >= STALL_DEPOSIT_AMOUNT ? 'Paid' : data.stall.depositPaidAmount > 0 ? 'Partial' : 'Unpaid';
  const amountValid = Boolean(deposit.amount && deposit.amount > 0 && deposit.amount <= deposit.remaining);
  const columns: TableProps<typeof data.submissions[number]>['columns'] = [
    { title: 'Date', dataIndex: 'submittedAt', render: (_value, item) => formatOrderTime(item.submittedAt ?? item.createdAt) },
    { title: 'Amount', dataIndex: 'amount', render: (value: number) => formatPrice(value) },
    { title: 'Reference', dataIndex: 'referenceNumber', render: (value: string) => <span className="font-mono">{value}</span> },
    { title: 'Status', dataIndex: 'status', render: (value: string) => <Tag>{value}</Tag> },
    { title: 'Approved', dataIndex: 'approvedAmount', render: (value?: number) => value === undefined ? '—' : formatPrice(value) },
    { title: 'Rejection reason', dataIndex: 'rejectionReason', render: (value?: string) => value || '—' },
  ];
  return <section className="rounded-2xl bg-white p-5 sm:p-6 space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs uppercase tracking-wide text-stone-400">Stall deposit</p><h2 className="text-lg font-semibold text-stone-900">Required: {formatPrice(STALL_DEPOSIT_AMOUNT)}</h2></div><Tag color={status === 'Paid' ? 'success' : status === 'Pending review' ? 'processing' : 'warning'}>{status}</Tag></header>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">Paid</p><p className="mt-1 font-semibold">{formatPrice(data.stall.depositPaidAmount)}</p></div><div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">Remaining</p><p className="mt-1 font-semibold">{formatPrice(deposit.remaining)}</p></div><div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">Deadline</p><p className="mt-1 font-semibold">{data.stall.overdue ? 'Overdue' : `${deposit.deadlineDaysLeft} days left`}</p><p className="text-xs text-stone-500">{new Date(data.stall.depositDeadline).toLocaleDateString('en-PH')}</p></div></div>
    {data.stall.overdue && <Alert type="warning" showIcon title="Deposit overdue" description="Your deadline has passed. Submit the remaining balance from here." />}
    {deposit.pending ? <Alert type="info" showIcon title="Awaiting admin review" /> : deposit.remaining > 0 && <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="space-y-3">{data.gcash ? <><Image src={data.gcash.qrUrl} alt="GCash QR code" className="!max-h-72 !rounded-xl object-contain" /><div className="flex flex-wrap gap-2"><Button href={data.gcash.qrUrl} target="_blank" icon={<DownloadOutlined />}>Download QR</Button><Button icon={<CopyOutlined />} onClick={async () => { await navigator.clipboard.writeText(data.gcash!.number); setCopyMessage('Account number copied.'); }}>Copy {data.gcash.number}</Button></div>{copyMessage && <p className="text-xs text-stone-500">{copyMessage}</p>}</> : <Alert type="warning" showIcon title="GCash details are not configured yet." />}</div>
      <div className="space-y-3"><InputNumber aria-label="Amount sent" min={0.01} max={deposit.remaining} value={deposit.amount} onChange={value => deposit.setAmount(value)} className="!w-full" placeholder="Amount sent (₱)" />
        {amountValid && deposit.amount === deposit.remaining ? <Alert type="success" title="Full deposit" /> : amountValid && <Alert type="warning" title={`Partial deposit. You still need to pay ${formatPrice(deposit.remaining - (deposit.amount ?? 0))} to activate your stall.`} />}
        <Input value={deposit.referenceNumber} onChange={event => deposit.setReferenceNumber(event.target.value)} placeholder="GCash transaction reference number" />
        <Button type="primary" block loading={deposit.isSubmitting} disabled={!amountValid || !deposit.referenceNumber.trim()} onClick={() => void deposit.submitForm()}>Submit deposit</Button>
      </div>
    </div>}
    <div className="space-y-2"><h3 className="text-sm font-semibold">Submission history</h3><div className="overflow-x-auto"><Table rowKey="_id" size="small" pagination={false} dataSource={data.submissions} columns={columns} locale={{ emptyText: 'No deposit submissions yet.' }} /></div></div>
  </section>;
}
