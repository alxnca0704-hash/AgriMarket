'use client';

import { useState } from 'react';
import { Alert, App, Button, Collapse, Drawer, Empty, Image, Input, InputNumber, Skeleton, Tag } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { COMMISSION_ACTION_KEYS } from '@/constants/commissions';
import { formatDate, formatOrderId, formatOrderTime, formatPrice } from '@/lib/format';
import type { CommissionInvoice, CommissionInvoiceStatus } from '@/types/commission';
import type { SellerStallPageResult } from '@/hooks/useSellerStallPage';
import { StallStatCard } from '@/components/seller/StallStatCard';

const invoiceStatusMeta: Record<CommissionInvoiceStatus, { label: string; color: string }> = {
  issued: { label: 'Issued', color: 'default' },
  'pending-review': { label: 'Under review', color: 'gold' },
  partial: { label: 'Partially paid', color: 'orange' },
  paid: { label: 'Paid', color: 'green' },
  overdue: { label: 'Overdue', color: 'red' },
};

const paymentStatusMeta = {
  pending: { label: 'Under review', color: 'gold' },
  approved: { label: 'Approved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
} as const;

export interface StallPlatformTabProps {
  page: SellerStallPageResult;
}

export function StallPlatformTab({ page }: StallPlatformTabProps) {
  const { commissions, finance } = page;
  const { message } = App.useApp();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const invoices = commissions.data?.invoices ?? [];
  const unbilledOrders = commissions.data?.unbilledOrders ?? [];
  const gcash = commissions.data?.gcash ?? null;
  const cod = finance.finance?.cod;
  const creditsAvailable = commissions.data?.credits.available ?? 0;
  const unbilled = unbilledOrders.reduce((total, order) => total + order.amount, 0);
  const overdue = cod?.overdue ?? 0;
  const amountDueNow = Math.max(0, (cod?.invoiced ?? 0) + overdue);
  const selectedInvoice = invoices.find((invoice) => invoice._id === selectedInvoiceId) ?? null;

  if (commissions.error) {
    return <Alert type="error" title="Could not load platform balance" description={commissions.error} showIcon />;
  }
  if (commissions.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  const openInvoice = (invoice: CommissionInvoice) => {
    setSelectedInvoiceId(invoice._id);
    if (invoice.remaining > 0 && !invoice.pending) {
      commissions.setValue(invoice._id, 'amount', invoice.remaining);
    }
  };

  const copyGcashNumber = async () => {
    if (!gcash) return;
    try {
      await navigator.clipboard.writeText(gcash.number);
      message.success('GCash number copied');
    } catch {
      message.error('Could not copy the GCash number.');
    }
  };

  const draft = selectedInvoice ? commissions.values[selectedInvoice._id] : undefined;
  const payAmount = draft?.amount ?? 0;
  const payReference = draft?.referenceNumber ?? '';
  const canSubmit = Boolean(
    selectedInvoice
    && !selectedInvoice.pending
    && payAmount > 0
    && payAmount <= selectedInvoice.remaining
    && payReference.trim().length >= 4
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Platform</h2>
        <p className="mt-1 text-sm text-stone-500">What you owe the platform: COD commission invoices and payments.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StallStatCard label="Seller owes platform" value={formatPrice(finance.finance?.sellerOwesPlatform ?? 0)} note="Separate from commissions, deposit, and payout balance" />
        <StallStatCard
          label="Unbilled"
          value={formatPrice(unbilled)}
          note="COD commission not invoiced yet"
        />
        <StallStatCard
          label="Amount due now"
          value={formatPrice(amountDueNow)}
          note="Invoiced and overdue balances"
          tone="sage"
        />
        <StallStatCard
          label="Overdue"
          value={formatPrice(overdue)}
          note={overdue > 0 ? 'Past the invoice due date' : 'Nothing past due'}
          tone={overdue > 0 ? 'error' : 'default'}
        />
        <StallStatCard
          label="Refund credit"
          value={formatPrice(creditsAvailable)}
          note="Applied to your next invoice"
          tone={creditsAvailable > 0 ? 'sage' : 'default'}
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-900">Commission invoices</h3>
        <p className="mt-1 text-sm text-stone-500">COD commission is billed weekly. Pay by GCash before the due date.</p>

        {invoices.length === 0 ? (
          <div className="mt-4 rounded-xl bg-stone-50 p-5">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No commission invoices yet." />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {invoices.map((invoice) => {
              const status = invoiceStatusMeta[invoice.status];
              return (
                <button
                  key={invoice._id}
                  type="button"
                  onClick={() => openInvoice(invoice)}
                  className="flex w-full flex-col gap-3 rounded-xl bg-stone-50 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-stone-900">{formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}</span>
                      <Tag color={status.color}>{status.label}</Tag>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      Due {formatDate(new Date(invoice.dueAt).toISOString())} · {invoice.orders.length} order{invoice.orders.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold tabular-nums">{formatPrice(invoice.remaining > 0 ? invoice.remaining : invoice.amount)}</p>
                    <p className="mt-1 text-xs text-stone-500">{invoice.remaining > 0 ? 'remaining' : 'settled'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <Collapse
          ghost
          items={[{
            key: 'unbilled',
            label: (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-900">Unbilled orders</p>
                  <p className="mt-1 text-xs text-stone-500">Accrued COD commission waiting for the next invoice</p>
                </div>
                <span className="whitespace-nowrap text-sm font-semibold tabular-nums">{formatPrice(unbilled)}</span>
              </div>
            ),
            children: unbilledOrders.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No unbilled orders." />
            ) : (
              <div className="max-h-[320px] space-y-2 overflow-y-auto pt-3">
                {unbilledOrders.map((order) => (
                  <div key={order.orderId} className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-mono text-xs text-stone-500">{formatOrderId(order.orderId)}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{formatOrderTime(order.date)}</p>
                    </div>
                    <p className="whitespace-nowrap font-medium tabular-nums">{formatPrice(order.amount)}</p>
                  </div>
                ))}
              </div>
            ),
          }]}
        />
      </div>

      <Drawer title="Commission invoice" open={Boolean(selectedInvoice)} onClose={() => setSelectedInvoiceId(null)} size="min(92vw, 560px)">
        {selectedInvoice ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl bg-stone-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-900">{formatDate(selectedInvoice.periodStart)} – {formatDate(selectedInvoice.periodEnd)}</p>
                  <p className="mt-1 text-xs text-stone-500">Due {formatDate(new Date(selectedInvoice.dueAt).toISOString())}</p>
                </div>
                <Tag color={invoiceStatusMeta[selectedInvoice.status].color}>{invoiceStatusMeta[selectedInvoice.status].label}</Tag>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between gap-3"><span>Invoice amount</span><span className="tabular-nums">{formatPrice(selectedInvoice.amount)}</span></div>
                <div className="flex justify-between gap-3"><span>Paid to date</span><span className="tabular-nums">{formatPrice(selectedInvoice.paidAmount)}</span></div>
                {selectedInvoice.creditApplied > 0 && (
                  <div className="flex justify-between gap-3 text-[#2D6A4F]"><span>Credit applied</span><span className="tabular-nums">-{formatPrice(selectedInvoice.creditApplied)}</span></div>
                )}
                <div className="flex justify-between gap-3 font-semibold text-stone-900"><span>Remaining</span><span className="tabular-nums">{formatPrice(selectedInvoice.remaining)}</span></div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Orders covered</p>
              <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                {selectedInvoice.orders.map((order) => (
                  <div key={order.orderId} className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2.5">
                    <div>
                      <p className="font-mono text-xs text-stone-500">{formatOrderId(order.orderId)}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{formatOrderTime(order.date)}</p>
                    </div>
                    <p className="whitespace-nowrap font-medium tabular-nums">{formatPrice(order.amount)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Payment history</p>
              {selectedInvoice.payments.length === 0 ? (
                <p className="rounded-xl bg-stone-50 p-4 text-stone-500">No payments submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedInvoice.payments.map((payment) => (
                    <div key={payment._id} className="rounded-xl bg-stone-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium tabular-nums">{formatPrice(payment.approvedAmount ?? payment.amount)}</span>
                        <Tag color={paymentStatusMeta[payment.status].color}>{paymentStatusMeta[payment.status].label}</Tag>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">Ref {payment.referenceNumber} · {formatOrderTime(payment.createdAt)}</p>
                      {payment.rejectionReason ? <p className="mt-2 text-xs text-red-700">{payment.rejectionReason}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedInvoice.remaining > 0 && !selectedInvoice.pending ? (
              <div className="space-y-3 rounded-xl bg-stone-50 p-4">
                <div>
                  <p className="font-medium text-stone-900">Pay this invoice</p>
                  <p className="mt-1 text-xs text-stone-500">Send GCash, then submit the amount and reference number.</p>
                </div>

                {gcash ? (
                  <div className="flex flex-col gap-3 rounded-xl bg-white p-3 sm:flex-row sm:items-center">
                    <Image src={gcash.qrUrl} alt="GCash QR code" width={112} preview={false} className="!rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-stone-500">GCash number</p>
                      <p className="mt-1 break-all font-mono text-sm font-semibold text-stone-900">{gcash.number}</p>
                      <Button size="small" icon={<CopyOutlined />} onClick={() => void copyGcashNumber()} className="mt-2">
                        Copy number
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert type="warning" showIcon title="GCash details unavailable" description="Contact AgriMarket support before sending a payment." />
                )}

                <div>
                  <label htmlFor="commissionAmount" className="mb-1.5 block text-xs font-medium text-stone-600">Amount sent</label>
                  <InputNumber
                    id="commissionAmount"
                    size="large"
                    min={0}
                    max={selectedInvoice.remaining}
                    value={payAmount}
                    onChange={(value) => commissions.setValue(selectedInvoice._id, 'amount', value ?? 0)}
                    className="w-full"
                  />
                  {payAmount > 0 && payAmount < selectedInvoice.remaining ? (
                    <p className="mt-1.5 text-xs text-amber-700">This partial payment will leave {formatPrice(selectedInvoice.remaining - payAmount)} remaining.</p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="commissionReference" className="mb-1.5 block text-xs font-medium text-stone-600">GCash reference number</label>
                  <Input
                    id="commissionReference"
                    size="large"
                    value={payReference}
                    onChange={(event) => commissions.setValue(selectedInvoice._id, 'referenceNumber', event.target.value)}
                    placeholder="Enter the reference from your GCash receipt"
                  />
                </div>
                <Button
                  type="primary"
                  block
                  disabled={!canSubmit}
                  loading={commissions.isPending(COMMISSION_ACTION_KEYS.submitPayment(selectedInvoice._id))}
                  onClick={() => void commissions.pay(selectedInvoice._id)}
                >
                  Submit for review
                </Button>
              </div>
            ) : null}

            {selectedInvoice.pending ? (
              <Alert
                type="info"
                showIcon
                title="Awaiting admin review"
                description="A payment has been submitted for this invoice. You can send another payment after it is reviewed."
              />
            ) : null}

            {selectedInvoice.payments[0]?.status === 'rejected' && selectedInvoice.payments[0]?.rejectionReason ? (
              <Alert
                type="error"
                showIcon
                title="Previous payment rejected"
                description={selectedInvoice.payments[0]?.rejectionReason}
              />
            ) : null}

            {selectedInvoice.remaining <= 0 ? (
              <Alert type="success" showIcon title="Invoice settled" description="No balance remains on this invoice." />
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
