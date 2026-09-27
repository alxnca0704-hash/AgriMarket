'use client';

import React, { useState } from 'react';
import { Button, Input, Modal, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, UndoOutlined } from '@ant-design/icons';
import { Order } from '@/types/order';

interface OrderActionsProps {
  order: Order;
  variant?: 'card' | 'detail';
  onConfirmDelivery: () => void;
  onCancel: (reason: string) => void;
  onRequestRefund?: (reason: string) => void;
}

export function OrderActions({
  order,
  variant = 'card',
  onConfirmDelivery,
  onCancel,
  onRequestRefund,
}: OrderActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  const compact = variant === 'card';

  const openCancel = () => {
    setReason('');
    setCancelOpen(true);
  };

  const confirmCancel = () => {
    onCancel(reason);
    setCancelOpen(false);
  };

  const openRefund = () => {
    setRefundReason('');
    setRefundOpen(true);
  };

  const confirmRefund = () => {
    const trimmed = refundReason.trim();
    if (trimmed.length < 10) return;
    onRequestRefund?.(trimmed);
    setRefundOpen(false);
  };

  return (
    <div className={`${compact ? 'flex flex-wrap items-center justify-end gap-2' : 'flex flex-wrap gap-2.5'}`}>
      {order.status === 'to-receive' && (
        <Button
          type="primary"
          size={compact ? 'middle' : 'large'}
          onClick={onConfirmDelivery}
          icon={<CheckCircleOutlined />}
          className="!rounded-xl !font-semibold"
        >
          Confirm received
        </Button>
      )}

      {order.status === 'pending' && (
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

      {order.status === 'delivered' && onRequestRefund && (
        <Button
          size={compact ? 'middle' : 'large'}
          onClick={openRefund}
          icon={<UndoOutlined />}
          className="!rounded-xl"
        >
          Request refund
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
          Cancelling your order from {order.sellerName}. This can&apos;t be undone.
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
        open={refundOpen}
        onCancel={() => setRefundOpen(false)}
        onOk={confirmRefund}
        okText="Request refund"
        okButtonProps={{
          disabled: refundReason.trim().length < 10,
          className: '!rounded-lg',
        }}
        cancelText="Keep order"
        cancelButtonProps={{ className: '!rounded-lg' }}
        title="Request a refund?"
        width="min(92%, 420px)"
        centered
      >
        <p className="text-sm text-stone-500 leading-relaxed mb-3">
          You received this order from {order.sellerName}. Describe the issue — the seller will review and confirm.
        </p>
        <Typography.Text type="secondary" className="text-xs">
          Reason (required, at least 10 characters)
        </Typography.Text>
        <Input.TextArea
          rows={3}
          maxLength={500}
          showCount
          placeholder="e.g. Produce was damaged / wrong item / not fresh"
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
          className="mt-1.5 !rounded-xl"
        />
      </Modal>
    </div>
  );
}
