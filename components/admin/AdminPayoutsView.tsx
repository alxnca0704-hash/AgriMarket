'use client';

import { useState } from 'react';
import { Alert, Button, Input, Modal, Skeleton, Tag } from 'antd';
import { useAdminPayouts } from '@/hooks/useAdminPayouts';
import { formatOrderTime, formatPrice } from '@/lib/format';

export function AdminPayoutsView() {
  const payouts = useAdminPayouts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transferReference, setTransferReference] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const selected = payouts.payouts.find((item) => item._id === selectedId);

  const markPaid = async () => {
    if (!selectedId) return;
    const success = await payouts.recordPaid(selectedId, transferReference.trim());
    if (success) setSelectedId(null);
  };
  const reject = async () => {
    if (!rejectId) return;
    const success = await payouts.reject(rejectId, reason.trim());
    if (success) setRejectId(null);
  };

  if (payouts.isLoading) return <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6"><Skeleton active paragraph={{ rows: 6 }} /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <div><p className="text-xs font-medium uppercase tracking-wide text-stone-400">Finance</p><h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Payout requests</h1><p className="mt-1 text-sm text-stone-500">Review seller GCash details and stall verification before recording a transfer.</p></div>
      {payouts.error && <Alert type="error" showIcon title={payouts.error} />}
      {payouts.payouts.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center shadow-sm"><p className="text-sm text-stone-500">No payout requests are waiting for review.</p></div> : <div className="space-y-4">{payouts.payouts.map((payout) => <article key={payout._id} className="space-y-5 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-stone-400">Requested by {payout.sellerName}</p><h2 className="mt-1 text-xl font-semibold text-stone-900">{formatPrice(payout.amount)}</h2><p className="mt-1 text-xs text-stone-400">{payout.orderIds.length} orders · Requested {formatOrderTime(payout.requestedAt)}</p></div><Tag color={payout.verificationStatus === 'verified' ? 'success' : 'warning'}>{payout.verificationStatus === 'verified' ? 'Stall verified' : `Stall ${payout.verificationStatus}`}</Tag></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-xl bg-stone-50/80 p-4"><h3 className="mb-3 text-sm font-semibold text-stone-800">Stall review</h3><dl className="space-y-2 text-sm"><div><dt className="text-xs text-stone-400">Stall</dt><dd className="font-medium text-stone-800">{payout.stallName} · {payout.farmType}</dd></div><div><dt className="text-xs text-stone-400">Address</dt><dd className="text-stone-700">{payout.location}</dd></div><div><dt className="text-xs text-stone-400">Submitted verification ID</dt><dd className="text-stone-700">{payout.idType} · {payout.idNumber}</dd></div><div><dt className="text-xs text-stone-400">Verification status</dt><dd className="text-stone-700">{payout.verificationStatus}</dd></div></dl></section>
          <section className="rounded-xl bg-stone-50/80 p-4"><h3 className="mb-3 text-sm font-semibold text-stone-800">GCash payout destination</h3><dl className="space-y-2 text-sm"><div><dt className="text-xs text-stone-400">Account name</dt><dd className="font-medium text-stone-800">{payout.gcashName}</dd></div><div><dt className="text-xs text-stone-400">Mobile number</dt><dd className="font-medium text-stone-800">{payout.gcashNumber}</dd></div></dl></section>
        </div>
        <section className="rounded-xl bg-stone-50/80 p-4"><h3 className="mb-3 text-sm font-semibold text-stone-800">Orders included in this request</h3>{payout.orderSnapshots.length > 0 ? <div className="space-y-2">{payout.orderSnapshots.map((order) => <div key={order.orderId} className="flex flex-col justify-between gap-2 rounded-lg bg-white p-3 sm:flex-row sm:items-center"><div className="min-w-0"><p className="break-all font-mono text-xs text-stone-700">{order.orderId}</p><p className="mt-1 text-xs text-stone-500">Placed {formatOrderTime(order.placedAt)} · Delivered {formatOrderTime(order.deliveredAt)} · {order.paymentMethod === 'gcash' ? 'GCash' : 'Cash on Delivery'}</p></div><span className="shrink-0 text-sm font-semibold text-stone-900">{formatPrice(order.amount)}</span></div>)}</div> : <p className="break-all font-mono text-xs text-stone-600">{payout.orderIds.join(', ')}</p>}</section>
        {payout.verificationStatus !== 'verified' && <Alert type="warning" showIcon title="Stall verification is still pending." description="Review the submitted identity and stall details as part of this payout decision." />}
        {!payout.allOrdersGcash && <Alert type="warning" showIcon title="This request includes COD orders." description="COD is handed to the seller in cash on delivery and cannot be paid through this GCash payout. Reject this request." />}
        <Alert type="info" showIcon title="Return holds are checked again before payout." description="Orders with an open return request cannot be paid. The buyer return window must also have elapsed before an order can enter this request." />
        <div className="flex flex-wrap justify-end gap-2"><Button danger onClick={() => { setReason(''); setRejectId(payout._id); }}>Reject with reason</Button><Button type="primary" disabled={!payout.allOrdersGcash} onClick={() => { setTransferReference(''); setSelectedId(payout._id); }}>Record GCash payout</Button></div>
      </article>)}</div>}

      <Modal open={!!selectedId} title="Record GCash payout" width="min(92%, 440px)" onCancel={() => setSelectedId(null)} onOk={() => void markPaid()} okText="Confirm transfer sent" okButtonProps={{ loading: payouts.isSubmitting, disabled: transferReference.trim().length < 3 }}>
        <div className="space-y-3 pt-1"><p className="text-sm text-stone-600">Confirm that the GCash transfer has been sent to <strong className="text-stone-900">{selected?.gcashName} · {selected?.gcashNumber}</strong>.</p><p className="text-sm font-semibold text-stone-900">Amount: {formatPrice(selected?.amount ?? 0)}</p><Input maxLength={100} placeholder="GCash transfer reference" value={transferReference} onChange={(event) => setTransferReference(event.target.value)} /></div>
      </Modal>
      <Modal open={!!rejectId} title="Reject payout request" width="min(92%, 440px)" onCancel={() => setRejectId(null)} onOk={() => void reject()} okText="Reject request" okButtonProps={{ danger: true, loading: payouts.isSubmitting, disabled: reason.trim().length < 5 || reason.trim().length > 500 }}><div className="space-y-2 pt-1"><label htmlFor="payout-rejection-reason" className="text-sm text-stone-600">Explain why this payout cannot be approved.</label><Input.TextArea id="payout-rejection-reason" rows={4} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} /></div></Modal>
    </div>
  );
}
