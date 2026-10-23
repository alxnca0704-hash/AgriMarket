'use client';
import { Alert, Button, Empty, Input, InputNumber, Skeleton, Tag } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { useSellerCommissions } from '@/hooks/useSellerCommissions';
import { formatPrice, formatOrderTime } from '@/lib/format';
import type { CommissionInvoice } from '@/types/commission';
import { CommissionReceivablesPanel } from '@/components/commissions/CommissionReceivablesPanel';
import { COMMISSION_RATE } from '@/constants/commissions';

export function CommissionsView() {
  const state = useSellerCommissions();
  if (state.isLoading) return <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6"><Skeleton active /><Skeleton active /></div>;
  if (state.error) return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Alert type="error" showIcon title={state.error} /></div>;
  const data = state.data;
  if (!data) return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Empty description="Create a stall to view commissions." /></div>;
  return <div className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
    <header><p className="text-xs font-medium uppercase tracking-wide text-stone-400">Seller finance</p><h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">Commissions</h1><p className="mt-1 text-sm text-stone-500">COD commissions are billed weekly at {(COMMISSION_RATE * 100).toLocaleString()}% of order items, excluding delivery.</p></header>
    <CommissionReceivablesPanel isAdmin={false} />
    <section className="space-y-4">{data.invoices.length === 0 ? <div className="rounded-2xl bg-white p-8"><Empty description="No commission invoices yet." /></div> : data.invoices.map((invoice: CommissionInvoice) => <article key={invoice._id} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-stone-900">{new Date(invoice.periodStart).toLocaleDateString('en-PH')} – {new Date(invoice.periodEnd).toLocaleDateString('en-PH')}</h2><Tag color={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'error' : invoice.status === 'pending-review' ? 'processing' : 'default'}>{invoice.status}</Tag></div><p className="mt-1 text-xs text-stone-500">Due {new Date(invoice.dueAt).toLocaleDateString('en-PH')}</p></div><div className="text-right"><p className="font-semibold text-stone-900">{formatPrice(invoice.amount)}</p><p className="text-xs text-stone-500">Paid {formatPrice(invoice.paidAmount)} · Remaining {formatPrice(invoice.remaining)}</p></div></div>
      <div className="space-y-2"><h3 className="text-xs font-medium uppercase tracking-wide text-stone-400">Covered orders</h3>{invoice.orders.map((order) => <div key={order.orderId} className="flex flex-wrap justify-between gap-2 rounded-xl bg-stone-50 p-3 text-sm"><span className="min-w-0 break-all font-mono text-xs text-stone-600">{order.orderId}<span className="ml-2 font-sans text-stone-400">{formatOrderTime(order.date)}</span></span><strong>{formatPrice(order.amount)}</strong></div>)}</div>
      {invoice.remaining > 0 && (invoice.pending ? <Alert type="info" showIcon title="Awaiting admin review" /> : <div className="space-y-3 rounded-xl bg-stone-50 p-4"><h3 className="font-semibold text-stone-900">Pay invoice by GCash</h3><p className="text-sm text-stone-600">Amount due: <strong>{formatPrice(invoice.remaining)}</strong></p>{data.gcash ? <div className="flex flex-wrap items-center gap-3">{/* QR is provided by admin configuration */}<Image src={data.gcash.qrUrl} alt="Admin GCash QR" width={112} height={160} unoptimized className="h-40 w-28 rounded-lg bg-white object-contain" /><a href={data.gcash.qrUrl} download className="text-sm text-sage"><DownloadOutlined /> Download QR</a><span className="font-mono text-sm">{data.gcash.number}</span><Button icon={<CopyOutlined />} onClick={() => navigator.clipboard.writeText(data.gcash?.number ?? '')}>Copy number</Button></div> : <Alert type="warning" title="GCash payment details are not configured yet." />}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><InputNumber min={0.01} max={invoice.remaining} value={state.values[invoice._id]?.amount} onChange={value => state.setValue(invoice._id, 'amount', value ?? 0)} className="w-full" placeholder="Payment amount" /><Input value={state.values[invoice._id]?.referenceNumber} onChange={event => state.setValue(invoice._id, 'referenceNumber', event.target.value)} placeholder="GCash reference number" /></div>
        {(state.values[invoice._id]?.amount ?? 0) > 0 && (state.values[invoice._id]?.amount ?? 0) < invoice.remaining && <p className="text-sm text-amber-800">Partial payment. {formatPrice(invoice.remaining - state.values[invoice._id].amount)} still due.</p>}
        <Button type="primary" loading={state.isPending(`commission:submit:${invoice._id}`)} disabled={!data.gcash || !state.values[invoice._id]?.amount || !state.values[invoice._id]?.referenceNumber?.trim()} onClick={() => void state.pay(invoice._id)}>Submit payment</Button>
      </div>)}
    </article>)}</section>
  </div>;
}

