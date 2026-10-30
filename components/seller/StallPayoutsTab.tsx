'use client';

import { useState } from 'react';
import { Alert, Button, Drawer, Empty, Input, Modal, Skeleton, Tag } from 'antd';
import { formatOrderId, formatOrderTime, formatPrice } from '@/lib/format';
import type { SellerStallPageResult } from '@/hooks/useSellerStallPage';
import { StallStatCard } from '@/components/seller/StallStatCard';

export interface StallPayoutsTabProps { page: SellerStallPageResult }

export function StallPayoutsTab({ page }: StallPayoutsTabProps) {
  const { earnings } = page;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const data = earnings.payoutData && 'requests' in earnings.payoutData ? earnings.payoutData : null;
  const requests = data?.requests ?? [];
  const selected = requests.find((request) => request._id === selectedId) ?? null;
  if (earnings.error) return <Alert type="error" title="Could not load payouts" description={earnings.error} showIcon />;
  if (earnings.isLoading) return <Skeleton active paragraph={{ rows: 7 }} />;
  const rolling = data?.balance.rollingBalance.amount ?? 0;
  const requestStatus = (status: string) => ({ requested: 'Requested', 'on-hold': 'On hold', paid: 'Paid', cancelled: 'Cancelled', rejected: 'Rejected' }[status] ?? 'Requested');
  return <div className="space-y-5">
    {!data?.payoutGcashNumber && <Alert showIcon type="warning" title="Add your GCash payout number" description={<span>Save where admins should send payouts. <button type="button" className="font-medium underline" onClick={earnings.openDestination}>Add GCash details</button></span>} />}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StallStatCard label="Available balance" value={formatPrice(data?.eligibleAmount ?? 0)} note={`${data?.eligibleOrderCount ?? 0} eligible orders`} tone="sage" />
      <StallStatCard label="Rolling" value={formatPrice(rolling)} note={`${data?.balance.rollingBalance.orderCount ?? 0} orders in return window or on hold`} />
      <StallStatCard label="Requested" value={formatPrice(data?.balance.requestedBalance.amount ?? 0)} note={`${data?.balance.requestedBalance.orderCount ?? 0} orders in requested or held batches`} />
      <StallStatCard label="Paid out" value={formatPrice(data?.balance.paidOut.amount ?? 0)} note={`${data?.balance.paidOut.orderCount ?? 0} orders paid`} />
      <StallStatCard label="Next payout date" value={new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }).format(new Date(data?.nextPayoutAt ?? '1970-01-04T00:00:00.000Z'))} note="Requests open on Sundays" />
    </div>
    {earnings.activeRequest && <Alert showIcon type="info" title={`Requested on ${formatOrderTime(earnings.activeRequest.requestedAt)}. Waiting for the admin to send your transfer`} description={<div className="space-y-2"><p>{formatPrice(earnings.activeRequest.amount)} · {earnings.activeRequest.orderCount} orders</p><Button danger size="small" loading={earnings.isCancelling} onClick={() => void earnings.cancelPayout(earnings.activeRequest!._id)}>Cancel request</Button></div>} />}
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-stone-900">Request a payout</h2>
      <p className="mt-1 text-sm text-stone-500">One request includes every eligible GCash order. COD is paid directly to you and is never included.</p>
      <Button className="mt-4" type="primary" disabled={!earnings.canRequest} loading={earnings.isRequesting || earnings.isRequestPending} onClick={earnings.openPayout}>Request payout</Button>
      {!earnings.canRequest && <p className="mt-2 text-sm text-stone-500">{earnings.requestDisabledReason}</p>}
    </section>
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-stone-900">Batch history</h2>
      {!requests.length ? <div className="pt-4"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No payout requests yet." /></div> : <div className="mt-3 space-y-2">{requests.map((request) => <button key={request._id} className="flex w-full flex-col gap-2 rounded-xl bg-stone-50 p-3 text-left sm:flex-row sm:items-center sm:justify-between" onClick={() => setSelectedId(request._id)}><span><strong>{formatPrice(request.amount)}</strong> · {request.orderCount} orders · {formatOrderTime(request.requestedAt)}</span><Tag>{requestStatus(request.statusV2)}</Tag></button>)}</div>}
    </section>
    <Modal title="Request payout" open={earnings.payoutOpen} onCancel={earnings.closePayout} onOk={() => void earnings.requestPayout()} okText="Confirm request" confirmLoading={earnings.isRequesting || earnings.isRequestPending}>
      <div className="space-y-3 py-2"><p className="text-lg font-semibold">{formatPrice(data?.eligibleAmount ?? 0)} · {data?.eligibleOrderCount ?? 0} orders</p><p className="text-sm text-stone-600">This pays all eligible orders. Orders still in the return window stay for next Sunday.</p></div>
    </Modal>
    <Modal title="GCash payout details" open={earnings.destinationOpen} onCancel={earnings.closeDestination} onOk={() => void earnings.saveDestination()} confirmLoading={earnings.isSavingDestination} okText="Save details">
      <div className="space-y-3 py-2"><Input aria-label="GCash account name" placeholder="GCash account name" value={earnings.gcashName} onChange={event => earnings.setGcashName(event.target.value)} /><Input aria-label="GCash number" placeholder="09XX XXX XXXX" value={earnings.gcashNumber} onChange={event => earnings.setGcashNumber(event.target.value)} /></div>
    </Modal>
    <Drawer title="Payout batch details" open={Boolean(selected)} onClose={() => setSelectedId(null)} size="min(92vw, 540px)">
      {selected && <div className="space-y-4"><p className="text-2xl font-semibold">{formatPrice(selected.amount)} · {requestStatus(selected.statusV2)}</p>{selected.transferReference && <p>Reference: {selected.transferReference}</p>}{selected.orders.map(order => <div key={order.orderId} className="rounded-xl bg-stone-50 p-3 text-sm"><p className="font-mono">{formatOrderId(order.orderId)}</p><p className="mt-2">Items {formatPrice(order.itemsSubtotal)} · Delivery {formatPrice(order.deliveryFee)}</p><p>Commission −{formatPrice(order.commissionAmount)} · Net {formatPrice(order.netPayoutAmount)}</p><p className="mt-1 text-xs text-stone-500">Completed {formatOrderTime(order.completedAt)}</p></div>)}</div>}
    </Drawer>
  </div>;
}
