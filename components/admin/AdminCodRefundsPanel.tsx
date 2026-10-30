'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Drawer, Empty, Image, Input, Modal, Skeleton, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AdminCodRefund, AdminCodRefundDetail } from '@/types/admin';
import { formatOrderTime, formatPrice } from '@/lib/format';

const STATUS_LABELS: Record<AdminCodRefund['status'], string> = {
  escalated: 'Escalated',
  'return-received': 'Return received',
  'repayment-submitted': 'Refund sent',
  'buyer-confirmed': 'Buyer confirmed',
  'buyer-disputed': 'Buyer disputed',
};

interface AdminCodRefundsPanelProps {
  refunds: AdminCodRefund[];
  visibleRefunds: AdminCodRefund[];
  isLoading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (orderId: string | null) => void;
  selectedRefund: AdminCodRefundDetail | null;
  isDetailLoading: boolean;
  detailError: string | null;
  onDecideEscalation: (orderId: string, decision: 'approve' | 'uphold', reason: string) => Promise<boolean>;
  onRejectRepayment: (orderId: string, reason: string) => Promise<boolean>;
  onResolveDispute: (orderId: string, decision: 'seller-owes' | 'close-seller', reason: string) => Promise<boolean>;
  onRecordRefund: (orderId: string, overrideReason?: string, duplicateOverrideReason?: string) => Promise<boolean>;
}

function deadline(value?: number): string {
  return value ? formatOrderTime(new Date(value).toISOString()) : 'Not set';
}

