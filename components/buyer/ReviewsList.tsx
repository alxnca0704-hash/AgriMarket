'use client';

import React from 'react';
import { Empty, Rate } from 'antd';
import { Review } from '@/types/product';

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="py-10">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No customer reviews yet" />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-stone-100">
      {reviews.map((review) => (
        <li key={review.id} className="py-6 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-sage-soft text-sage flex items-center justify-center text-sm font-semibold shrink-0">
                {review.author.trim().charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium text-stone-900">{review.author}</p>
                <p className="text-xs text-stone-400">
                  {new Date(review.date).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <Rate disabled allowHalf value={review.rating} className="!text-xs text-amber-500" />
          </div>
          <p className="text-sm text-stone-600 leading-relaxed mt-3">{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}