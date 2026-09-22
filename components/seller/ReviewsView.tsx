'use client';

import React, { useState } from 'react';
import { Alert, Button, Empty, Input, Progress, Rate, Select, Skeleton, Tag } from 'antd';
import { MessageOutlined, ShoppingOutlined, StarFilled } from '@ant-design/icons';
import { useSellerReviews } from '@/hooks/useSellerReviews';
import { ProductGroup } from '@/hooks/useSellerReviews';
import { Review } from '@/types/review';

function ReviewsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-6">
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
      <div className="rounded-2xl bg-white shadow-sm p-5">
        <Skeleton active paragraph={{ rows: 4 }} title={{ width: '30%' }} />
      </div>
      <div className="rounded-2xl bg-white shadow-sm p-5">
        <Skeleton active paragraph={{ rows: 4 }} title={{ width: '30%' }} />
      </div>
    </div>
  );
}

function RatingBreakdown({
  averageRating,
  ratingCounts,
  total,
}: {
  averageRating: number;
  ratingCounts: Record<number, number>;
  total: number;
}) {
  const percentFor = (count: number) => (total > 0 ? (count / total) * 100 : 0);
  return (
    <div className="flex items-center gap-6">
      <div className="text-center shrink-0">
        <p className="text-3xl font-semibold text-stone-900">{averageRating.toFixed(1)}</p>
        <Rate disabled allowHalf value={averageRating} className="!text-xs" />
        <p className="text-xs text-stone-400 mt-1">
          {total} {total === 1 ? 'review' : 'reviews'}
        </p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="flex items-center gap-2 text-xs text-stone-500">
            <span className="w-6 shrink-0 flex items-center gap-0.5">
              {star} <StarFilled className="!text-amber-400 !text-[10px]" />
            </span>
            <Progress
              percent={Math.round(percentFor(ratingCounts[star] ?? 0))}
              showInfo={false}
              strokeColor="#2D6A4F"
              railColor="#EDEDED"
              size="small"
              className="!m-0 flex-1"
            />
            <span className="w-5 text-right">{ratingCounts[star] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  replyDraft: string;
  isSubmitting: boolean;
  onUpdateDraft: (value: string) => void;
  onSubmitReply: () => void;
}

function ReviewCard({
  review,
  replyDraft,
  isSubmitting,
  onUpdateDraft,
  onSubmitReply,
}: ReviewCardProps) {
  return (
    <div className="rounded-xl bg-stone-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900">{review.buyerName}</p>
          <p className="text-xs text-stone-400">
            {new Date(review.createdAt).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <Rate disabled allowHalf value={review.rating} className="!text-xs shrink-0" />
      </div>
      <p className="text-sm text-stone-600 mt-2 leading-relaxed">{review.comment}</p>

      {review.reply ? (
        <div className="mt-3 rounded-xl bg-sage-soft/60 px-3.5 py-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D6A4F] mb-1">
            <MessageOutlined /> Your reply
            {review.repliedAt && (
              <span className="font-normal text-stone-400">
                ·{' '}
                {new Date(review.repliedAt).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
          <p className="text-sm text-stone-700">{review.reply}</p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-white/80 p-3">
          <Input.TextArea
            rows={2}
            maxLength={500}
            showCount={false}
            placeholder="Reply to this review…"
            value={replyDraft}
            onChange={(e) => onUpdateDraft(e.target.value)}
            className="!rounded-xl !bg-white"
          />
          <div className="flex justify-end mt-2">
            <Button
              type="primary"
              size="small"
              loading={isSubmitting}
              disabled={!replyDraft.trim()}
              onClick={onSubmitReply}
              className="!rounded-lg !text-xs !bg-[#2D6A4F] hover:!bg-[#1B4332]"
            >
              Post reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProductSectionProps {
  group: ProductGroup;
  replyDrafts: Record<string, string>;
  replySubmitting: Record<string, boolean>;
  onUpdateDraft: (reviewId: string, value: string) => void;
  onSubmitReply: (review: Review) => void;
}

function ProductSection({
  group,
  replyDrafts,
  replySubmitting,
  onUpdateDraft,
  onSubmitReply,
}: ProductSectionProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Product header */}
      <div className="px-5 pt-5 pb-4 border-b border-stone-100">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingOutlined className="text-stone-400 shrink-0" />
            <p className="text-sm font-semibold text-stone-900 truncate">{group.productName}</p>
          </div>
          <Tag
            className="!text-[11px] !rounded-full !border-0 !bg-stone-100 !text-stone-500"
          >
            {group.reviews.length} {group.reviews.length === 1 ? 'review' : 'reviews'}
          </Tag>
        </div>
        <div className="mt-4">
          <RatingBreakdown
            averageRating={group.averageRating}
            ratingCounts={group.ratingCounts}
            total={group.reviews.length}
          />
        </div>
      </div>

      {/* Reviews list */}
      <div className="p-4 space-y-3">
        {group.reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            replyDraft={replyDrafts[review.id] ?? ''}
            isSubmitting={replySubmitting[review.id] ?? false}
            onUpdateDraft={(val) => onUpdateDraft(review.id, val)}
            onSubmitReply={() => onSubmitReply(review)}
          />
        ))}
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
    ratingCounts,
    reviewsByProduct,
    replyDrafts,
    replySubmitting,
    updateReplyDraft,
    submitReply,
  } = useSellerReviews();

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  if (isLoading) return <ReviewsSkeleton />;

  const visibleGroups = selectedProduct
    ? reviewsByProduct.filter((g) => g.productId === selectedProduct)
    : reviewsByProduct;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Feedback</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
          Customer reviews
        </h1>
      </div>

      {error && <Alert type="error" message={error} showIcon />}

      {/* Overall summary */}
      <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-4">
          Overall rating
        </p>
        <RatingBreakdown
          averageRating={averageRating}
          ratingCounts={ratingCounts}
          total={reviews.length}
        />
      </div>

      {reviewsByProduct.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm py-14">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-stone-500">
                No reviews yet — they appear here when buyers rate your orders.
              </span>
            }
          />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-medium text-stone-500 shrink-0">Filter by product</p>
            <Select
              allowClear
              placeholder="All products"
              value={selectedProduct}
              onChange={(v) => setSelectedProduct(v ?? null)}
              className="w-full sm:w-64"
              options={reviewsByProduct.map((g) => ({
                value: g.productId,
                label: `${g.productName} (${g.reviews.length})`,
              }))}
            />
          </div>

          {visibleGroups.map((group) => (
            <ProductSection
              key={group.productId}
              group={group}
              replyDrafts={replyDrafts}
              replySubmitting={replySubmitting}
              onUpdateDraft={updateReplyDraft}
              onSubmitReply={(review) => void submitReply(review)}
            />
          ))}
        </div>
      )}
    </div>
  );
}