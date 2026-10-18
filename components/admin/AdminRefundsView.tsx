'use client';

import { Alert, Button, Empty, Image, Input, Modal, Select, Skeleton, Tag } from 'antd';
import { useState } from 'react';
import { useAdminRefunds } from '@/hooks/useAdminRefunds';
import { RefundDisbursementMethod } from '@/types/admin';
import { formatOrderTime, formatPrice } from '@/lib/format';

export function AdminRefundsView() {
  const { refunds, isLoading, error, approve, reject, completeRefund } = useAdminRefunds();
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReference, setRefundReference] = useState('');
  const [refundMethod, setRefundMethod] = useState<RefundDisbursementMethod>('gcash');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const submit = async (orderId: string, action: () => Promise<boolean>, close: () => void) => {
    setBusyOrderId(orderId);
    try { if (await action()) close(); } finally { setBusyOrderId(null); }
  };

  if (isLoading) {
    return <div className="mx-auto max-w-5xl space-y-5 px-4 py-8"><Skeleton active paragraph={{ rows: 5 }} /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">Returns</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-stone-900">Review return requests</h1>
          <Tag color="gold">{refunds.length} pending</Tag>
        </div>
        <p className="text-sm text-stone-500">Match each order ID with its payment reference in your transaction history. The order ID links the reference to the correct order.</p>
      </header>

      {error && <Alert type="error" showIcon title={error} />}
      {refunds.length === 0 ? (
        <div className="rounded-2xl bg-white p-8"><Empty description="No return requests need review." /></div>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <article key={refund.orderId} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-stone-400">Order ID</p>
                  <p className="break-all font-mono text-sm font-semibold text-stone-900">{refund.orderId}</p>
                </div>
                <Tag color={refund.status === 'return-received' ? 'cyan' : refund.status === 'return-in-transit' ? 'processing' : refund.status === 'return-approved' ? 'blue' : 'orange'}>{refund.status === 'refund-requested' ? 'Return Requested' : refund.status === 'return-approved' ? 'Return Approved' : refund.status === 'return-in-transit' ? 'Return In Transit' : 'Return Received'}</Tag>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-stone-400">Payment reference</p>
                  <p className="break-all font-mono text-sm font-semibold text-stone-900">{refund.paymentReference}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">Payment method</p>
                  <p className="text-sm font-medium uppercase text-stone-800">{refund.paymentMethod}</p>
                </div>
                <p className="text-sm text-stone-600">Buyer: <strong className="text-stone-900">{refund.buyerName}</strong></p>
                <p className="text-sm text-stone-600">Buyer phone / GCash: {refund.buyerMobileNumber ? <a className="font-semibold text-stone-900 underline underline-offset-2" href={`tel:${refund.buyerMobileNumber}`}>{refund.buyerMobileNumber}</a> : <strong className="text-amber-800">Not provided</strong>}</p>
                <p className="text-sm text-stone-600">Seller: <strong className="text-stone-900">{refund.sellerName}</strong></p>
                <p className="text-sm text-stone-600">Order total: <strong className="text-stone-900">{formatPrice(refund.total)}</strong></p>
                <p className="text-xs text-stone-400 sm:text-right">Submitted {formatOrderTime(refund.requestedAt)}</p>
              </div>

              <p className="text-sm leading-relaxed text-stone-600"><strong className="text-stone-800">Buyer reason: </strong>{refund.reason}</p>
              {refund.evidenceUrls.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-stone-400">Buyer evidence</h3>
                  <div className="flex flex-wrap gap-3">
                    {refund.evidenceUrls.map((url, index) => (
                      <div key={url} className="w-full max-w-52 overflow-hidden rounded-xl bg-stone-50">
                        {url.includes('/video/upload/') ? (
                          <video src={url} controls preload="metadata" className="aspect-video w-full object-cover">
                            Your browser does not support video playback.
                          </video>
                        ) : (
                          <Image
                            src={url}
                            alt={`Refund evidence ${index + 1}`}
                            width={208}
                            height={160}
                            className="!h-40 !w-full object-cover"
                            preview
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {refund.status === 'refund-requested' && (
                <div className="flex flex-wrap gap-2">
                  <Button type="primary" loading={busyOrderId === refund.orderId} onClick={() => void submit(refund.orderId, () => approve(refund.orderId), () => undefined)}>Approve return</Button>
                  <Button danger loading={busyOrderId === refund.orderId} onClick={() => { setRejectReason(''); setRejectOrderId(refund.orderId); }}>Reject with reason</Button>
                </div>
              )}
              {refund.status === 'return-approved' && <Alert type="info" showIcon title="Waiting for buyer to ship the return" description={`Return address: ${refund.returnAddress}`} />}
              {refund.status === 'return-in-transit' && <Alert type="warning" showIcon title="Waiting for seller receipt confirmation" description={`${refund.returnCarrier} · Tracking ${refund.returnTrackingNumber}`} />}
              {refund.status === 'return-received' && <Button type="primary" onClick={() => { setRefundReference(''); setRefundMethod(refund.buyerMobileNumber ? 'gcash' : 'cash'); setRefundOrderId(refund.orderId); }}>Record refund</Button>}
            </article>
          ))}
        </div>
      )}
      <Modal open={!!rejectOrderId} title="Reject return request" width="min(92%, 440px)" onCancel={() => setRejectOrderId(null)} onOk={() => rejectOrderId && void submit(rejectOrderId, () => reject(rejectOrderId, rejectReason.trim()), () => setRejectOrderId(null))} okText="Reject request" okButtonProps={{ danger: true, disabled: rejectReason.trim().length < 5, loading: busyOrderId === rejectOrderId }}>
        <Input.TextArea rows={4} maxLength={500} showCount placeholder="Explain why this return is rejected (at least 5 characters)." value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
      </Modal>
      <Modal open={!!refundOrderId} title="Record refund" width="min(92%, 440px)" onCancel={() => setRefundOrderId(null)} onOk={() => refundOrderId && void submit(refundOrderId, () => completeRefund(refundOrderId, refundReference.trim(), refundMethod), () => setRefundOrderId(null))} okText="Confirm refund sent" okButtonProps={{ disabled: refundReference.trim().length < 3 || (refundMethod === 'gcash' && !refunds.find((item) => item.orderId === refundOrderId)?.buyerMobileNumber), loading: busyOrderId === refundOrderId }}>
        {(() => {
          const selectedRefund = refunds.find((item) => item.orderId === refundOrderId);
          return (
            <div className="mb-3 space-y-2">
                <p className="text-sm text-stone-500">Refund amount: <strong className="text-stone-800">{selectedRefund ? formatPrice(selectedRefund.total) : '—'}</strong></p>
                {selectedRefund?.paymentMethod === 'cod' && <Alert type="warning" showIcon title="COD was paid in cash on delivery" description="This refund is a separate outgoing payment. Confirm the refund funds are available before recording it." />}
                <p className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  Buyer phone / GCash: {selectedRefund?.buyerMobileNumber ? <a className="font-semibold text-stone-900 underline underline-offset-2" href={`tel:${selectedRefund.buyerMobileNumber}`}>{selectedRefund.buyerMobileNumber}</a> : <strong className="text-amber-800">Not provided — contact the buyer before refunding.</strong>}
                </p>
                <Select<RefundDisbursementMethod> className="w-full" value={refundMethod} onChange={setRefundMethod} options={[{ value: 'gcash', label: 'GCash transfer to buyer number' }, { value: 'cash', label: 'Cash handoff to buyer' }]} />
                <p className="text-xs text-stone-400">Payment method for original order: {selectedRefund?.paymentMethod.toUpperCase()}</p>
                <p className="text-xs text-stone-400">After the refund is sent, enter its GCash transaction reference or cash receipt reference below. Recording the refund releases the seller payout hold.</p>
            </div>
          );
        })()}
        <Input maxLength={100} placeholder="Refund transaction reference" value={refundReference} onChange={(event) => setRefundReference(event.target.value)} />
      </Modal>
    </div>
  );
}
