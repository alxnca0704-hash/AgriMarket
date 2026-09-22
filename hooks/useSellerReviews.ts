'use client';

import { useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Review } from '@/types/review';

export interface ProductGroup {
  productId: string;
  productName: string;
  reviews: Review[];
  averageRating: number;
  ratingCounts: Record<number, number>;
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

export function useSellerReviews() {
  const { message } = App.useApp();

  const rawReviews = useQuery(api.reviews.listSellerReviews);
  const replyMutation = useMutation(api.reviews.replyToReview);

  const isLoading = rawReviews === undefined;
  const reviews: Review[] = rawReviews ? rawReviews.map(toReview) : [];

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replySubmitting, setReplySubmitting] = useState<Record<string, boolean>>({});

  const updateReplyDraft = (reviewId: string, value: string) => {
    setReplyDrafts((prev) => ({ ...prev, [reviewId]: value }));
  };

  const submitReply = async (review: Review) => {
    const text = replyDrafts[review.id]?.trim() ?? '';
    if (!text) {
      message.warning('Write a reply first');
      return;
    }
    setReplySubmitting((prev) => ({ ...prev, [review.id]: true }));
    try {
      await replyMutation({ reviewId: review.id as Id<'reviews'>, reply: text });
      setReplyDrafts((prev) => {
        const next = { ...prev };
        delete next[review.id];
        return next;
      });
      message.success('Reply posted');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Could not post reply');
    } finally {
      setReplySubmitting((prev) => ({ ...prev, [review.id]: false }));
    }
  };

  // Overall stats
  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.round(r.rating);
    if (star >= 1 && star <= 5) ratingCounts[star]++;
  }
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Per-product grouping
  const groupMap = new Map<string, { productName: string; reviews: Review[] }>();
  for (const r of reviews) {
    const key = r.productId ?? '__uncategorized__';
    const name = r.productName ?? 'Uncategorized';
    if (!groupMap.has(key)) groupMap.set(key, { productName: name, reviews: [] });
    groupMap.get(key)!.reviews.push(r);
  }
  const reviewsByProduct: ProductGroup[] = Array.from(groupMap.entries())
    .map(([productId, { productName, reviews: pReviews }]) => {
      const pCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const r of pReviews) {
        const s = Math.round(r.rating);
        if (s >= 1 && s <= 5) pCounts[s]++;
      }
      const pAvg =
        pReviews.length > 0
          ? pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length
          : 0;
      return { productId, productName, reviews: pReviews, averageRating: pAvg, ratingCounts: pCounts };
    })
    // sort: most reviews first
    .sort((a, b) => b.reviews.length - a.reviews.length);

  return {
    isLoading,
    error: null,
    reviews,
    averageRating,
    ratingCounts,
    reviewsByProduct,
    replyDrafts,
    replySubmitting,
    updateReplyDraft,
    submitReply,
  };
}