'use client';

import { useCallback, useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Order } from '@/types/order';
import { Review } from '@/types/review';
import { ORDER_ACTION_KEYS, OrderAction } from '@/constants/orders';
import { usePendingAction } from '@/hooks/usePendingAction';
import { toOrder } from '@/lib/convexSync';

function isValidOrderId(value: string): boolean {
  return /^[a-z0-9]{32}$/.test(value);
}

function toReview(raw: {
  _id: string;
  orderId: string;
  productId?: string;
  productName?: string;
  buyerId: string;
  sellerId: string;
  stallId: string;
  buyerName: string;
  rating: number;
  comment: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}): Review {
  return {
    id: raw._id,
    orderId: raw.orderId,
    productId: raw.productId,
    productName: raw.productName,
    buyerId: raw.buyerId,
    sellerId: raw.sellerId,
    stallId: raw.stallId,
    buyerName: raw.buyerName,
    rating: raw.rating,
    comment: raw.comment,
    reply: raw.reply,
    repliedAt: raw.repliedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function useOrderDetail(orderId: string) {
  const { message } = App.useApp();
  const skip = !isValidOrderId(orderId);

  const raw = useQuery(
    api.orders.getMyOrder,
    skip ? 'skip' : { orderId: orderId as Id<'orders'> }
  );
  const rawReviews = useQuery(
    api.reviews.getReviewsForOrder,
    skip ? 'skip' : { orderId: orderId as Id<'orders'> }
  );

  const cancelMutation = useMutation(api.orders.cancelOrder);
  const confirmDeliveryMutation = useMutation(api.orders.confirmDelivery);
  const requestRefundMutation = useMutation(api.orders.requestRefund);
  const submitReviewMutation = useMutation(api.reviews.submitReview);
  const { run, isPending } = usePendingAction();

  // Review modal state — per product
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [reviewProductName, setReviewProductName] = useState<string>('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const isLoading = !skip && raw === undefined;
  const order: Order | undefined = !skip && raw ? toOrder(raw) : undefined;
  const error = raw instanceof Error ? raw.message : null;
  const notFound = skip || (!isLoading && !order);
  const reviews: Review[] = Array.isArray(rawReviews) ? rawReviews.map(toReview) : [];
  const reviewsByProductId = new Map<string, Review>();
  for (const r of reviews) {
    // Server now enriches legacy reviews, but keep fallback for any still missing productId
    const pid = r.productId ?? order?.items[0]?.productId;
    if (pid) reviewsByProductId.set(pid, r);
    else if (r.productId) reviewsByProductId.set(r.productId, r);
  }

  const canReviewProduct = (productId: string) =>
    order !== undefined &&
    (order.status === 'delivered' || order.status === 'completed') &&
    !reviewsByProductId.has(productId);

  const canReview =
    order !== undefined &&
    (order.status === 'delivered' || order.status === 'completed') &&
    order.items.some((item) => !reviewsByProductId.has(item.productId));

  const handleCancel = (reason: string) => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.cancelOrder(order.id),
      () => cancelMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'Order cancelled', error: 'Could not cancel the order' }
    );
  };

  const handleConfirmDelivery = () => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.confirmDelivery(order.id),
      () => confirmDeliveryMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Receipt confirmed', error: 'Could not confirm receipt' }
    );
  };

  const handleRequestRefund = (reason: string) => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.requestRefund(order.id),
      () => requestRefundMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'Refund requested — seller will review', error: 'Could not request refund' }
    );
  };

  const handleOpenReviewModal = (productId: string, productName: string) => {
    setReviewProductId(productId);
    setReviewProductName(productName);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    if (reviewSubmitting) return;
    setReviewModalOpen(false);
  };

  const handleSubmitReview = async () => {
    if (!order || !reviewProductId) return;
    if (!reviewComment.trim()) {
      message.warning('Please write a comment before submitting.');
      return;
    }
    setReviewSubmitting(true);
    try {
      await submitReviewMutation({
        orderId: order.id as Id<'orders'>,
        productId: reviewProductId as Id<'products'>,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      message.success('Review submitted — thank you!');
      setReviewModalOpen(false);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Could not submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const isActionPending = useCallback(
    (action: OrderAction, orderId: string) => isPending(ORDER_ACTION_KEYS[action](orderId)),
    [isPending]
  );

  return {
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
    handleCancel,
    handleConfirmDelivery,
    handleRequestRefund,
    isActionPending,
  };
}
