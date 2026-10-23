'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Result, Skeleton } from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  MobileOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useSellerOrderDetail } from '@/hooks/useSellerOrderDetail';
import { OrderItems } from '@/components/orders/OrderItems';
import { OrderProgress } from '@/components/orders/OrderProgress';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { SellerOrderActions } from '@/components/seller/SellerOrderActions';
import { getSellerOrderGroup } from '@/constants/sellerOrders';
import { APP_ROUTES } from '@/constants/routes';
import { formatAddressSummary, formatOrderTime, formatPrice } from '@/lib/format';
import { useMessages } from '@/hooks/useMessages';

function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
      <Skeleton.Button active className="!w-32 !h-8 !rounded-lg" />
      <Skeleton active paragraph={{ rows: 5 }} title={{ width: '40%' }} />
    </div>
  );
}

export function SellerOrderDetailView({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { startConversation, isStarting } = useMessages(true);
  const {
    isLoading,
    error,
    notFound,
    order,
    handleConfirm,
    handleReject,
    handleDispatch,
    handleComplete,
    handleConfirmReturnReceived,
    isActionPending,
  } = useSellerOrderDetail(orderId);

  if (isLoading) return <DetailSkeleton />;

  if (notFound || !order) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <Result
          status="404"
          title="Order not found"
          subTitle="This order may be from another stall or has been cleared."
          extra={
            <Button
              type="primary"
              onClick={() => router.push(APP_ROUTES.sellerOrders)}
              className="!rounded-xl"
            >
              Back to orders
            </Button>
          }
        />
      </div>
    );
  }

  const group = getSellerOrderGroup(order);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-6">
      {error && <Alert type="error" title={error} showIcon />}

      <button
        type="button"
        onClick={() => router.push(APP_ROUTES.sellerOrders)}
        className="group inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
      >
        <ArrowLeftOutlined className="text-xs transition-transform group-hover:-translate-x-0.5" />
        <span>Back to orders</span>
      </button>

      <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-3xl leading-tight tracking-tight text-stone-900 sm:text-4xl">
                {order.address.receiverName}
              </h1>
              <OrderStatusBadge status={group} />
            </div>
            <p className="mt-1.5 text-sm text-stone-400">
              Order{' '}
              <span className="font-mono text-stone-500">{order.id}</span> · Placed{' '}
              {formatOrderTime(order.placedAt)}
            </p>
          </div>

          <SellerOrderActions
            order={order}
            variant="detail"
            isActionPending={isActionPending}
            onConfirm={handleConfirm}
            onReject={handleReject}
            onDispatch={handleDispatch}
            onComplete={handleComplete}
            onConfirmReturnReceived={handleConfirmReturnReceived}
          />
          <Button icon={<MessageOutlined />} loading={isStarting} onClick={() => void startConversation(order.stallId, order.id)}>Message buyer</Button>
        </div>

        <div className="mt-5">
          <OrderProgress order={order} audience="seller" />
        </div>

        {order.cancelReason && (
          <div className="mt-4 rounded-xl bg-[#FBF0EE] px-4 py-3 text-sm text-[#8C2F26]">
            <strong className="font-semibold">Cancellation reason: </strong>
            {order.cancelReason}
          </div>
        )}

        {order.status === 'refund-requested' && (
          <div className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-800">
            Return request submitted. The admin has been notified and seller payout is on hold.
          </div>
        )}
        {order.status === 'return-approved' && (
          <Alert className="mt-4" type="info" showIcon title="Return approved" description="The buyer has been given the return address and may ship the goods back." />
        )}
        {order.status === 'return-in-transit' && (
          <Alert className="mt-4" type="warning" showIcon title="Return shipment in transit" description={`${order.returnCarrier ?? 'Courier'} · Tracking ${order.returnTrackingNumber ?? 'pending'}. Confirm receipt after the goods arrive and you have inspected them.`} />
        )}
        {order.status === 'return-received' && (
          <Alert className="mt-4" type="success" showIcon title="Return received" description="The admin is processing the refund. Returned stock is not automatically restored." />
        )}

        {order.status === 'refunded' && (
          <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            <strong className="font-semibold">Refunded</strong>
            {order.refundConfirmedAt ? ` on ${formatOrderTime(order.refundConfirmedAt)}` : ''}{order.refundMethod ? ` · Sent via ${order.refundMethod === 'gcash' ? 'GCash' : 'cash'}` : ''} · Returned goods are not automatically restocked.
          </div>
        )}

        {order.refundRejectReason && order.refundRejectedAt && (
          <div className="mt-4 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-700">
            <strong className="font-semibold">Refund rejected: </strong>
            {order.refundRejectReason}
            <span className="text-stone-400"> · {formatOrderTime(order.refundRejectedAt)}</span>
          </div>
        )}

        {order.note && (
          <div className="mt-4 rounded-xl bg-amber-50/70 px-4 py-3 text-sm text-stone-700">
            <strong className="font-semibold text-stone-800">Buyer&apos;s note: </strong>
            {order.note}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <section className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-stone-900 mb-1">
              Items to fulfill ({order.items.length})
            </h2>
            <OrderItems items={order.items} />
            <div className="mt-4 pt-4 border-t border-stone-100 space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-medium text-stone-800">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Delivery fee</span>
                <span className="font-medium text-stone-800">{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="font-semibold text-stone-900">Total</span>
                <span className="text-lg font-semibold text-stone-900">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-9 h-9 rounded-xl bg-sage-soft text-sage flex items-center justify-center shrink-0">
                <BankOutlined />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Payment</h2>
                <p className="text-xs text-stone-400">
                  {order.status === 'cancelled' ? 'No payment was taken' : order.payment.method === 'gcash' ? 'GCash payment' : 'Cash on Delivery'}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-stone-50/80 p-4 text-sm">
              {order.payment.status === 'paid' ? (
                <p className="text-stone-700"><strong className="font-semibold text-stone-900">Paid</strong> — {order.payment.method === 'gcash' ? `GCash payment verified${order.payment.reviewedAt ? ` on ${formatOrderTime(order.payment.reviewedAt)}` : '.'}` : 'cash received by the courier.'}</p>
              ) : order.payment.method === 'gcash' ? (
                <div className="space-y-2 text-stone-700">
                  <p><strong className="font-semibold text-stone-900">{order.payment.status === 'pending' ? 'Awaiting verification' : order.payment.status === 'rejected' ? 'Payment proof rejected' : 'Unpaid'}</strong></p>
                </div>
              ) : (
                <p className="text-stone-700">
                  <strong className="font-semibold text-stone-900">{formatPrice(order.total)}</strong> to collect on delivery.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <section className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-xl bg-sage-soft text-sage flex items-center justify-center shrink-0">
                <MobileOutlined />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Buyer details</h2>
                <p className="text-xs text-stone-400">Where to deliver</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <HomeOutlined className="text-sage mt-0.5 shrink-0" />
                <p className="text-stone-700">
                  <strong className="font-semibold text-stone-900">{order.address.receiverName}</strong>
                  <span className="text-stone-400"> · </span>
                  <span className="inline-flex items-center gap-1">
                    <MobileOutlined className="text-xs" /> {order.address.receiverPhone}
                  </span>
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <EnvironmentOutlined className="text-sage mt-0.5 shrink-0" />
                <p className="text-stone-600 leading-relaxed">
                  {formatAddressSummary(order.address)}
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
