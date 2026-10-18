'use client';

import { Alert, Button, Empty, Input, Modal, Skeleton, Tag } from 'antd';
import { CheckOutlined, CloseOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useAdminPayments } from '@/hooks/useAdminPayments';
import { formatPrice, formatOrderTime } from '@/lib/format';

export function AdminPaymentsView() {
  const payments = useAdminPayments();

  if (payments.isLoading) return <div className="mx-auto max-w-5xl space-y-5 px-4 py-8"><Skeleton active paragraph={{ rows: 5 }} /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">Payments</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-stone-900">Verify GCash payments</h1>
          <Tag color="gold">{payments.payments?.length ?? 0} pending</Tag>
        </div>
        <p className="text-sm text-stone-500">New submissions appear here automatically. Match the expected amount and reference in your GCash transaction history.</p>
      </header>

      {payments.error && <Alert type="error" showIcon title={payments.error} />}
      {payments.payments?.length === 0 ? (
        <div className="rounded-2xl bg-white p-8"><Empty description="No GCash payments are awaiting verification." /></div>
      ) : (
        <div className="space-y-4">
          {payments.payments?.map((payment) => (
            <article key={payment.paymentNote} className="grid grid-cols-1 gap-5 rounded-2xl bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-stone-900">{payment.buyerName}</h2>
                    <p className="mt-1 font-mono text-xs text-stone-500">Payment note {payment.paymentNote}</p>
                    <p className="text-xs text-stone-400">{payment.sellerNames.join(', ')}</p>
                  </div>
                  <Tag color="gold">Pending verification</Tag>
                </div>
                <div className="grid grid-cols-1 gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-2">
                  <p className="text-sm text-stone-600">Expected amount: <strong className="text-stone-900">{formatPrice(payment.expectedAmount)}</strong></p>
                  <p className="text-sm text-stone-600">Reference: <strong className="font-mono text-stone-900">{payment.paymentReference}</strong></p>
                  <p className="text-xs text-stone-400 sm:col-span-2">Submitted {formatOrderTime(payment.submittedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="primary" icon={<CheckOutlined />} loading={payments.isReviewing} onClick={() => void payments.approve(payment.paymentNote)}>Approve payment</Button>
                  <Button danger icon={<CloseOutlined />} disabled={payments.isReviewing} onClick={() => payments.openReject(payment.paymentNote)}>Reject</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        title={<span className="flex items-center gap-2"><CreditCardOutlined /> Reject GCash payment</span>}
        open={payments.rejectingPaymentNote !== null}
        onCancel={payments.closeReject}
        onOk={() => void payments.reject()}
        okText="Reject payment"
        okButtonProps={{ danger: true, loading: payments.isReviewing, disabled: payments.rejectionReason.trim().length < 5 }}
        cancelButtonProps={{ disabled: payments.isReviewing }}
        width="min(92%, 480px)"
      >
        <p className="mb-3 text-sm text-stone-500">Explain what did not match. The buyer will see this reason and can resubmit the proof.</p>
        <Input.TextArea rows={4} maxLength={500} value={payments.rejectionReason} onChange={(event) => payments.setRejectionReason(event.target.value)} placeholder="For example: reference not found in transaction history." />
      </Modal>
    </div>
  );
}
