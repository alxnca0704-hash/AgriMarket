'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Result, Skeleton, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { useSellerOrderDetail } from '@/hooks/useSellerOrderDetail';
import { OrderItems } from '@/components/orders/OrderItems';
import { OrderSteps } from '@/components/orders/OrderSteps';
import { SellerOrderActions } from '@/components/seller/SellerOrderActions';
import { SELLER_ORDER_GROUP_LABELS, getSellerOrderGroup, SELLER_ORDER_TAG_COLORS } from '@/constants/sellerOrders';
import { APP_ROUTES } from '@/constants/routes';
import { formatAddressSummary, formatOrderTime, formatPrice } from '@/lib/format';

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
  const {
    isLoading,
    error,
    notFound,
    order,
    handleConfirm,
    handleReject,
    handleDispatch,
    handleComplete,
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
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900">
                {order.address.receiverName}
              </h1>
              <Tag
                color={SELLER_ORDER_TAG_COLORS[group]}
                className="!m-0 !border-none !rounded-full !px-2.5 !py-0.5 !text-xs !font-semibold"
              >
                {SELLER_ORDER_GROUP_LABELS[group]}
              </Tag>
            </div>
            <p className="text-sm text-stone-400 mt-1">
              Order{' '}
              <span className="font-mono text-stone-500">{order.id}</span> · Placed{' '}
              {formatOrderTime(order.placedAt)}
            </p>
          </div>

          <SellerOrderActions
            order={order}
            variant="detail"
            onConfirm={handleConfirm}
            onReject={handleReject}
            onDispatch={handleDispatch}
            onComplete={handleComplete}
          />
        </div>

        {order.cancelReason && (
          <div className="mt-4 rounded-xl bg-[#FBF0EE] px-4 py-3 text-sm text-[#8C2F26]">
            <strong className="font-semibold">Cancellation reason: </strong>
            {order.cancelReason}
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
                  {order.status === 'cancelled' ? 'No payment was taken' : 'Cash on Delivery'}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-stone-50/80 p-4 text-sm">
              {order.payment.status === 'paid' ? (
                <p className="text-stone-700">
                  <strong className="font-semibold text-stone-900">Paid</strong> — cash received by the courier.
                </p>
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

          <section className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-stone-900 mb-2">Fulfillment timeline</h2>
            <OrderSteps order={order} />
          </section>
        </div>
      </div>
    </div>
  );
}