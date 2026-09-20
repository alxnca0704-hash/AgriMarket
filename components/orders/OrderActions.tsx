'use client';

import React, { useState } from 'react';
import { Button, Input, Modal, Rate, Typography } from 'antd';
import {
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Order } from '@/types/order';

interface OrderActionsProps {
  order: Order;
  variant?: 'card' | 'detail';
  onShip: () => void;
  onReceive: () => void;
  onReview: () => void;
  onCancel: (reason: string) => void;
}

export function OrderActions({
  order,
  variant = 'card',
  onShip,
  onReceive,
  onReview,
  onCancel,
}: OrderActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const compact = variant === 'card';

  const openCancel = () => {
    setReason('');
    setCancelOpen(true);
  };

  const confirmCancel = () => {
    onCancel(reason);
    setCancelOpen(false);
  };

  const openReview = () => {
    setRating(5);
    setComment('');
    setReviewOpen(true);
  };

  const confirmReview = () => {
    onReview();
    setReviewOpen(false);
  };

  return (
    <div className={`${compact ? 'flex flex-wrap items-center justify-end gap-2' : 'flex flex-wrap gap-2.5'}`}>
      {order.status === 'to-review' && (
        <Button
          type="primary"
          size={compact ? 'middle' : 'large'}
          onClick={openReview}
          icon={<StarOutlined />}
          className="!rounded-xl !font-semibold"
        >
          Write a review
        </Button>
      )}

      {order.status === 'to-receive' && (
        <Button
          type="primary"
          size={compact ? 'middle' : 'large'}
          onClick={onReceive}
          icon={<CheckCircleOutlined />}
          className="!rounded-xl !font-semibold"
        >
          Confirm received
        </Button>
      )}

      {order.status === 'to-ship' && variant === 'detail' && (
        <Button
          size={compact ? 'middle' : 'large'}
          onClick={onShip}
          icon={<CarOutlined />}
          className="!rounded-xl !border-stone-200 hover:!border-sage hover:!text-sage"
        >
          Simulate courier pickup
        </Button>
      )}

      {order.status === 'to-ship' && (
        <Button
          size={compact ? 'middle' : 'large'}
          onClick={openCancel}
          danger
          icon={<CloseCircleOutlined />}
          className="!rounded-xl"
        >
          Cancel order
        </Button>
      )}

      <Modal
        open={cancelOpen}
        onCancel={() => setCancelOpen(false)}
        onOk={confirmCancel}
        okText="Cancel order"
        okButtonProps={{ danger: true, className: '!rounded-lg' }}
        cancelText="Keep order"
        cancelButtonProps={{ className: '!rounded-lg' }}
        title="Cancel this order?"
        width="min(92%, 420px)"
        centered
      >
        <p className="text-sm text-stone-500 leading-relaxed mb-3">
          Cancelling {order.sellerName} order #{order.id}. This can&apos;t be undone.
        </p>
        <Typography.Text type="secondary" className="text-xs">
          Reason (optional)
        </Typography.Text>
        <Input.TextArea
          rows={3}
          maxLength={140}
          showCount
          placeholder="e.g. Ordered by mistake, delivery takes too long"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1.5 !rounded-xl"
        />
      </Modal>

      <Modal
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        onOk={confirmReview}
        okText="Submit review"
        okButtonProps={{ className: '!rounded-lg' }}
        cancelText="Later"
        cancelButtonProps={{ className: '!rounded-lg' }}
        title={`Rate your order from ${order.sellerName}`}
        width="min(92%, 420px)"
        centered
      >
        <div className="flex flex-col items-start gap-4 pt-1">
          <div className="flex flex-col items-center gap-1 w-full">
            <Rate
              value={rating}
              onChange={setRating}
              className="!text-lg"
            />
            <Typography.Text type="secondary" className="text-xs">
              How was the freshness and quality?
            </Typography.Text>
          </div>
          <div className="w-full">
            <Typography.Text type="secondary" className="text-xs">
              Your review (optional)
            </Typography.Text>
            <Input.TextArea
              rows={3}
              maxLength={200}
              showCount
              placeholder="e.g. Fresh produce, packed well and delivered on time"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1.5 !rounded-xl"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}