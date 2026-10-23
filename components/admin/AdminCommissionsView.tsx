'use client';
import { Alert, Button, Empty, Input, InputNumber, Skeleton } from 'antd';
import { useAdminCommissions } from '@/hooks/useAdminCommissions';
import { formatPrice } from '@/lib/format';

export function AdminCommissionsView() {
  const state = useAdminCommissions();
  if (state.isLoading) return <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6"><Skeleton active /><Skeleton active /></div>;
  if (state.error) return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><Alert type="error" showIcon title={state.error} /></div>;
  return <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-6 sm:px-6">
    <header><p className="text-xs font-medium uppercase tracking-wide text-stone-400">Admin review</p><h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">Commissions</h1></header>
    <section className="space-y-4"><h2 className="text-base font-semibold text-stone-900">Pending GCash payments ({state.pendingCount})</h2>{!state.payments?.length ? <div className="rounded-2xl bg-white p-8"><Empty description="No commission payments awaiting review." /></div> : state.payments.map(item => <article key={item._id} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm sm:p-6"><div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3"><p><strong>{item.stallName}</strong> · {item.sellerName}</p><p>Period: {item.invoice ? `${new Date(item.invoice.periodStart).toLocaleDateString('en-PH')} – ${new Date(item.invoice.periodEnd).toLocaleDateString('en-PH')}` : 'Invoice unavailable'}</p><p>Submitted: {formatPrice(item.amount)} · Balance: {formatPrice(item.invoice?.remaining ?? 0)}</p><p>Reference: <span className="font-mono">{item.referenceNumber}</span></p><p>Submitted {new Date(item.createdAt).toLocaleString('en-PH')}</p></div><div className="flex flex-wrap items-center gap-2"><InputNumber min={0.01} max={item.invoice?.remaining ?? item.amount} value={state.amount(item)} onChange={value => state.setAmount(item._id, value ?? 0)} /><Button type="primary" loading={state.isPending(`commission:approve:${item._id}`)} onClick={() => void state.approve(item)}>Approve confirmed amount</Button><Input className="min-w-48 flex-1" value={state.reason(item._id)} onChange={event => state.setReason(item._id, event.target.value)} placeholder="Required rejection reason" /><Button danger loading={state.isPending(`commission:reject:${item._id}`)} disabled={!state.reason(item._id).trim()} onClick={() => void state.reject(item)}>Reject</Button></div></article>)}</section>
    <section className="space-y-4"><h2 className="text-base font-semibold text-stone-900">Overdue invoices</h2>{!state.overdue?.length ? <div className="rounded-2xl bg-white p-8"><Empty description="No overdue invoices." /></div> : state.overdue.map(item => <article key={item.invoiceId} className="flex flex-wrap justify-between gap-2 rounded-2xl bg-white p-4 shadow-sm"><div><p className="font-semibold text-stone-900">{item.stallName}</p><p className="text-sm text-stone-500">{item.daysOverdue} days overdue</p></div><strong>{formatPrice(item.amount)}</strong></article>)}</section>
  </div>;
}

