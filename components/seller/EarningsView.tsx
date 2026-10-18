'use client';

import React from 'react';
import { Alert, Button, Checkbox, Input, Modal, Skeleton, Tag } from 'antd';
import { WalletOutlined } from '@ant-design/icons';
import { useSellerEarnings, EARNINGS_PERIOD_OPTIONS } from '@/hooks/useSellerEarnings';
import { formatOrderTime, formatPrice } from '@/lib/format';

function EarningsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 pb-16 pt-8 sm:px-6">
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton.Button key={i} active block className="!h-28 !rounded-2xl" />)}</div>
    </div>
  );
}

export function EarningsView() {
  const earnings = useSellerEarnings();
  if (earnings.isLoading) return <EarningsSkeleton />;
  const payoutData = earnings.payoutData;
  const payoutOrders = payoutData && 'orders' in payoutData ? payoutData.orders : [];
  const canRequest = earnings.selectedOrderIds.length > 0;

  const payoutStatusLabel = (status: string, deliveredAt: string | null) => {
    if (status === 'held') return 'On hold · refund pending';
    if (status === 'return-window') {
      const unlockDate = deliveredAt ? new Date(Date.parse(deliveredAt) + 24 * 60 * 60 * 1000) : null;
      return unlockDate ? `Payout available after ${unlockDate.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}` : 'Payout available after 24 hours';
    }
    if (status === 'awaiting-completion') return 'Waiting for delivery confirmation';
    if (status === 'requested') return 'Payout request pending';
    if (status === 'paid-out') return 'Paid out';
    return 'Ready for payout';
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Sales</p>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Earnings</h1>
      </div>
      {earnings.error && <Alert type="error" title={earnings.error} showIcon />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5"><p className="text-xs font-medium uppercase tracking-wide text-stone-400">Total sales</p><p className="mt-1 text-2xl font-semibold text-stone-900 sm:text-3xl">{formatPrice(earnings.summary.total)}</p><p className="mt-1 text-xs text-stone-400">{earnings.summary.orderCount} paid orders · refunded orders excluded</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5"><p className="text-xs font-medium uppercase tracking-wide text-stone-400">Eligible for payout</p><p className="mt-1 text-2xl font-semibold text-sage sm:text-3xl">{formatPrice(payoutData?.eligibleAmount ?? 0)}</p><p className="mt-1 text-xs text-stone-400">{payoutData?.eligibleOrderCount ?? 0} orders after the 24-hour return window</p></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5"><p className="text-xs font-medium uppercase tracking-wide text-stone-400">In transit</p><p className="mt-1 text-2xl font-semibold text-stone-900 sm:text-3xl">{formatPrice(earnings.summary.inTransit)}</p><p className="mt-1 text-xs text-stone-400">Shipped, not yet confirmed</p></div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">GCash earnings</p>
          <p className="mt-1 text-xl font-semibold text-stone-900">{formatPrice(earnings.summary.gcashTotal)}</p>
          <p className="mt-1 text-xs text-stone-400">Approved GCash payments · refunded orders excluded</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Cash on Delivery earnings</p>
          <p className="mt-1 text-xl font-semibold text-stone-900">{formatPrice(earnings.summary.codTotal)}</p>
          <p className="mt-1 text-xs text-stone-400">COD paid after delivery confirmation · refunded orders excluded</p>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-semibold text-stone-900">Choose orders for payout</h2><p className="mt-1 text-sm text-stone-500">Request payout 24 hours after delivery. Orders with a pending refund stay on hold until it is closed.</p></div>
          <Button onClick={earnings.selectAllReadyOrders} disabled={!payoutOrders.some((order) => order.payoutStatus === 'ready')}>Select all ready</Button>
        </div>
        {payoutOrders.length === 0 ? <p className="text-sm text-stone-500">No paid orders to show yet.</p> : <div className="space-y-2">{payoutOrders.map((order) => {
          const isReady = order.payoutStatus === 'ready';
          return <article key={order.orderId} className="flex items-start gap-3 rounded-xl bg-stone-50/80 p-4">
            <Checkbox checked={earnings.selectedOrderIds.includes(order.orderId)} disabled={!isReady} onChange={() => earnings.togglePayoutOrder(order.orderId)} aria-label={`Select order ${order.orderId} for payout`} />
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="break-all font-mono text-xs font-medium text-stone-800">{order.orderId}</p><Tag color={isReady ? 'success' : order.payoutStatus === 'held' ? 'warning' : 'default'}>{payoutStatusLabel(order.payoutStatus, order.deliveredAt)}</Tag></div><p className="mt-1 text-xs text-stone-500">Placed {formatOrderTime(order.placedAt)}{order.deliveredAt ? ` · Delivered ${formatOrderTime(order.deliveredAt)}` : ''} · {order.paymentMethod === 'gcash' ? 'GCash' : 'Cash on Delivery'}</p></div>
            <span className="shrink-0 text-sm font-semibold text-stone-900">{formatPrice(order.amount)}</span>
          </article>;
        })}</div>}
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-soft text-sage"><WalletOutlined /></span><div><h2 className="text-sm font-semibold text-stone-900">GCash payout</h2><p className="mt-1 text-sm text-stone-500">Request the selected orders. You can submit another request for other ready orders while one is under review.</p></div></div>
          <Button type="primary" disabled={!canRequest} onClick={earnings.openPayout}>Request selected · {earnings.selectedOrderIds.length}</Button>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-stone-800">Payout history</h3>
          {payoutData?.requests.length ? payoutData.requests.map((request) => <article key={request._id} className="flex flex-col justify-between gap-3 rounded-xl bg-stone-50/80 p-4 sm:flex-row sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-stone-900">{formatPrice(request.amount)}</span><Tag color={request.status === 'paid' ? 'success' : request.status === 'pending' ? 'processing' : 'default'}>{request.status}</Tag></div><p className="mt-1 text-xs text-stone-500">{request.orderCount} orders · GCash · {request.gcashName} · {request.gcashNumber}</p><p className="mt-1 text-xs text-stone-400">Requested {formatOrderTime(request.requestedAt)}</p>{request.transferReference && <p className="mt-1 break-all text-xs text-stone-500">Transfer reference: {request.transferReference}</p>}{request.rejectionReason && <p className="mt-1 text-sm text-error">Reason: {request.rejectionReason}</p>}</div></article>) : <p className="text-sm text-stone-500">No payout requests yet.</p>}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-stone-900">Sales summary</h2><div className="flex gap-1.5">{EARNINGS_PERIOD_OPTIONS.map((opt) => <button key={opt.key} type="button" onClick={() => earnings.setPeriod(opt.key)} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${earnings.period === opt.key ? 'bg-sage text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{opt.label}</button>)}</div></div>
        {earnings.summary.buckets.length === 0 ? <p className="text-sm text-stone-500">No paid sales recorded yet for this period.</p> : <div className="space-y-2">{earnings.summary.buckets.map((bucket) => <div key={bucket.label} className="flex items-center justify-between rounded-xl bg-stone-50/80 px-4 py-3"><span className="text-sm font-medium text-stone-800">{bucket.label}</span><span className="text-sm text-stone-500">{bucket.count} {bucket.count === 1 ? 'order' : 'orders'}</span><span className="text-sm font-semibold text-stone-900">{formatPrice(bucket.total)}</span></div>)}</div>}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6"><h2 className="mb-3 text-sm font-semibold text-stone-900">Per-order breakdown</h2>{earnings.summary.entries.length === 0 ? <p className="text-sm text-stone-500">No paid orders to show yet.</p> : <div className="divide-y divide-stone-100">{earnings.summary.entries.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-stone-800">{entry.id}</p><p className="text-xs text-stone-400">{entry.address.receiverName} · {formatOrderTime(entry.placedAt)} · {entry.payment.method === 'gcash' ? 'GCash paid' : 'COD collected'}</p></div><span className="shrink-0 text-sm font-semibold text-stone-900">{formatPrice(entry.total)}</span></div>)}</div>}</section>

      <Modal open={earnings.payoutOpen} onCancel={earnings.closePayout} onOk={() => void earnings.requestPayout()} okText="Submit payout request" cancelText="Cancel" okButtonProps={{ disabled: !canRequest || earnings.gcashName.trim().length < 2 || earnings.gcashNumber.trim().length < 10, loading: earnings.isRequesting }} title="Request GCash payout" width="min(92%, 440px)" centered>
        <div className="space-y-4 pt-1"><Alert type="info" showIcon title={`Requesting ${formatPrice(earnings.selectedPayoutAmount)} from ${earnings.selectedOrderIds.length} selected orders.`} description="Only these orders will be reserved for this payout. Orders with an active return request remain on hold."/><div><label htmlFor="payout-gcash-name" className="mb-1.5 block text-sm font-medium text-stone-700">GCash account name</label><Input id="payout-gcash-name" size="large" value={earnings.gcashName} onChange={(event) => earnings.setGcashName(event.target.value)} /></div><div><label htmlFor="payout-gcash-number" className="mb-1.5 block text-sm font-medium text-stone-700">GCash mobile number</label><Input id="payout-gcash-number" size="large" placeholder="09XXXXXXXXX" value={earnings.gcashNumber} onChange={(event) => earnings.setGcashNumber(event.target.value)} /></div></div>
      </Modal>
    </div>
  );
}
