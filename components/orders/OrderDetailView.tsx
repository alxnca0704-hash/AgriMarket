'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Input, Rate, Result, Skeleton, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  MobileOutlined,
  MessageOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { OrderItems } from '@/components/orders/OrderItems';
import { OrderProgress } from '@/components/orders/OrderProgress';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderActions } from '@/components/orders/OrderActions';
import { ReviewModal } from '@/components/orders/ReviewModal';
import { APP_ROUTES } from '@/constants/routes';
import { formatAddressSummary, formatOrderTime, formatPrice } from '@/lib/format';
import { useMessages } from '@/hooks/useMessages';

function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
      <Skeleton.Button active className="!w-32 !h-8 !rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          <Skeleton active paragraph={{ rows: 5 }} title={{ width: '40%' }} />
          <Skeleton active paragraph={{ rows: 3 }} title={{ width: '30%' }} />
        </div>
        <div className="lg:col-span-5 space-y-5">
          <Skeleton active paragraph={{ rows: 4 }} title={{ width: '50%' }} />
        </div>
      </div>
    </div>
  );
}

export function OrderDetailView({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { startConversation, isStarting } = useMessages();
  const {
    isLoading,
    error,
    notFound,
    order,
    reviews,
    reviewsByProductId,
    canReview,
    canReviewProduct,
    reviewModalOpen,
    reviewProductName,
    reviewRating,
    reviewComment,
    reviewSubmitting,
    setReviewRating,
    setReviewComment,
    handleOpenReviewModal,
    handleCloseReviewModal,
    handleSubmitReview,
    handleConfirmDelivery,
    handleCancel,
    handleRequestRefund,
    handleSubmitReturnShipment,
    returnCarrier,
    setReturnCarrier,
    returnTrackingNumber,
    setReturnTrackingNumber,
    isActionPending,
    paymentReference,
    setPaymentReference,
    isResubmittingPayment,
    handleResubmitPayment,
  } = useOrderDetail(orderId);

  if (isLoading) return <DetailSkeleton />;

  if (notFound || !order) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <Result
          status="404"
          title="Order not found"
          subTitle="This order may have been cleared or the link is outdated."
          extra={
            <Button
              type="primary"
              onClick={() => router.push(APP_ROUTES.orders)}
              className="!rounded-xl"
            >
              Back to orders
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-16 space-y-6">
      {error && <Alert type="error" title={error} showIcon />}

      <button
        type="button"
        onClick={() => router.push(APP_ROUTES.orders)}
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
                {order.sellerName}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1.5 text-sm text-stone-400">
              Order{' '}
              <span className="font-mono text-stone-500">{order.id}</span> · Placed{' '}
              {formatOrderTime(order.placedAt)}
            </p>
          </div>

          <OrderActions
            order={order}
            variant="detail"
            isActionPending={isActionPending}
            onConfirmDelivery={handleConfirmDelivery}
            onCancel={handleCancel}
            onRequestRefund={handleRequestRefund}
          />
          <Button icon={<MessageOutlined />} loading={isStarting} onClick={() => void startConversation(order.stallId, order.id)}>Message shop</Button>
        </div>

        <div className="mt-5">
          <OrderProgress order={order} audience="buyer" />
        </div>

        {order.cancelReason && (
          <div className="mt-4 rounded-xl bg-[#FBF0EE] px-4 py-3 text-sm text-[#8C2F26]">
            <strong className="font-semibold">Cancellation reason: </strong>
            {order.cancelReason}
          </div>
        )}

        {order.refundReason && (
          <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong className="font-semibold">Refund reason: </strong>
            {order.refundReason}
          </div>
        )}

        {order.refundEvidenceUrls && order.refundEvidenceUrls.length > 0 && (
          <div className="mt-4 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
            <strong className="font-semibold">Return evidence</strong>
            <div className="mt-2 flex flex-wrap gap-3">
              {order.refundEvidenceUrls.map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="text-sage underline underline-offset-2">
                  Open evidence {index + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {order.status === 'refund-requested' && (
          <div className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-800">
            Return requested on {order.refundRequestedAt ? formatOrderTime(order.refundRequestedAt) : ''} — the admin will review the order ID and its payment reference. Seller payout is on hold.
          </div>
        )}

        {order.status === 'return-approved' && (
          <div className="mt-4 space-y-3 rounded-xl bg-sage-soft px-4 py-4 text-sm text-stone-700">
            <p><strong className="font-semibold">Return approved.</strong> Ship the items to the seller using a trackable courier.</p>
            <p><strong>Return address:</strong> {order.returnAddress || 'Contact admin for the seller return address.'}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input aria-label="Courier" placeholder="Courier (e.g. LBC)" value={returnCarrier} onChange={(event) => setReturnCarrier(event.target.value)} />
              <Input aria-label="Tracking number" placeholder="Tracking number" value={returnTrackingNumber} onChange={(event) => setReturnTrackingNumber(event.target.value)} />
            </div>
            <Button type="primary" loading={isActionPending('submitReturnShipment', order.id)} disabled={!returnCarrier.trim() || !returnTrackingNumber.trim()} onClick={handleSubmitReturnShipment}>I shipped the return</Button>
          </div>
        )}
        {order.status === 'return-in-transit' && (
          <Alert className="mt-4" type="info" showIcon title="Return shipment in transit" description={`${order.returnCarrier ?? 'Courier'} · Tracking ${order.returnTrackingNumber ?? 'pending'}. The seller must confirm receipt before the admin can issue the refund.`} />
        )}
        {order.status === 'return-received' && (
          <Alert className="mt-4" type="success" showIcon title="Return received by seller" description="The admin will now process the refund. Your payout hold remains in place until the refund is recorded." />
        )}


        {order.status === 'refunded' && (
          <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            <strong className="font-semibold">Refunded</strong>
            {order.refundConfirmedAt ? ` on ${formatOrderTime(order.refundConfirmedAt)}` : ''}{order.refundMethod ? ` · Sent via ${order.refundMethod === 'gcash' ? 'GCash' : 'cash'}` : ''}{order.refundReference ? ` · Reference ${order.refundReference}` : ''} · Returned goods are not automatically restocked.
          </div>
        )}

        {order.refundRejectReason && order.refundRejectedAt && (
          <div className="mt-4 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-700">
            <strong className="font-semibold">Refund rejected: </strong>
            {order.refundRejectReason}
            <span className="text-stone-400"> · {formatOrderTime(order.refundRejectedAt)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <section className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-stone-900 mb-1">
              Items ({order.items.length})
            </h2>
            <OrderItems items={order.items} />
            {order.note && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-1">
                  Note for the farm
                </p>
                <p className="text-sm text-stone-600 leading-relaxed">{order.note}</p>
              </div>
            )}
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
                  {order.status === 'cancelled'
                    ? 'No payment was taken'
                    : order.payment.status === 'paid'
                    ? 'Already paid'
                    : order.payment.status === 'pending'
                    ? 'Awaiting GCash verification'
                    : order.payment.status === 'rejected'
                    ? 'Payment proof rejected'
                    : 'Pay on delivery'}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-stone-50/80 p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-900">{order.payment.method === 'gcash' ? 'GCash' : 'Cash on Delivery'}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {order.payment.method === 'gcash'
                    ? `Reference ${order.payment.reference ?? 'submitted'} · ${order.payment.status === 'paid' ? 'Payment approved.' : order.payment.status === 'rejected' ? 'Please review the rejection reason below.' : 'Receipt submitted for review.'}`
                    : order.payment.status === 'paid'
                    ? 'Payment settled — cash received by the courier.'
                    : `Pay ${formatPrice(order.total)} in cash when it arrives.`}
                </p>
              </div>
              {order.payment.status === 'paid' ? (
                <Tag color="success" className="!m-0 !border-none !rounded-full !text-xs !font-semibold">
                  Paid
                </Tag>
              ) : (
                <Tag className="!m-0 !border-none !rounded-full !text-xs !font-semibold">
                  {order.payment.status === 'pending' ? 'Under review' : order.payment.status === 'rejected' ? 'Rejected' : 'Unpaid'}
                </Tag>
              )}
            </div>
            {order.payment.method === 'gcash' && (
              <div className="mt-3 space-y-1 text-xs text-stone-500">
                {order.payment.note && <p>Payment note: <span className="font-mono text-stone-700">{order.payment.note}</span></p>}
                {order.payment.reference && <p>Reference number: <span className="font-mono text-stone-700">{order.payment.reference}</span></p>}
              </div>
            )}
            {order.payment.method === 'gcash' && order.payment.rejectionReason && (
              <Alert className="mt-3" type="error" showIcon title="Payment proof rejected" description={order.payment.rejectionReason} />
            )}
            {order.payment.method === 'gcash' && order.payment.attempts.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Payment attempts</h3>
                {order.payment.attempts.map((attempt, index) => (
                  <div key={`${attempt.at}-${index}`} className="rounded-xl bg-stone-50 p-3 text-xs text-stone-600">
                    <p>{attempt.type} · {formatOrderTime(attempt.at)}</p>
                    <p>Reference <span className="font-mono">{attempt.referenceNumber}</span></p>
                    {attempt.reason && <p className="mt-1">Reason: {attempt.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {order.payment.method === 'gcash' && order.payment.status === 'rejected' && (
            <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Resubmit GCash payment proof</h2>
                <p className="mt-1 text-xs text-stone-500">Submit the new reference number from your replacement GCash transfer.</p>
              </div>
              <Input placeholder="New GCash reference number" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} />
              <Button type="primary" block loading={isResubmittingPayment} disabled={!paymentReference.trim()} onClick={() => void handleResubmitPayment()}>
                Resubmit for verification
              </Button>
            </section>
          )}

          {/* Review section — shown only for delivered/completed orders */}
          {(canReview || reviews.length > 0) && (
            <section className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl bg-sage-soft text-sage flex items-center justify-center shrink-0">
                  <StarOutlined />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">Product reviews</h2>
                  <p className="text-xs text-stone-400">Rate each product you received</p>
                </div>
              </div>

              <div className="space-y-3">
                {order.items.map((item) => {
                  const reviewed = reviewsByProductId.get(item.productId);
                  return (
                    <div
                      key={item.productId}
                      className="rounded-xl bg-stone-50/70 p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                        {reviewed ? (
                          <Rate disabled value={reviewed.rating} className="!text-xs shrink-0" />
                        ) : canReviewProduct(item.productId) ? (
                          <Button
                            size="small"
                            icon={<StarOutlined />}
                            onClick={() => handleOpenReviewModal(item.productId, item.name)}
                            className="!rounded-lg !text-xs !border-[#2D6A4F] !text-[#2D6A4F] hover:!bg-[#E9F0EB] shrink-0"
                          >
                            Rate
                          </Button>
                        ) : null}
                      </div>

                      {reviewed && (
                        <>
                          <p className="text-sm text-stone-600 leading-relaxed">{reviewed.comment}</p>
                          {reviewed.reply && (
                            <div className="mt-1 rounded-xl bg-sage-soft/50 px-3.5 py-3">
                              <p className="text-xs font-semibold text-[#2D6A4F] mb-1">
                                Seller&apos;s reply
                                {reviewed.repliedAt && (
                                  <span className="font-normal text-stone-400">
                                    {' '}
                                    ·{' '}
                                    {new Date(reviewed.repliedAt).toLocaleDateString('en-PH', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-stone-700 leading-relaxed">
                                {reviewed.reply}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-5 space-y-5">
          <section className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-xl bg-sage-soft text-sage flex items-center justify-center shrink-0">
                <MobileOutlined />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Delivery details</h2>
                <p className="text-xs text-stone-400">Where your order is headed</p>
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
                  {order.address.label && (
                    <span className="ml-2 inline-block text-[10px] font-semibold uppercase tracking-wide text-sage bg-sage-soft px-1.5 py-0.5 rounded-full align-middle">
                      {order.address.label}
                    </span>
                  )}
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

      {/* Review modal */}
      <ReviewModal
        open={reviewModalOpen}
        sellerName={order.sellerName}
        productName={reviewProductName}
        rating={reviewRating}
        comment={reviewComment}
        submitting={reviewSubmitting}
        onRatingChange={setReviewRating}
        onCommentChange={setReviewComment}
        onSubmit={handleSubmitReview}
        onCancel={handleCloseReviewModal}
      />
    </div>
  );
}
