'use client';

import { useState } from 'react';
import { Alert, Button, Input, Modal, Skeleton, Timeline, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { CheckCircleOutlined, EyeOutlined, SendOutlined, WarningOutlined } from '@ant-design/icons';
import { ORDER_ACTIONS, OrderAction } from '@/constants/orders';
import { formatOrderTime, formatPrice } from '@/lib/format';
import type { SellerCodRefund } from '@/types/refund';
import { useRefundEvidence } from '@/hooks/useRefundEvidence';

interface CodRefundPanelProps {
  refund: SellerCodRefund | null;
  error?: string | null;
  orderId: string;
  isActionPending: (action: OrderAction, orderId: string) => boolean;
  revealedNumber: string | null;
  isRevealing: boolean;
  onApprove: (returnAddress: string) => Promise<unknown>;
  onReject: (reason: string) => Promise<unknown>;
  onConfirmReceived: () => Promise<unknown>;
  onReportReturnIssue: (reason: string) => Promise<unknown>;
  onSubmitRepayment: (reference: string, proofUrl: string) => Promise<unknown>;
  onReportNumberIssue: (reason: string) => Promise<unknown>;
  onRevealNumber: () => Promise<string | null>;
}

function deadline(value: number | null): string {
  return value ? formatOrderTime(new Date(value).toISOString()) : 'Not set';
}

export function CodRefundPanel({
  refund,
  error,
  orderId,
  isActionPending,
  revealedNumber,
  isRevealing,
  onApprove,
  onReject,
  onConfirmReceived,
  onReportReturnIssue,
  onSubmitRepayment,
  onReportNumberIssue,
  onRevealNumber,
}: CodRefundPanelProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueReason, setIssueReason] = useState('');
  const [numberIssueOpen, setNumberIssueOpen] = useState(false);
  const [numberIssueReason, setNumberIssueReason] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [repaymentOverride, setRepaymentOverride] = useState<boolean | null>(null);
  const evidence = useRefundEvidence();

  if (error) return <Alert className="mt-4" type="error" showIcon title={error} />;
  if (!refund) return <div className="mt-4 rounded-xl bg-stone-50 p-4"><Skeleton active paragraph={{ rows: 3 }} /></div>;

  const pending = (action: OrderAction) => isActionPending(action, orderId);
  const repayable = refund.status === 'return-received' || refund.status === 'buyer-disputed';
  const referenceValue = reference ?? refund.repaymentReference ?? '';
  const repaymentOpen = repaymentOverride ?? (
    (refund.status === 'return-received' && Boolean(refund.repaymentRejectReason))
    || refund.status === 'buyer-disputed'
  );

  const approve = async () => {
    await onApprove('');
  };

  const reject = async () => {
    if (rejectReason.trim().length < 10) return;
    const result = await onReject(rejectReason.trim());
    if (result === 'success') setRejectOpen(false);
  };

  const reportIssue = async () => {
    if (issueReason.trim().length < 10) return;
    const result = await onReportReturnIssue(issueReason.trim());
    if (result === 'success') setIssueOpen(false);
  };

  const reportNumberIssue = async () => {
    if (numberIssueReason.trim().length < 5) return;
    const result = await onReportNumberIssue(numberIssueReason.trim());
    if (result === 'success') setNumberIssueOpen(false);
  };

  const submitRepayment = async () => {
    if (referenceValue.trim().length < 4 || evidence.files.length !== 1) return;
    const [proofUrl] = await evidence.upload();
    if (!proofUrl) return;
    const result = await onSubmitRepayment(referenceValue.trim(), proofUrl);
    if (result === 'success') {
      setRepaymentOverride(false);
      setReference('');
      evidence.setFiles([]);
    }
  };

  return (
    <section className="mt-4 rounded-2xl bg-stone-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Seller-funded COD refund</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            This buyer paid cash. You refund them directly through GCash after the returned goods arrive.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700">
          Refund {formatPrice(refund.total)}
        </span>
      </div>

      {refund.overdue && (
        <Alert className="mt-3" type="error" showIcon title="Refund overdue" description="Your payout requests can be blocked while this COD refund is overdue. Send the refund as soon as possible." />
      )}

      <div className="mt-4 rounded-xl bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Buyer reason</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{refund.reason}</p>
        {refund.evidenceUrls.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {refund.evidenceUrls.map((url, index) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="text-sm text-sage underline underline-offset-2">
                Open evidence {index + 1}
              </a>
            ))}
          </div>
        )}
        {refund.returnCarrier && refund.returnTrackingNumber && (
          <p className="mt-3 text-xs text-stone-500">
            Return: {refund.returnCarrier} - Tracking {refund.returnTrackingNumber}
          </p>
        )}
      </div>

      {refund.status === 'refund-requested' && (
        <div className="mt-3 space-y-3 rounded-xl bg-white p-4">
          <p className="text-sm text-stone-700"><strong className="font-semibold">Review the return request.</strong> If approved, the buyer will choose the courier and ship the items to your stall.</p>
          <div className="rounded-xl bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Return destination</p>
            <p className="mt-1 text-sm text-stone-800">{refund.defaultReturnAddress || 'Your registered stall address'}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="primary"
              loading={pending(ORDER_ACTIONS.approveCodReturn)}
              onClick={() => void approve()}
              className="!rounded-xl"
            >
              Approve return
            </Button>
            <Button danger onClick={() => { setRejectReason(''); setRejectOpen(true); }} className="!rounded-xl">
              Reject with reason
            </Button>
          </div>
        </div>
      )}

      {refund.status === 'seller-rejected' && (
        <Alert className="mt-3" type="warning" showIcon title="You rejected this return" description={refund.sellerRejectReason || 'The buyer may escalate this decision to the admin once.'} />
      )}

      {refund.status === 'escalated' && (
        <Alert className="mt-3" type="warning" showIcon title="Escalated to the admin" description={refund.returnIssue || 'The admin is reviewing this return. You will be notified of the decision.'} />
      )}

      {refund.status === 'return-approved' && (
        <Alert className="mt-3" type="info" showIcon title="Waiting for the buyer to ship" description={`The buyer must ship the return by ${deadline(refund.shippingDeadline)} to ${refund.returnAddress}.`} />
      )}

      {refund.status === 'return-in-transit' && (
        <div className="mt-3 space-y-3 rounded-xl bg-white p-4">
          <p className="text-sm text-stone-700"><strong className="font-semibold">Return in transit.</strong> Wait for the return to arrive. Confirm receipt after you have inspected the goods, then send the refund within 3 days.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={pending(ORDER_ACTIONS.confirmReturnReceived)}
              onClick={() => void onConfirmReceived()}
              className="!rounded-xl"
            >
              Confirm returned goods received
            </Button>
            <Button icon={<WarningOutlined />} onClick={() => { setIssueReason(''); setIssueOpen(true); }} className="!rounded-xl">
              Report a problem with the return
            </Button>
          </div>
        </div>
      )}

      {repayable && (
        <div className="mt-3 space-y-3 rounded-xl bg-white p-4">
          <p className="text-sm text-stone-700">
            <strong className="font-semibold">
              {refund.status === 'buyer-disputed' ? 'The buyer disputed the refund.' : 'Repay the buyer.'}
            </strong>{' '}
            {refund.status === 'buyer-disputed'
              ? refund.disputeReason
              : `Send ${formatPrice(refund.total)} through GCash by ${deadline(refund.repaymentDueAt)}.`}
          </p>
          {refund.repaymentRejectReason && (
            <Alert type="warning" showIcon title="Admin rejected the previous submission" description={refund.repaymentRejectReason} />
          )}
          {refund.numberIssue && (
            <Alert type="warning" showIcon title="You reported a problem with the number" description="The buyer has been asked to update their GCash details. The repayment deadline is paused." />
          )}
          <div className="rounded-xl bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Buyer GCash</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{refund.refundName || 'Name not provided'}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-stone-800">{revealedNumber || refund.maskedNumber || 'Number not provided'}</span>
              {refund.canRevealNumber && !revealedNumber && (
                <Button size="small" icon={<EyeOutlined />} loading={isRevealing} onClick={() => void onRevealNumber()} className="!rounded-lg">
                  Reveal number
                </Button>
              )}
            </div>
            {refund.canRevealNumber && !revealedNumber && (
              <p className="mt-1 text-xs text-stone-400">The full number is revealed only during the repayment step and the reveal is recorded.</p>
            )}
          </div>
          {!repaymentOpen ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="primary" icon={<SendOutlined />} onClick={() => setRepaymentOverride(true)} className="!rounded-xl">
                Submit refund reference and proof
              </Button>
              <Button onClick={() => { setNumberIssueReason(''); setNumberIssueOpen(true); }} className="!rounded-xl">
                Report a number problem
              </Button>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl bg-stone-50 p-3">
              <div>
                <Typography.Text type="secondary" className="text-xs">GCash reference number</Typography.Text>
                <Input maxLength={80} value={referenceValue} onChange={(event) => setReference(event.target.value)} placeholder="GCash transaction reference" className="mt-1.5" />
              </div>
              <div>
                <Typography.Text type="secondary" className="text-xs">Proof screenshot (1 file)</Typography.Text>
                <Upload
                  accept="image/jpeg,image/png,image/webp"
                  maxCount={1}
                  beforeUpload={(file) => {
                    evidence.setFiles([file]);
                    return false;
                  }}
                  onRemove={(file: UploadFile) => {
                    evidence.setFiles(evidence.files.filter((item) => item.name !== file.name));
                  }}
                  fileList={evidence.files.map((file, index) => ({ uid: `${file.name}-${index}`, name: file.name, status: 'done' as const }))}
                  className="mt-1.5 block"
                >
                  <Button className="!rounded-lg">Choose screenshot</Button>
                </Upload>
              </div>
              {evidence.error && <p className="text-sm text-error">{evidence.error}</p>}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="primary"
                  loading={pending(ORDER_ACTIONS.submitCodRepayment) || evidence.isUploading}
                  disabled={referenceValue.trim().length < 4 || evidence.files.length !== 1}
                  onClick={() => void submitRepayment()}
                  className="!rounded-xl"
                >
                  Submit refund proof
                </Button>
                <Button onClick={() => setRepaymentOverride(false)} className="!rounded-xl">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {refund.status === 'repayment-submitted' && (
        <div className="mt-3 rounded-xl bg-white p-4">
          <p className="text-sm text-stone-700"><strong className="font-semibold">Refund submitted.</strong> Waiting for the buyer to confirm receipt.</p>
          <p className="mt-2 text-xs text-stone-500">Reference <span className="font-mono text-stone-800">{refund.repaymentReference}</span></p>
          {refund.repaymentProofUrl && <a href={refund.repaymentProofUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-sage underline underline-offset-2">Open proof</a>}
        </div>
      )}

      {refund.status === 'buyer-confirmed' && (
        <Alert className="mt-3" type="success" showIcon title="Buyer confirmed the refund" description="The admin will record the refund and close the return." />
      )}

      {refund.status === 'refunded' && (
        <Alert className="mt-3" type="success" showIcon title="Refund recorded" description={`The seller-funded GCash refund of ${formatPrice(refund.total)} has been recorded.`} />
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
        open={rejectOpen}
        title="Reject the return"
        onCancel={() => setRejectOpen(false)}
        onOk={() => void reject()}
        okText="Reject return"
        okButtonProps={{ danger: true, disabled: rejectReason.trim().length < 10, loading: pending(ORDER_ACTIONS.rejectCodReturn) }}
        cancelText="Cancel"
        width="min(92%, 420px)"
        centered
      >
        <p className="mb-3 text-sm text-stone-500">The buyer can escalate this rejection to the admin once.</p>
        <Input.TextArea rows={4} maxLength={500} showCount placeholder="Explain why the return is rejected" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
      </Modal>

      <Modal
        open={issueOpen}
        title="Report a problem with the return"
        onCancel={() => setIssueOpen(false)}
        onOk={() => void reportIssue()}
        okText="Report to admin"
        okButtonProps={{ disabled: issueReason.trim().length < 10, loading: pending(ORDER_ACTIONS.reportCodReturnIssue) }}
        cancelText="Cancel"
        width="min(92%, 420px)"
        centered
      >
        <p className="mb-3 text-sm text-stone-500">Describe the problem with the returned goods or shipment. The admin will review it.</p>
        <Input.TextArea rows={4} maxLength={500} showCount placeholder="e.g. The box arrived empty or the items are missing" value={issueReason} onChange={(event) => setIssueReason(event.target.value)} />
      </Modal>

      <Modal
        open={numberIssueOpen}
        title="Report a refund number problem"
        onCancel={() => setNumberIssueOpen(false)}
        onOk={() => void reportNumberIssue()}
        okText="Ask buyer to update"
        okButtonProps={{ disabled: numberIssueReason.trim().length < 5, loading: pending(ORDER_ACTIONS.reportCodNumberIssue) }}
        cancelText="Cancel"
        width="min(92%, 420px)"
        centered
      >
        <p className="mb-3 text-sm text-stone-500">The repayment deadline pauses while the buyer checks and updates their GCash details.</p>
        <Input.TextArea rows={3} maxLength={500} showCount placeholder="e.g. The number is not registered on GCash" value={numberIssueReason} onChange={(event) => setNumberIssueReason(event.target.value)} />
      </Modal>
    </section>
  );
}
