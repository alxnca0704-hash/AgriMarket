'use client';

import React from 'react';
import { Alert, Empty, Rate, Skeleton } from 'antd';
import { Review } from '@/types/review';

export interface ReviewsListProps {
  reviews: Review[];
  isLoading?: boolean;
  error?: string | null;
}

export function ReviewsList({ reviews, isLoading, error }: ReviewsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="py-4">
            <Skeleton active paragraph={{ rows: 2 }} title={{ width: '30%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <Alert type="error" title={error} showIcon />;
  }

  if (reviews.length === 0) {
    return (
      <div className="py-10">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No reviews for this product yet — be the first to review after delivery" />
      </div>
    );
  }

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
          <Rate disabled allowHalf value={average} className="!text-sm !text-amber-500" />
          {average.toFixed(1)}
        </span>
        <span className="text-xs text-stone-400">
          · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} for this product
        </span>
      </div>

      <ul className="divide-y divide-stone-100">
        {reviews.map((review) => (
          <li key={review.id} className="py-6 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-sage-soft text-sage flex items-center justify-center text-sm font-semibold shrink-0">
                  {review.buyerName.trim().charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-stone-900">{review.buyerName}</p>
                  <p className="text-xs text-stone-400">
                    {new Date(review.createdAt).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {review.productName ? ` · ${review.productName}` : ''}
                  </p>
                </div>
              </div>
              <Rate disabled allowHalf value={review.rating} className="!text-xs text-amber-500" />
            </div>
            <p className="text-sm text-stone-600 leading-relaxed mt-3">{review.comment}</p>
            {review.reply && (
              <div className="mt-3 rounded-xl bg-sage-soft/50 px-3.5 py-3">
                <p className="text-xs font-semibold text-[#2D6A4F] mb-1">Seller&apos;s reply</p>
                <p className="text-sm text-stone-700 leading-relaxed">{review.reply}</p>
                {review.repliedAt && (
                  <p className="text-[11px] text-stone-400 mt-1">
                    {new Date(review.repliedAt).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}