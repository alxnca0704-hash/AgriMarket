'use client';

import React from 'react';
import { Alert, Button, Empty, Input, Progress, Rate, Skeleton } from 'antd';
import { MessageOutlined, StarFilled } from '@ant-design/icons';
import { useSellerReviews } from '@/hooks/useSellerReviews';

function ReviewsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-4">
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
      <div className="rounded-2xl bg-white shadow-sm p-5">
        <Skeleton active paragraph={{ rows: 4 }} title={{ width: '30%' }} />
      </div>
    </div>
  );
}

function RatingBreakdown({ averageRating, ratedPositive, total }: { averageRating: number; ratedPositive: number; total: number }) {
  const percentFor = (num: number) => (total > 0 ? (num / total) * 100 : 0);
  return (
    <div className="flex items-center gap-6">
      <div className="text-center shrink-0">
        <p className="text-4xl font-semibold text-stone-900">{averageRating.toFixed(1)}</p>
        <Rate disabled allowHalf value={averageRating} className="!text-xs" />
        <p className="text-xs text-stone-400 mt-1">{total} {total === 1 ? 'review' : 'reviews'}</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = star === 5 || star === 4 ? ratedPositive : 0;
          const pctVal = star === 5 ? 0 : percentFor(count);
          return (
            <div key={star} className="flex items-center gap-2 text-xs text-stone-500">
              <span className="w-6 shrink-0 flex items-center gap-0.5">
                {star} <StarFilled className="!text-amber-400 !text-[10px]" />
              </span>
              <Progress
                percent={Math.round(pctVal)}
                showInfo={false}
                strokeColor="#2D6A4F"
                trailColor="#EDEDED"
                size="small"
                className="!m-0 flex-1"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewsView() {
  const {
    isLoading,
    error,
    reviews,
    averageRating,
    ratedPositive,
    replyDrafts,
    updateReplyDraft,
    submitReply,
  } = useSellerReviews();

  if (isLoading) return <ReviewsSkeleton />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Feedback</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
          Customer reviews
        </h1>
      </div>

      {error && <Alert type="error" title={error} showIcon />}

      <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6">
        <RatingBreakdown
          averageRating={averageRating}
          ratedPositive={ratedPositive}
          total={reviews.length}
        />
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm py-14">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-stone-500">
                No reviews yet — they appear here when buyers rate your products.
              </span>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl bg-white shadow-sm p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900">{review.author}</p>
                  <p className="text-xs text-stone-400">
                    {review.productName} · {new Date(review.date).toLocaleDateString()}
                  </p>
                </div>
                <Rate disabled allowHalf value={review.rating} className="!text-xs shrink-0" />
              </div>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">{review.comment}</p>

              {review.reply ? (
                <div className="mt-3 rounded-xl bg-sage-soft/60 px-3.5 py-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D6A4F] mb-1">
                    <MessageOutlined /> Your reply
                    <span className="font-normal text-stone-400">
                      · {new Date(review.reply.repliedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-stone-700">{review.reply.reply}</p>
                </div>
              ) : (
                <div className="mt-3 rounded-xl bg-stone-50/80 p-3">
                  <Input.TextArea
                    rows={2}
                    maxLength={280}
                    showCount={false}
                    placeholder="Reply to this review…"
                    value={replyDrafts[review.id] ?? ''}
                    onChange={(e) => updateReplyDraft(review.id, e.target.value)}
                    className="!rounded-xl !bg-white"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => submitReply(review)}
                      className="!rounded-lg !text-xs"
                    >
                      Post reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}