'use client';

import React from 'react';
import { Button, Input, Modal, Rate } from 'antd';
import { StarFilled } from '@ant-design/icons';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

export interface ReviewModalProps {
  open: boolean;
  sellerName: string;
  productName: string;
  rating: number;
  comment: string;
  submitting: boolean;
  onRatingChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ReviewModal({
  open,
  sellerName,
  productName,
  rating,
  comment,
  submitting,
  onRatingChange,
  onCommentChange,
  onSubmit,
  onCancel,
}: ReviewModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={!submitting}
      mask={{ closable: !submitting }}
      title={
        <div>
          <p className="text-base font-semibold text-stone-900">{productName}</p>
          <p className="text-xs font-normal text-stone-400 mt-0.5">{sellerName}</p>
        </div>
      }
      width="90%"
      style={{ maxWidth: 480 }}
    >
      <div className="space-y-5 pt-3 pb-1">
        {/* Star rating */}
        <div className="flex flex-col items-center gap-2">
          <Rate
            value={rating}
            onChange={onRatingChange}
            character={<StarFilled />}
            className="!text-3xl"
          />
          <p className="text-sm font-medium text-stone-500">
            {RATING_LABELS[rating] ?? ''}
          </p>
        </div>

        {/* Comment */}
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
            Your review
          </p>
          <Input.TextArea
            rows={4}
            maxLength={500}
            showCount
            placeholder="Share your experience with this seller's produce…"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            className="!rounded-xl"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            block
            onClick={onCancel}
            disabled={submitting}
            className="!rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            block
            loading={submitting}
            disabled={!comment.trim()}
            onClick={onSubmit}
            className="!rounded-xl !bg-[#2D6A4F] hover:!bg-[#1B4332]"
          >
            Submit review
          </Button>
        </div>
      </div>
    </Modal>
  );
}
