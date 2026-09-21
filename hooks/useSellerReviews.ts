'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { App } from 'antd';
import { SellerReview } from '@/types/seller';
import { getSellerReviews, submitReviewReply, subscribeReviews } from '@/lib/mockReviews';

export function useSellerReviews() {
  const { message } = App.useApp();
  const reviews = useSyncExternalStore<SellerReview[]>(
    subscribeReviews,
    getSellerReviews,
    () => getSellerReviews()
  );

  const [isLoading, setIsLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const updateReplyDraft = (reviewId: string, value: string) => {
    setReplyDrafts((prev) => ({ ...prev, [reviewId]: value }));
  };

  const submitReply = (review: SellerReview) => {
    const text = replyDrafts[review.id]?.trim() ?? '';
    if (!text) {
      message.warning('Write a reply first');
      return;
    }
    submitReviewReply(review.id, text);
    setReplyDrafts((prev) => {
      const next = { ...prev };
      delete next[review.id];
      return next;
    });
    message.success('Reply posted');
  };

  const ratedPositive = reviews.filter((r) => r.rating >= 4).length;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return {
    isLoading,
    error: null,
    reviews,
    averageRating,
    ratedPositive,
    replyDrafts,
    updateReplyDraft,
    submitReply,
  };
}