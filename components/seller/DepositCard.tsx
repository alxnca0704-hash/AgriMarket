'use client';

import { useState } from 'react';
import { Alert, Button, Empty, Image, Input, InputNumber, Skeleton, Tag } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { useSellerDeposit } from '@/hooks/useSellerDeposit';
import { SELLER_DEPOSIT_AMOUNT } from '@/constants/deposits';
import { formatPrice } from '@/lib/format';

export function DepositCard() {
  const deposit = useSellerDeposit();
  const [copyMessage, setCopyMessage] = useState('');
  if (deposit.isLoading) return <div className="rounded-2xl bg-white p-5"><Skeleton active paragraph={{ rows: 4 }} /></div>;
  if (!deposit.data) return <Alert type="error" showIcon title="Deposit information is unavailable." />;
  const { data } = deposit;
  const status = deposit.pending ? 'Pending review' : data.stall.depositPaidAmount >= SELLER_DEPOSIT_AMOUNT ? 'Paid' : data.stall.depositPaidAmount > 0 ? 'Partial' : 'Unpaid';
  const amountValid = Boolean(deposit.amount && deposit.amount > 0 && deposit.amount <= deposit.remaining);
  return <section className="rounded-2xl bg-white p-5 sm:p-6 space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs uppercase tracking-wide text-stone-400">Stall deposit</p><h2 className="text-lg font-semibold text-stone-900">{formatPrice(SELLER_DEPOSIT_AMOUNT)} to activate your stall</h2></div><Tag color={status === 'Paid' ? 'success' : status === 'Pending review' ? 'processing' : 'warning'}>{status}</Tag></header>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">Approved total</p><p className="mt-1 font-semibold">{formatPrice(data.stall.depositPaidAmount)}</p></div><div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">Remaining</p><p className="mt-1 font-semibold">{formatPrice(deposit.remaining)}</p></div><div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">Deadline</p><p className="mt-1 font-semibold">{deposit.deadlineDaysLeft} days left</p></div></div>
    {data.stall.suspended && <Alert type="error" showIcon title="Your stall is suspended until the full deposit is approved." />}
    {deposit.pending ? <Alert type="info" showIcon title="Awaiting admin review" /> : deposit.remaining > 0 && <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="space-y-3">{data.gcash ? <><Image src={data.gcash.qrUrl} alt="GCash QR code" className="!max-h-72 !rounded-xl object-contain" /><div className="flex flex-wrap gap-2"><Button href={data.gcash.qrUrl} target="_blank" icon={<DownloadOutlined />}>Download QR</Button><Button icon={<CopyOutlined />} onClick={async () => { await navigator.clipboard.writeText(data.gcash!.number); setCopyMessage('Account number copied.'); }}>Copy {data.gcash.number}</Button></div>{copyMessage && <p className="text-xs text-stone-500">{copyMessage}</p>}</> : <Alert type="warning" showIcon title="GCash details are not configured yet." />}</div>
      <div className="space-y-3"><InputNumber min={0.01} max={deposit.remaining} value={deposit.amount} onChange={value => deposit.setAmount(value)} className="!w-full" placeholder="Amount sent (₱)" />
        {amountValid && deposit.amount === deposit.remaining ? <Alert type="success" title="Full deposit" /> : amountValid && <Alert type="warning" title={`Partial deposit. You still need to pay ${formatPrice(deposit.remaining - (deposit.amount ?? 0))} to activate your stall.`} />}
        <Input value={deposit.referenceNumber} onChange={event => deposit.setReferenceNumber(event.target.value)} placeholder="GCash transaction reference number" />
        <Button type="primary" block loading={deposit.isSubmitting} disabled={!amountValid || !deposit.referenceNumber.trim()} onClick={() => void deposit.submitForm()}>Submit deposit</Button>
      </div>
    </div>}
    <div className="space-y-2"><h3 className="text-sm font-semibold">Submission history</h3>{data.submissions.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No deposit submissions yet." /> : data.submissions.map(item => <div key={item._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 p-3 text-sm"><div><strong>{formatPrice(item.amount)}</strong><span className="ml-2 font-mono text-xs text-stone-500">{item.referenceNumber}</span>{item.rejectionReason && <p className="mt-1 text-error">{item.rejectionReason}</p>}</div><Tag>{item.status}</Tag></div>)}</div>
  </section>;
}
