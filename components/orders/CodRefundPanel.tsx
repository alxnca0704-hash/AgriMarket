'use client';

import { useState } from 'react';
import { Alert, Button, Input, Modal, Skeleton, Timeline, Typography } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, SendOutlined } from '@ant-design/icons';
import { isValidGcashNumber } from '@/constants/refunds';
import { ORDER_ACTIONS, OrderAction } from '@/constants/orders';
import { formatOrderTime, formatPrice } from '@/lib/format';
import type { BuyerCodRefund } from '@/types/refund';

interface CodRefundPanelProps {
  refund: BuyerCodRefund | null;
  error?: string | null;
  orderId: string;
  isActionPending: (action: OrderAction, orderId: string) => boolean;
  returnCarrier: string;
  setReturnCarrier: (value: string) => void;
  returnTrackingNumber: string;
  setReturnTrackingNumber: (value: string) => void;
  onShipReturn: () => void | Promise<unknown>;
  onEscalate: () => Promise<unknown>;
  onConfirmReceived: () => Promise<unknown>;
  onDispute: (reason: string) => Promise<unknown>;
  onUpdateNumber: (number: string, name: string) => Promise<unknown>;
}

function deadline(value: number | null): string {
  return value ? formatOrderTime(new Date(value).toISOString()) : 'Not set';
}

