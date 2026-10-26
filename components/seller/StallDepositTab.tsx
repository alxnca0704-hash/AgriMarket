'use client';

import { App, Alert, Button, Empty, Image, Input, InputNumber, Skeleton, Tag } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { STALL_DEPOSIT_AMOUNT } from '@/constants/deposits';
import { formatOrderTime, formatPrice } from '@/lib/format';
import type { SellerStallPageResult } from '@/hooks/useSellerStallPage';
import { StallStatCard } from '@/components/seller/StallStatCard';

const depositStatusMeta = {
  unpaid: { label: 'Unpaid', color: 'red' },
  partial: { label: 'Partial', color: 'gold' },
  paid: { label: 'Paid', color: 'green' },
} as const;

const submissionStatusMeta = {
  pending: { label: 'Under review', color: 'gold' },
  approved: { label: 'Approved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
} as const;

export interface StallDepositTabProps {
  page: SellerStallPageResult;
}

export function StallDepositTab({ page }: StallDepositTabProps) {
  const { deposit } = page;
  const { message } = App.useApp();
  const data = deposit.data;
  const paid = data?.stall.depositPaidAmount ?? 0;
  const remaining = deposit.remaining;
  const pendingSubmission = data?.submissions.find((item) => item.status === 'pending') ?? null;
  const statusKey = data?.stall.depositStatus === 'paid' ? 'paid' : data?.stall.depositStatus === 'partial' ? 'partial' : 'unpaid';
  const status = depositStatusMeta[statusKey];
  const deadlineText = statusKey === 'paid'
    ? 'Deposit complete'
    : data?.stall.overdue
      ? 'Past the deadline'
      : `${deposit.deadlineDaysLeft} day${deposit.deadlineDaysLeft === 1 ? '' : 's'} left`;

  if (deposit.error) {
    return <Alert type="error" title="Could not load your deposit" description={deposit.error} showIcon />;
  }
  if (deposit.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  const copyGcashNumber = async () => {
    if (!data?.gcash) return;
    try {
      await navigator.clipboard.writeText(data.gcash.number);
      message.success('GCash number copied');
    } catch {
      message.error('Could not copy the GCash number.');
    }
  };

  const canSubmit = remaining > 0 && !deposit.pending && (deposit.amount ?? 0) > 0 && (deposit.amount ?? 0) <= remaining && deposit.referenceNumber.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StallStatCard
          label="Required deposit"
          value={formatPrice(STALL_DEPOSIT_AMOUNT)}
          note="One-time security deposit"
        />
        <StallStatCard
          label="Paid"
          value={formatPrice(paid)}
          note={data?.stall.overdue ? 'Deadline passed' : 'Approved by admin'}
          tone={statusKey === 'paid' ? 'sage' : 'default'}
        />
        <StallStatCard
          label="Remaining"
          value={formatPrice(remaining)}
          note={deadlineText}
          tone={statusKey === 'paid' ? 'sage' : data?.stall.overdue ? 'error' : 'default'}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Tag color={deposit.pending ? 'gold' : status.color}>{deposit.pending ? 'Under review' : status.label}</Tag>
          <span className="text-sm text-stone-500">{deadlineText}</span>
        </div>
        <p className="text-xs leading-5 text-stone-500">
          Your deposit is separate from sales and is not withdrawable. It is refundable after 14 days with no active orders.
        </p>
      </div>

      {deposit.pending && pendingSubmission ? (
        <Alert
          type="info"
          showIcon
          title="Deposit submitted for review"
          description={`${formatPrice(pendingSubmission.amount)} · Ref ${pendingSubmission.referenceNumber}. You can submit another top-up after this is reviewed.`}
        />
      ) : null}

      {statusKey === 'paid' ? (
        <Alert type="success" showIcon title="Deposit complete" description="Your stall deposit has been fully paid." />
      ) : null}

      {remaining > 0 && !deposit.pending ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-stone-900">{paid > 0 ? 'Top up your deposit' : 'Pay your deposit'}</h3>
          <p className="mt-1 text-sm text-stone-500">Send GCash, then submit the amount and reference number.</p>

          {data?.gcash ? (
            <div className="mt-4 flex flex-col gap-3 rounded-xl bg-stone-50 p-4 sm:flex-row sm:items-center">
              <Image src={data.gcash.qrUrl} alt="GCash QR code" width={128} preview={false} className="!rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-stone-500">GCash number</p>
                <p className="mt-1 break-all font-mono text-base font-semibold text-stone-900">{data.gcash.number}</p>
                <Button size="small" icon={<CopyOutlined />} onClick={() => void copyGcashNumber()} className="mt-2">
                  Copy number
                </Button>
              </div>
            </div>
          ) : (
            <Alert type="warning" showIcon title="GCash details unavailable" description="Contact AgriMarket support before sending a deposit." className="mt-4" />
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="depositAmount" className="mb-1.5 block text-sm font-medium text-stone-700">Amount sent</label>
              <InputNumber
                id="depositAmount"
                size="large"
                min={1}
                max={remaining}
                value={deposit.amount ?? undefined}
                onChange={(value) => deposit.setAmount(value ?? null)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="depositReference" className="mb-1.5 block text-sm font-medium text-stone-700">GCash reference number</label>
              <Input
                id="depositReference"
                size="large"
                value={deposit.referenceNumber}
                onChange={(event) => deposit.setReferenceNumber(event.target.value)}
                placeholder="Enter the reference from your GCash receipt"
              />
            </div>
          </div>

          {(deposit.amount ?? 0) > remaining ? (
            <p className="mt-2 text-xs text-red-700">Enter no more than the remaining {formatPrice(remaining)}.</p>
          ) : null}
          <Button
            type="primary"
            block
            className="mt-4"
            disabled={!canSubmit}
            loading={deposit.isSubmitting}
            onClick={() => void deposit.submitForm()}
          >
            Submit deposit for review
          </Button>
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-900">Submission history</h3>
        {!data || data.submissions.length === 0 ? (
          <div className="mt-4 rounded-xl bg-stone-50 p-5">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No deposit submissions yet." />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {data.submissions.map((submission) => {
              const meta = submissionStatusMeta[submission.status as keyof typeof submissionStatusMeta] ?? { label: submission.status, color: 'default' };
              return (
                <div key={submission._id} className="rounded-xl bg-stone-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium tabular-nums">{formatPrice(submission.approvedAmount ?? submission.amount)}</span>
                    <Tag color={meta.color}>{meta.label}</Tag>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Ref {submission.referenceNumber} · {formatOrderTime(submission.reviewedAt ?? submission.submittedAt ?? submission.createdAt)}
                  </p>
                  {submission.rejectionReason ? <p className="mt-2 text-xs text-red-700">{submission.rejectionReason}</p> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