export function AdminCodRefundsPanel({
  refunds,
  visibleRefunds,
  isLoading,
  error,
  search,
  setSearch,
  selectedOrderId,
  setSelectedOrderId,
  selectedRefund,
  isDetailLoading,
  detailError,
  onDecideEscalation,
  onRejectRepayment,
  onResolveDispute,
  onRecordRefund,
}: AdminCodRefundsPanelProps) {
  const [busy, setBusy] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState<'approve' | 'uphold' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [disputeOpen, setDisputeOpen] = useState<'seller-owes' | 'close-seller' | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [recordOpen, setRecordOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [duplicateOverrideReason, setDuplicateOverrideReason] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const run = async (action: () => Promise<boolean>, close: () => void) => {
    if (busy) return;
    setBusy(true);
    try {
      if (await action()) close();
    } finally {
      setBusy(false);
    }
  };

  const columns: ColumnsType<AdminCodRefund> = [
    { title: 'Order ID', dataIndex: 'orderId', render: (id: string) => <span className="font-mono text-xs">#{id.slice(-8).toUpperCase()}</span> },
    { title: 'Buyer', dataIndex: 'buyerName' },
    { title: 'Seller', dataIndex: 'sellerName' },
    { title: 'Requested', dataIndex: 'requestedAt', render: (date: string) => formatOrderTime(date) },
    { title: 'Amount', dataIndex: 'total', align: 'right', render: (amount: number) => <span className="font-medium tabular-nums">{formatPrice(amount)}</span> },
    { title: 'Buyer response', dataIndex: 'buyerResponse', render: (response?: string) => response === 'received' ? 'Confirmed' : response === 'not-received' ? 'Disputed' : 'Waiting' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: AdminCodRefund['status'], refund) => (
        <span className="flex flex-wrap gap-1">
          <Tag className="m-0 border-0 bg-stone-100 text-stone-700">{STATUS_LABELS[status]}</Tag>
          {refund.overdue && <Tag className="m-0 border-0 bg-red-50 text-red-700">Overdue</Tag>}
        </span>
      ),
    },
  ];

  if (isLoading) return <Skeleton active paragraph={{ rows: 5 }} />;

  const buyerSilent = selectedRefund?.status === 'repayment-submitted'
    && selectedRefund.buyerResponseDueAt !== undefined
    && now > selectedRefund.buyerResponseDueAt;
  const canRecord = selectedRefund?.status === 'buyer-confirmed' || buyerSilent;

  return (
    <div className="space-y-4">
      {error && <Alert type="error" showIcon title={error} />}
      <Input.Search allowClear value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Order ID, buyer, seller, reference, or reason" className="sm:max-w-lg" />

      {visibleRefunds.length === 0 ? (
        <div className="rounded-2xl bg-white p-8">
          <Empty description={refunds.length ? 'No COD refunds match this search.' : 'No COD refunds need review.'} />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl bg-white p-2 md:block">
            <Table
              rowKey="orderId"
              columns={columns}
              dataSource={visibleRefunds}
              pagination={{ pageSize: 20 }}
              onRow={(record) => ({ onClick: () => setSelectedOrderId(record.orderId), className: 'cursor-pointer' })}
              scroll={{ x: 860 }}
            />
          </div>
          <div className="space-y-2 md:hidden">
            {visibleRefunds.map((refund) => (
              <button key={refund.orderId} type="button" onClick={() => setSelectedOrderId(refund.orderId)} className="w-full rounded-2xl bg-white p-4 text-left">
                <span className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs font-semibold text-stone-800">#{refund.orderId.slice(-8).toUpperCase()}</span>
                  <span className="flex flex-wrap gap-1">
                    <Tag className="m-0 border-0 bg-stone-100 text-stone-700">{STATUS_LABELS[refund.status]}</Tag>
                    {refund.overdue && <Tag className="m-0 border-0 bg-red-50 text-red-700">Overdue</Tag>}
                  </span>
                </span>
                <span className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-stone-600">{refund.buyerName} - {refund.sellerName}</span>
                  <strong className="shrink-0 tabular-nums text-stone-900">{formatPrice(refund.total)}</strong>
                </span>
                <span className="mt-1 block text-xs text-stone-400">Requested {formatOrderTime(refund.requestedAt)} - {refund.buyerResponse === 'received' ? 'Buyer confirmed' : refund.buyerResponse === 'not-received' ? 'Buyer disputed' : 'Waiting for buyer'}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <Drawer title="COD refund review" open={Boolean(selectedOrderId)} onClose={() => setSelectedOrderId(null)} size="large">
        {isDetailLoading && <Skeleton active paragraph={{ rows: 8 }} />}
        {detailError && <Alert type="error" showIcon title={detailError} />}
        {selectedRefund && !isDetailLoading && (
          <div className="space-y-5">
            <section className="rounded-2xl bg-stone-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-stone-500">Order ID</p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-stone-900">{selectedRefund.orderId}</p>
                </div>
                <span className="flex flex-wrap gap-1">
                  <Tag className="m-0 border-0 bg-white text-stone-700">{STATUS_LABELS[selectedRefund.status]}</Tag>
                  {selectedRefund.overdue && <Tag className="m-0 border-0 bg-red-50 text-red-700">Overdue</Tag>}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Buyer" value={selectedRefund.buyerName} />
                <Field label="Seller" value={selectedRefund.sellerName} />
                <Field label="Order total" value={formatPrice(selectedRefund.total)} />
                <Field label="Requested" value={formatOrderTime(selectedRefund.requestedAt)} />
                <Field label="Payment method" value={selectedRefund.paymentMethod.toUpperCase()} />
                <Field label="Payment reference" value={selectedRefund.paymentReference} mono />
              </dl>
            </section>

            <section className="rounded-xl bg-stone-50 p-3 text-sm text-stone-700">{selectedRefund.items.map((item) => <p key={`${item.productId}:${item.variantId ?? ''}`}>{item.name} - {item.variantName ?? item.unit} x {item.qty}</p>)}</section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-900">Refund destination</h3>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="GCash account name" value={selectedRefund.refundName || selectedRefund.refundGcashName || 'Not provided'} />
                <Field label="GCash number" value={selectedRefund.refundGcashNumber || 'Not provided'} mono />
                <Field label="Seller response due" value={deadline(selectedRefund.sellerResponseDueAt)} />
                <Field label="Buyer ship due" value={deadline(selectedRefund.buyerShipDueAt)} />
                <Field label="Repayment due" value={deadline(selectedRefund.repaymentDueAt)} />
                <Field label="Buyer response due" value={deadline(selectedRefund.buyerResponseDueAt)} />
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-stone-900">Buyer reason</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-600">{selectedRefund.reason}</p>
              {selectedRefund.evidenceUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {selectedRefund.evidenceUrls.map((url, index) => (
                    <div key={url} className="w-full max-w-52 overflow-hidden rounded-xl bg-stone-50">
                      {url.includes('/video/upload/') ? (
                        <video src={url} controls preload="metadata" className="aspect-video w-full object-cover">Your browser does not support video playback.</video>
                      ) : (
                        <Image src={url} alt={`Refund evidence ${index + 1}`} width={208} height={160} className="!h-40 !w-full object-cover" preview />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {(selectedRefund.returnAddress || selectedRefund.returnTrackingNumber) && (
              <section className="rounded-2xl bg-stone-50 p-4">
                <h3 className="text-sm font-semibold text-stone-900">Return shipment</h3>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Return address" value={selectedRefund.returnAddress || 'Not provided'} />
                  <Field label="Courier" value={selectedRefund.returnCarrier || 'Not provided'} />
                  <Field label="Tracking number" value={selectedRefund.returnTrackingNumber || 'Not provided'} mono />
                  {selectedRefund.returnIssue && <Field label="Reported issue" value={selectedRefund.returnIssue} />}
                </dl>
              </section>
            )}

            {(selectedRefund.sellerRejectReason || selectedRefund.escalationReason || selectedRefund.disputeReason || selectedRefund.closedReason) && (
              <section className="space-y-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                {selectedRefund.sellerRejectReason && <p><strong className="font-semibold">Seller rejection:</strong> {selectedRefund.sellerRejectReason}</p>}
                {selectedRefund.escalationReason && <p><strong className="font-semibold">Escalation:</strong> {selectedRefund.escalationReason}</p>}
                {selectedRefund.disputeReason && <p><strong className="font-semibold">Buyer dispute:</strong> {selectedRefund.disputeReason}</p>}
                {selectedRefund.closedReason && <p><strong className="font-semibold">Closed:</strong> {selectedRefund.closedReason}</p>}
              </section>
            )}

            {(selectedRefund.repaymentReference || selectedRefund.repaymentProofUrl) && (
              <section className="rounded-2xl bg-stone-50 p-4">
                <h3 className="text-sm font-semibold text-stone-900">Seller refund submission</h3>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Reference" value={selectedRefund.repaymentReference || 'Not submitted'} mono />
                  <Field label="Buyer response" value={selectedRefund.buyerResponse === 'received' ? 'Received' : selectedRefund.buyerResponse === 'not-received' ? 'Not received' : 'Waiting'} />
                </dl>
                {selectedRefund.repaymentProofUrl && (
                  <a href={selectedRefund.repaymentProofUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-sage underline underline-offset-2">Open refund proof</a>
                )}
              </section>
            )}

            {selectedRefund.status === 'escalated' && (
              <div className="flex flex-wrap gap-2">
                <Button type="primary" onClick={() => { setDecisionReason(''); setDecisionOpen('approve'); }} className="!rounded-xl">Approve return</Button>
                <Button danger onClick={() => { setDecisionReason(''); setDecisionOpen('uphold'); }} className="!rounded-xl">Uphold seller rejection</Button>
              </div>
            )}

            {selectedRefund.status === 'return-received' && (
              <Alert type="info" showIcon title="Waiting for the seller to repay" description={selectedRefund.overdue ? 'The seller is past the repayment deadline. Payouts are blocked until this is resolved.' : `The seller must send the refund by ${deadline(selectedRefund.repaymentDueAt)}.`} />
            )}

            {selectedRefund.status === 'repayment-submitted' && (
              <div className="flex flex-wrap gap-2">
                {canRecord && <Button type="primary" onClick={() => { setOverrideReason(''); setDuplicateOverrideReason(''); setRecordOpen(true); }} className="!rounded-xl">Record refund</Button>}
                <Button danger onClick={() => { setRejectReason(''); setRejectOpen(true); }} className="!rounded-xl">Reject submission</Button>
              </div>
            )}

            {selectedRefund.status === 'buyer-confirmed' && (
              <div className="flex flex-wrap gap-2">
                <Button type="primary" onClick={() => { setOverrideReason(''); setDuplicateOverrideReason(''); setRecordOpen(true); }} className="!rounded-xl">Record refund</Button>
              </div>
            )}

            {selectedRefund.status === 'buyer-disputed' && (
              <div className="space-y-3">
                <Alert type="warning" showIcon title="Buyer says the refund was not received" description={`${selectedRefund.disputeReason} Dispute count: ${selectedRefund.disputeCount}.`} />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => { setDisputeReason(''); setDisputeOpen('seller-owes'); }} className="!rounded-xl">Seller still owes refund</Button>
                  <Button danger onClick={() => { setDisputeReason(''); setDisputeOpen('close-seller'); }} className="!rounded-xl">Close in seller&apos;s favor</Button>
                </div>
              </div>
            )}

            {selectedRefund.timeline.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-stone-900">Timeline</h3>
                <div className="space-y-2">
                  {[...selectedRefund.timeline].reverse().map((event, index) => (
                    <div key={`${event.at}-${index}`} className="rounded-xl bg-stone-50 p-3">
                      <p className="text-sm text-stone-700">{event.label}</p>
                      <p className="mt-1 text-xs text-stone-400">{formatOrderTime(event.at)} - {event.actorRole}</p>
                      {event.reason && <p className="mt-1 text-xs text-stone-500">{event.reason}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        open={decisionOpen !== null}
        title={decisionOpen === 'approve' ? 'Approve the return' : 'Uphold the seller rejection'}
        onCancel={() => setDecisionOpen(null)}
        onOk={() => decisionOpen && selectedRefund && void run(
          () => onDecideEscalation(selectedRefund.orderId, decisionOpen, decisionReason),
          () => setDecisionOpen(null)
        )}
        okText={decisionOpen === 'approve' ? 'Approve return' : 'Uphold and close'}
        okButtonProps={{ danger: decisionOpen === 'uphold', disabled: decisionOpen === 'uphold' && decisionReason.trim().length < 5, loading: busy }}
        cancelText="Cancel"
        width="min(92%, 440px)"
        centered
      >
        <p className="mb-3 text-sm text-stone-500">
          {decisionOpen === 'approve'
            ? 'The buyer will be told to ship the goods back. The seller must repay after receiving them.'
            : 'The buyer will be told the request is closed. A written reason is required.'}
        </p>
        <Input.TextArea rows={4} maxLength={500} showCount placeholder={decisionOpen === 'approve' ? 'Optional review note' : 'Reason for upholding the rejection'} value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} />
      </Modal>

      <Modal
        open={rejectOpen}
        title="Reject the refund submission"
        onCancel={() => setRejectOpen(false)}
        onOk={() => selectedRefund && void run(() => onRejectRepayment(selectedRefund.orderId, rejectReason), () => setRejectOpen(false))}
        okText="Reject submission"
        okButtonProps={{ danger: true, disabled: rejectReason.trim().length < 5, loading: busy }}
        cancelText="Cancel"
        width="min(92%, 440px)"
        centered
      >
        <p className="mb-3 text-sm text-stone-500">The seller goes back to the repayment step and can submit a corrected reference.</p>
        <Input.TextArea rows={4} maxLength={500} showCount placeholder="Explain why the submission is rejected" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
      </Modal>

      <Modal
        open={disputeOpen !== null}
        title={disputeOpen === 'seller-owes' ? 'Seller still owes the refund' : 'Close in the seller\'s favor'}
        onCancel={() => setDisputeOpen(null)}
        onOk={() => disputeOpen && selectedRefund && void run(
          () => onResolveDispute(selectedRefund.orderId, disputeOpen, disputeReason),
          () => setDisputeOpen(null)
        )}
        okText={disputeOpen === 'seller-owes' ? 'Record decision' : 'Close refund'}
        okButtonProps={{ danger: disputeOpen === 'close-seller', disabled: disputeReason.trim().length < 5, loading: busy }}
        cancelText="Cancel"
        width="min(92%, 440px)"
        centered
      >
        <p className="mb-3 text-sm text-stone-500">
          {disputeOpen === 'seller-owes'
            ? 'The refund stays open and the seller remains blocked from payouts until it is paid.'
            : 'The return is closed and the buyer is notified. This decision is audited.'}
        </p>
        <Input.TextArea rows={4} maxLength={500} showCount placeholder="Written decision reason" value={disputeReason} onChange={(event) => setDisputeReason(event.target.value)} />
      </Modal>

      <Modal
        open={recordOpen}
        title="Record the seller-paid refund"
        onCancel={() => setRecordOpen(false)}
        onOk={() => selectedRefund && void run(
          () => onRecordRefund(selectedRefund.orderId, overrideReason, duplicateOverrideReason),
          () => setRecordOpen(false)
        )}
        okText="Record refund"
        okButtonProps={{ disabled: buyerSilent && overrideReason.trim().length < 5, loading: busy }}
        cancelText="Cancel"
        width="min(92%, 480px)"
        centered
      >
        <div className="space-y-3">
          <p className="text-sm text-stone-600">
            Confirm the seller&apos;s GCash refund of <strong className="text-stone-900">{formatPrice(selectedRefund?.total ?? 0)}</strong> has been received.
          </p>
          <dl className="grid grid-cols-1 gap-2 rounded-xl bg-stone-50 p-3 text-sm sm:grid-cols-2">
            <Field label="Reference" value={selectedRefund?.repaymentReference || 'Not submitted'} mono />
            <Field label="Buyer response" value={selectedRefund?.buyerResponse === 'received' ? 'Confirmed' : buyerSilent ? 'No response past deadline' : 'Not confirmed'} />
          </dl>
          {buyerSilent && (
            <div>
              <label htmlFor="codOverrideReason" className="mb-1.5 block text-sm font-medium text-stone-700">Override reason (required)</label>
              <Input.TextArea id="codOverrideReason" rows={3} maxLength={500} showCount placeholder="Explain why the refund is being recorded without buyer confirmation" value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} />
            </div>
          )}
          <div>
            <label htmlFor="codDuplicateOverrideReason" className="mb-1.5 block text-sm font-medium text-stone-700">Duplicate reference override (only if prompted)</label>
            <Input.TextArea id="codDuplicateOverrideReason" rows={2} maxLength={500} showCount placeholder="Only needed when this GCash reference was used on another refund" value={duplicateOverrideReason} onChange={(event) => setDuplicateOverrideReason(event.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd className={`mt-1 break-words text-sm font-medium text-stone-800 ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}
