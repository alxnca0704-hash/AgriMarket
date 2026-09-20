'use client';

import React from 'react';
import { Empty, Rate } from 'antd';
import { Review } from '@/types/product';

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No reviews yet" />;
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-2xl bg-white shadow-sm p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-sm font-semibold shrink-0">
                {review.author.trim().charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-stone-800">{review.author}</p>
                <p className="text-xs text-stone-400">
                  {new Date(review.date).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <Rate disabled allowHalf value={review.rating} className="!text-xs" />
          </div>
          <p className="text-sm text-stone-600 leading-relaxed mt-3">{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}