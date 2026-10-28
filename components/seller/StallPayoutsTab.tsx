'use client';

import { useState } from 'react';
import { Alert, Button, Checkbox, Drawer, Empty, Input, Modal, Skeleton, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, DownOutlined } from '@ant-design/icons';
import { formatOrderId, formatOrderTime, formatPrice } from '@/lib/format';
import type { SellerStallPageResult } from '@/hooks/useSellerStallPage';
import { StallStatCard } from '@/components/seller/StallStatCard';

const payoutStatusMeta = {
  pending: { label: 'Awaiting review', color: 'gold' },
  paid: { label: 'Paid', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
} as const;

export interface StallPayoutsTabProps {
  page: SellerStallPageResult;
}

export function StallPayoutsTab({ page }: StallPayoutsTabProps) {
  const { earnings, finance } = page;
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const payoutData = earnings.payoutData && 'orders' in earnings.payoutData ? earnings.payoutData : null;
  const gcash = finance.finance?.gcash;
  const readyOrders = payoutData?.orders.filter((order) => order.payoutStatus === 'ready') ?? [];
  const requests = payoutData?.requests ?? [];
  const selectedRequest = requests.find((request) => request._id === selectedRequestId) ?? null;
  const selectedCount = earnings.selectedOrderIds.length;

  if (earnings.error) {
    return <Alert type="error" title="Could not load payouts" description={earnings.error} showIcon />;
  }
  if (earnings.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StallStatCard
          label="GCash owed to you"
          value={formatPrice(gcash?.owedToSellers ?? 0)}
          note="Held by AgriMarket after commission"
          tone="sage"
        />
        <StallStatCard
          label="Ready to request"
          value={formatPrice(payoutData?.eligibleAmount ?? gcash?.payoutReady ?? 0)}
          note={`${payoutData?.eligibleOrderCount ?? 0} order${(payoutData?.eligibleOrderCount ?? 0) === 1 ? '' : 's'} past the return window`}
        />
        <StallStatCard
          label="Paid out"
          value={formatPrice(gcash?.paidOut ?? 0)}
          note="Sent to your GCash account"
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="font-medium text-stone-900">More payout details</p>
            <p className="mt-1 text-xs text-stone-500">Return window, requested, and held earnings</p>
          </div>
          <DownOutlined className={`text-xs text-stone-400 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
        </button>
        {moreOpen ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-stone-50 p-3">
              <p className="text-xs text-stone-500">In return window</p>
              <p className="mt-1 font-semibold tabular-nums">{formatPrice(gcash?.inReturnWindow ?? 0)}</p>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <p className="text-xs text-stone-500">Payout requested</p>
              <p className="mt-1 font-semibold tabular-nums">{formatPrice(gcash?.payoutRequested ?? 0)}</p>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <p className="text-xs text-stone-500">On hold</p>
              <p className="mt-1 font-semibold tabular-nums">{formatPrice(gcash?.onHold ?? 0)}</p>
            </div>
          </div>
        ) : null}
        <p className="mt-4 text-xs leading-5 text-stone-500">
          GCash earnings become ready 24 hours after delivery. COD earnings and the stall deposit are handled separately and are not included here.
        </p>
      </div>

      {payoutData?.codRefundBlocked && (
        <Alert
          type="error"
          showIcon
          title="Payout requests are blocked"
          description={`A COD refund of ${formatPrice(payoutData.codRefundOverdueAmount)} is overdue. Send the refund and submit the reference before requesting a payout.`}
        />
      )}

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Request a payout</h3>
            <p className="mt-1 text-sm text-stone-500">Select completed GCash orders that are past the return window.</p>
          </div>
          {readyOrders.length > 0 ? (
            <Button size="small" onClick={earnings.selectAllReadyOrders} className="self-start">
              Select all
            </Button>
          ) : null}
        </div>

        {readyOrders.length === 0 ? (
          <div className="mt-4 rounded-xl bg-stone-50 p-5">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No GCash earnings are ready yet." />
            <p className="mt-2 text-center text-xs leading-5 text-stone-500">
              Orders become eligible 24 hours after delivery. Pending requests and held orders appear below.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {readyOrders.map((order) => {
                const checked = earnings.selectedOrderIds.includes(order.orderId);
                return (
                  <label
                    key={order.orderId}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-colors ${checked ? 'bg-[var(--color-sage-soft)]' : 'bg-stone-50'}`}
                  >
                    <Checkbox checked={checked} onChange={() => earnings.togglePayoutOrder(order.orderId)} className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-xs text-stone-500">{formatOrderId(order.orderId)}</p>
                        <p className="text-sm font-semibold tabular-nums">{formatPrice(order.netPayoutAmount)}</p>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatOrderTime(order.completedAt ?? order.deliveredAt ?? order.placedAt)}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-stone-500 sm:grid-cols-4">
                        <span>Items {formatPrice(order.itemsSubtotal)}</span>
                        <span>Delivery {formatPrice(order.deliveryFee)}</span>
                        <span>Commission {formatPrice(order.commissionAmount)}</span>
                        <span className="font-medium text-stone-700">Net {formatPrice(order.netPayoutAmount)}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl bg-stone-50 p-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3"><span>Selected orders</span><span className="tabular-nums">{selectedCount}</span></div>
                <div className="flex justify-between gap-3"><span>Items</span><span className="tabular-nums">{formatPrice(earnings.selectedBreakdown.items)}</span></div>
                <div className="flex justify-between gap-3"><span>Delivery</span><span className="tabular-nums">{formatPrice(earnings.selectedBreakdown.delivery)}</span></div>
                <div className="flex justify-between gap-3"><span>Commission</span><span className="tabular-nums">−{formatPrice(earnings.selectedBreakdown.commission)}</span></div>
                <div className="flex justify-between gap-3 font-semibold text-stone-900"><span>Total to receive</span><span className="tabular-nums">{formatPrice(earnings.selectedPayoutAmount)}</span></div>
              </div>
              <Button
                type="primary"
                block
                className="mt-4"
                disabled={selectedCount === 0 || Boolean(payoutData?.codRefundBlocked)}
                loading={earnings.isRequesting || earnings.isRequestPending}
                onClick={earnings.openPayout}
              >
                Request payout
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-900">Payout history</h3>
        {requests.length === 0 ? (
          <div className="mt-4 rounded-xl bg-stone-50 p-5">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No payout requests yet." />
          </div>
        ) : (
          <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {requests.map((request) => {
              const status = payoutStatusMeta[request.status];
              return (
                <button
                  key={request._id}
                  type="button"
                  onClick={() => setSelectedRequestId(request._id)}
                  className="flex w-full flex-col gap-2 rounded-xl bg-stone-50 p-3 text-left sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold tabular-nums">{formatPrice(request.amount)}</span>
                      <Tag color={status.color}>{status.label}</Tag>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {request.orderCount} order{request.orderCount === 1 ? '' : 's'} · {formatOrderTime(request.requestedAt)}
                    </p>
                  </div>
                  <span className="text-xs text-stone-400">View details</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        title="Request payout"
        open={earnings.payoutOpen}
        onCancel={earnings.closePayout}
        onOk={() => void earnings.requestPayout()}
        okText="Send request"
        confirmLoading={earnings.isRequesting || earnings.isRequestPending}
        okButtonProps={{ disabled: selectedCount === 0 || Boolean(payoutData?.codRefundBlocked) }}
        width={520}
        className="max-w-[calc(100vw-24px)]"
      >
        <div className="space-y-4 pt-1">
          <div className="rounded-xl bg-stone-50 p-4 text-sm">
            <div className="flex justify-between gap-3"><span>Selected orders</span><span className="tabular-nums">{selectedCount}</span></div>
            <div className="mt-1 flex justify-between gap-3 font-semibold text-stone-900"><span>Total to receive</span><span className="tabular-nums">{formatPrice(earnings.selectedPayoutAmount)}</span></div>
          </div>
          <div>
            <label htmlFor="payoutGcashName" className="mb-1.5 block text-sm font-medium text-stone-700">GCash account name</label>
            <Input
              id="payoutGcashName"
              size="large"
              value={earnings.gcashName}
              onChange={(event) => earnings.setGcashName(event.target.value)}
              placeholder="Name on the GCash account"
            />
          </div>
          <div>
            <label htmlFor="payoutGcashNumber" className="mb-1.5 block text-sm font-medium text-stone-700">GCash number</label>
            <Input
              id="payoutGcashNumber"
              size="large"
              value={earnings.gcashNumber}
              onChange={(event) => earnings.setGcashNumber(event.target.value)}
              placeholder="09XX XXX XXXX"
            />
          </div>
          <p className="text-xs leading-5 text-stone-500">
            Make sure the name and number match. Payouts are reviewed by an admin before the GCash transfer is sent.
          </p>
        </div>
      </Modal>

      <Drawer title="Payout details" open={Boolean(selectedRequest)} onClose={() => setSelectedRequestId(null)} size="min(92vw, 520px)">
        {selectedRequest ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl bg-stone-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{formatPrice(selectedRequest.amount)}</p>
                  <p className="mt-1 text-stone-500">{selectedRequest.orderCount} order{selectedRequest.orderCount === 1 ? '' : 's'}</p>
                </div>
                <Tag color={payoutStatusMeta[selectedRequest.status].color}>{payoutStatusMeta[selectedRequest.status].label}</Tag>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between gap-3"><span>Requested</span><span>{formatOrderTime(selectedRequest.requestedAt)}</span></div>
                {selectedRequest.reviewedAt ? <div className="flex justify-between gap-3"><span>Reviewed</span><span>{formatOrderTime(selectedRequest.reviewedAt)}</span></div> : null}
                <div className="flex justify-between gap-3"><span>GCash name</span><span className="text-right">{selectedRequest.gcashName}</span></div>
                <div className="flex justify-between gap-3"><span>GCash number</span><span className="text-right font-mono text-xs">{selectedRequest.gcashNumber}</span></div>
                {selectedRequest.transferReference ? <div className="flex justify-between gap-3"><span>Transfer reference</span><span className="text-right font-mono text-xs">{selectedRequest.transferReference}</span></div> : null}
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl bg-stone-50 p-4">
              <div className="flex justify-between gap-3"><span>Items subtotal</span><span className="tabular-nums">{formatPrice(selectedRequest.itemsSubtotal)}</span></div>
              <div className="flex justify-between gap-3"><span>Delivery fees</span><span className="tabular-nums">{formatPrice(selectedRequest.deliveryFee)}</span></div>
              <div className="flex justify-between gap-3"><span>Commission</span><span className="tabular-nums">−{formatPrice(selectedRequest.commissionAmount)}</span></div>
              <div className="flex justify-between gap-3 font-semibold text-stone-900"><span>Net payout</span><span className="tabular-nums">{formatPrice(selectedRequest.netPayoutAmount)}</span></div>
            </div>

            {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason ? (
              <Alert type="error" showIcon title="Payout rejected" description={selectedRequest.rejectionReason} />
            ) : null}
            {selectedRequest.status === 'pending' ? (
              <Alert type="info" showIcon icon={<ClockCircleOutlined />} title="Awaiting admin review" description="The transfer has not been sent yet." />
            ) : null}
            {selectedRequest.status === 'paid' ? (
              <Alert type="success" showIcon icon={<CheckCircleOutlined />} title="Payout sent" description="The GCash transfer has been recorded." />
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