export function CodRefundPanel({
  refund,
  error,
  orderId,
  isActionPending,
  returnCarrier,
  setReturnCarrier,
  returnTrackingNumber,
  setReturnTrackingNumber,
  onShipReturn,
  onEscalate,
  onConfirmReceived,
  onDispute,
  onUpdateNumber,
}: CodRefundPanelProps) {
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [updateOpen, setUpdateOpen] = useState(false);
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (error) return <Alert className="mt-4" type="error" showIcon title={error} />;
  if (!refund) return <div className="mt-4 rounded-xl bg-stone-50 p-4"><Skeleton active paragraph={{ rows: 2 }} /></div>;

  const pending = (action: OrderAction) => isActionPending(action, orderId);
  const shipDue = deadline(refund.buyerShipDueAt);
  const repaymentDue = deadline(refund.repaymentDueAt);
  const buyerResponseDue = deadline(refund.buyerResponseDueAt);

  const confirmReceived = async () => {
    const result = await onConfirmReceived();
    if (result === 'success') setConfirmOpen(false);
  };

  const submitDispute = async () => {
    if (disputeReason.trim().length < 5) return;
    const result = await onDispute(disputeReason.trim());
    if (result === 'success') setDisputeOpen(false);
  };

  const submitUpdate = async () => {
    if (!isValidGcashNumber(number) || name.trim().length < 2) return;
    const result = await onUpdateNumber(number.trim(), name.trim());
    if (result === 'success') setUpdateOpen(false);
  };

  return (
    <section className="mt-4 rounded-2xl bg-stone-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Seller-paid COD refund</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            This order was paid in cash. The seller refunds you directly through GCash after receiving the returned goods.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700">
          Refund {formatPrice(refund.total)}
        </span>
      </div>

      {refund.overdue && (
        <Alert className="mt-3" type="warning" showIcon title="This refund is past its deadline" description="The seller has been reminded and the admin can see the overdue record." />
      )}

      {refund.status === 'refund-requested' && (
        <Alert className="mt-3" type="info" showIcon title="Waiting for the seller" description={`The seller must approve or reject your return by ${deadline(refund.sellerResponseDueAt)}. If they do not respond, the request is escalated to the admin.`} />
      )}

      {refund.status === 'seller-rejected' && (
        <div className="mt-3 space-y-3 rounded-xl bg-white p-4">
          <p className="text-sm text-stone-700"><strong className="font-semibold">Seller rejected the return.</strong> {refund.sellerRejectReason}</p>
          <p className="text-xs text-stone-500">You can escalate this rejection once to the admin for review.</p>
          <Button type="primary" loading={pending(ORDER_ACTIONS.escalateCodRefund)} onClick={() => void onEscalate()} className="!rounded-xl">
            Escalate to admin
          </Button>
        </div>
      )}

      {refund.status === 'escalated' && (
        <Alert className="mt-3" type="warning" showIcon title="Waiting for the admin" description={refund.escalationReason || 'The admin is reviewing this return request.'} />
      )}

      {refund.status === 'return-approved' && (
        <div className="mt-3 space-y-3 rounded-xl bg-white p-4">
          <p className="text-sm text-stone-700"><strong className="font-semibold">Return approved.</strong> Ship the items to the seller using a trackable courier by {shipDue}.</p>
          <p className="text-sm text-stone-700"><strong className="font-semibold">Return address:</strong> {refund.returnAddress || 'Contact the seller for the return address.'}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input aria-label="Courier" placeholder="Courier (e.g. LBC)" value={returnCarrier} onChange={(event) => setReturnCarrier(event.target.value)} />
            <Input aria-label="Tracking number" placeholder="Tracking number" value={returnTrackingNumber} onChange={(event) => setReturnTrackingNumber(event.target.value)} />
          </div>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={pending(ORDER_ACTIONS.submitReturnShipment)}
            disabled={returnCarrier.trim().length < 2 || returnTrackingNumber.trim().length < 3}
            onClick={() => void onShipReturn()}
            className="!rounded-xl"
          >
            I shipped the return
          </Button>
        </div>
      )}

      {refund.status === 'return-in-transit' && (
        <Alert className="mt-3" type="info" showIcon title="Return in transit" description={`${refund.returnCarrier || 'Courier'} - Tracking ${refund.returnTrackingNumber || 'pending'}. The seller must confirm receipt before repaying you.`} />
      )}

      {refund.status === 'return-received' && (
        <div className="mt-3 space-y-3 rounded-xl bg-white p-4">
          <p className="text-sm text-stone-700"><strong className="font-semibold">The seller received the returned goods.</strong> They must send your refund by {repaymentDue}.</p>
          {refund.numberIssue ? (
            <>
              <Alert type="warning" showIcon title="The seller could not send the refund" description={`${refund.numberIssueReason} Update your GCash details so the seller can try again.`} />
              <Button type="primary" onClick={() => { setNumber(refund.refundNumber); setName(refund.refundName); setUpdateOpen(true); }} className="!rounded-xl">
                Update refund GCash details
              </Button>
            </>
          ) : (
            <p className="text-xs text-stone-500">Your refund will be sent to {refund.refundName || 'your GCash account'} ({refund.refundNumber}). Keep this number active. If the seller reports a problem, you can update it here.</p>
          )}
        </div>
      )}

      {refund.status === 'repayment-submitted' && (
        <div className="mt-3 space-y-3 rounded-xl bg-white p-4">
          <p className="text-sm text-stone-700"><strong className="font-semibold">The seller says they sent your refund.</strong> Confirm whether you received it by {buyerResponseDue}.</p>
          <dl className="grid grid-cols-1 gap-2 text-xs text-stone-500 sm:grid-cols-2">
            <div><dt>Reference</dt><dd className="mt-0.5 font-mono text-sm text-stone-800">{refund.repaymentReference}</dd></div>
            <div><dt>Submitted</dt><dd className="mt-0.5 text-sm text-stone-800">{refund.repaymentSubmittedAt ? formatOrderTime(refund.repaymentSubmittedAt) : 'Pending'}</dd></div>
          </dl>
          {refund.repaymentProofUrl && <a href={refund.repaymentProofUrl} target="_blank" rel="noreferrer" className="inline-block text-sm text-sage underline underline-offset-2">Open refund proof</a>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setConfirmOpen(true)} className="!rounded-xl">Yes, I received it</Button>
            <Button danger icon={<ExclamationCircleOutlined />} onClick={() => { setDisputeReason(''); setDisputeOpen(true); }} className="!rounded-xl">I did not receive it</Button>
          </div>
        </div>
      )}

      {refund.status === 'buyer-confirmed' && (
        <Alert className="mt-3" type="success" showIcon title="Refund receipt confirmed" description="The admin will record the refund and close the return." />
      )}

      {refund.status === 'buyer-disputed' && (
        <Alert className="mt-3" type="warning" showIcon title="Refund disputed" description={`The seller has been asked to send a corrected reference. ${refund.numberIssue ? 'Update your GCash details if the number was the problem.' : ''}`} />
      )}

      {refund.status === 'refunded' && (
        <Alert className="mt-3" type="success" showIcon title="Refund recorded" description={`The seller-paid GCash refund of ${formatPrice(refund.total)} has been recorded.`} />
      )}

      {refund.timeline.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Refund timeline</p>
          <Timeline
            items={[...refund.timeline].reverse().map((event) => ({
              color: event.actorRole === 'system' ? 'gray' : 'green',
              content: (
                <div>
                  <p className="text-sm text-stone-700">{event.label}</p>
                  <p className="text-xs text-stone-400">{formatOrderTime(event.at)}</p>
                  {event.reason && <p className="mt-1 text-xs text-stone-500">{event.reason}</p>}
                </div>
              ),
            }))}
          />
        </div>
      )}

      <Modal
        open={confirmOpen}
        title="Confirm refund received"
        onCancel={() => setConfirmOpen(false)}
        onOk={() => void confirmReceived()}
        okText="Yes, I received the refund"
        okButtonProps={{ loading: pending(ORDER_ACTIONS.confirmCodRefundReceived) }}
        cancelText="Not yet"
        cancelButtonProps={{ disabled: pending(ORDER_ACTIONS.confirmCodRefundReceived) }}
        width="min(92%, 420px)"
        centered
      >
        <Typography.Text type="secondary">
          Confirm only after the refund appears in your GCash account. If you did not receive it, dispute the refund instead.
        </Typography.Text>
      </Modal>

      <Modal
        open={disputeOpen}
        title="Dispute the refund"
        onCancel={() => setDisputeOpen(false)}
        onOk={() => void submitDispute()}
        okText="Submit dispute"
        okButtonProps={{ danger: true, disabled: disputeReason.trim().length < 5, loading: pending(ORDER_ACTIONS.disputeCodRefund) }}
        cancelText="Cancel"
        width="min(92%, 420px)"
        centered
      >
        <p className="mb-3 text-sm text-stone-500">Explain why you did not receive the refund. The seller will be asked to send a corrected reference.</p>
        <Input.TextArea rows={4} maxLength={500} showCount placeholder="e.g. The reference is not in my GCash history" value={disputeReason} onChange={(event) => setDisputeReason(event.target.value)} />
      </Modal>

      <Modal
        open={updateOpen}
        title="Update refund GCash details"
        onCancel={() => setUpdateOpen(false)}
        onOk={() => void submitUpdate()}
        okText="Save GCash details"
        okButtonProps={{ disabled: !isValidGcashNumber(number) || name.trim().length < 2, loading: pending(ORDER_ACTIONS.updateCodRefundNumber) }}
        cancelText="Cancel"
        width="min(92%, 420px)"
        centered
      >
        <div className="space-y-3">
          <div>
            <Typography.Text type="secondary" className="text-xs">GCash account name</Typography.Text>
            <Input maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Typography.Text type="secondary" className="text-xs">GCash mobile number</Typography.Text>
            <Input maxLength={13} inputMode="tel" value={number} onChange={(event) => setNumber(event.target.value)} className="mt-1.5" />
          </div>
          <p className="text-xs text-stone-500">Only change this when the seller reports a problem with your number or you need to use a different account.</p>
        </div>
      </Modal>
    </section>
  );
}
