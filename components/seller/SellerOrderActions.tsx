'use client';

import React, { useState } from 'react';
import { Button, Input, Modal, Typography } from 'antd';
import { CarOutlined, CheckCircleOutlined, CloseCircleOutlined, SendOutlined } from '@ant-design/icons';
import { Order } from '@/types/order';

interface SellerOrderActionsProps {
  order: Order;
  variant?: 'card' | 'detail';
  onAccept: () => void;
  onMarkReady: () => void;
  onMarkShipped: () => void;
  onCancel: (reason: string) => void;
}

export function SellerOrderActions({
  order,
  variant = 'card',
  onAccept,
  onMarkReady,
  onMarkShipped,
  onCancel,
}: SellerOrderActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  const compact = variant === 'card';
  const actionable = order.status === 'to-ship';

  const openCancel = () => {
    setReason('');
    setCancelOpen(true);
  };

  const confirmCancel = () => {
    onCancel(reason);
    setCancelOpen(false);
  };

  return (
    <div className={compact ? 'flex flex-wrap items-center justify-end gap-2' : 'flex flex-wrap gap-2.5'}>
      {actionable && !order.acceptedAt && (
        <Button
          type="primary"
          size={compact ? 'middle' : 'large'}
          icon={<CheckCircleOutlined />}
          onClick={onAccept}
          className="!rounded-xl !font-semibold"
        >
          Accept order
        </Button>
      )}

      {actionable && order.acceptedAt && !order.readyAt && (
        <Button
          type="primary"
          size={compact ? 'middle' : 'large'}
          icon={<CheckCircleOutlined />}
          onClick={onMarkReady}
          className="!rounded-xl !font-semibold"
        >
          Mark as ready
        </Button>
      )}

      {actionable && order.acceptedAt && order.readyAt && !order.shippedAt && (
        <Button
          type="primary"
          size={compact ? 'middle' : 'large'}
          icon={<CarOutlined />}
          onClick={onMarkShipped}
          className="!rounded-xl !font-semibold"
        >
          Mark as shipped
        </Button>
      )}

      {actionable && (
        <Button
          size={compact ? 'middle' : 'large'}
          onClick={openCancel}
          danger
          icon={<CloseCircleOutlined />}
          className="!rounded-xl"
        >
          Cancel
        </Button>
      )}

      {order.shippedAt && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-sage">
          <SendOutlined /> Shipped
        </span>
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
          Cancel order #{order.id}? This can&apos;t be undone.
        </p>
        <Typography.Text type="secondary" className="text-xs">
          Reason (optional)
        </Typography.Text>
        <Input.TextArea
          rows={3}
          maxLength={140}
          showCount
          placeholder="e.g. Out of stock, buyer unresponsive"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1.5 !rounded-xl"
        />
      </Modal>
    </div>
  );
}