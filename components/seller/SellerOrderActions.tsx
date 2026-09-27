'use client';

import React, { useState } from 'react';
import { Button, Input, Modal, Typography } from 'antd';
import { CarOutlined, CheckCircleOutlined, CloseCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { Order } from '@/types/order';

interface SellerOrderActionsProps {
  order: Order;
  variant?: 'card' | 'detail';
  onConfirm: () => void;
  onReject: (reason: string) => void;
  onDispatch: () => void;
  onComplete: () => void;
  onApproveRefund?: () => void;
  onRejectRefund?: (reason: string) => void;
}

export function SellerOrderActions({
  order,
  variant = 'card',
  onConfirm,
  onReject,
  onDispatch,
  onComplete,
  onApproveRefund,
  onRejectRefund,
}: SellerOrderActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [refundRejectOpen, setRefundRejectOpen] = useState(false);
  const [refundRejectReason, setRefundRejectReason] = useState('');

  const compact = variant === 'card';

  const openReject = () => {
    setReason('');
    setRejectOpen(true);
  };

  const confirmReject = () => {
    onReject(reason);
    setRejectOpen(false);
  };

  const openRefundReject = () => {
    setRefundRejectReason('');
    setRefundRejectOpen(true);
  };

  const confirmRefundReject = () => {
    onRejectRefund?.(refundRejectReason);
    setRefundRejectOpen(false);
  };

  return (
    <div className={compact ? 'flex flex-wrap items-center justify-end gap-2' : 'flex flex-wrap gap-2.5'}>
      {order.status === 'pending' && (
        <>
          <Button
            type="primary"
            size={compact ? 'middle' : 'large'}
            icon={<CheckCircleOutlined />}
            onClick={onConfirm}
            className="!rounded-xl !font-semibold"
          >
            Confirm order
          </Button>
          <Button
            size={compact ? 'middle' : 'large'}
            onClick={openReject}
            danger
            icon={<CloseCircleOutlined />}
            className="!rounded-xl"
          >
            Reject
          </Button>
        </>
      )}

      {order.status === 'confirmed' && (
        <Button
          type="primary"
          size={compact ? 'middle' : 'large'}
          icon={<CarOutlined />}
          onClick={onDispatch}
          className="!rounded-xl !font-semibold"
        >
          Mark as to receive
        </Button>
      )}

      {order.status === 'delivered' && (
        <Button
          type="primary"
          size={compact ? 'middle' : 'large'}
          icon={<CheckOutlined />}
          onClick={onComplete}
          className="!rounded-xl !font-semibold"
        >
          Mark as completed
        </Button>
      )}

      {order.status === 'refund-requested' && (
        <>
          <Button
            type="primary"
            size={compact ? 'middle' : 'large'}
            icon={<CheckCircleOutlined />}
            onClick={onApproveRefund}
            className="!rounded-xl !font-semibold"
          >
            Approve refund
          </Button>
          <Button
            size={compact ? 'middle' : 'large'}
            onClick={openRefundReject}
            danger
            icon={<CloseCircleOutlined />}
            className="!rounded-xl"
          >
            Reject refund
          </Button>
        </>
      )}

      <Modal
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={confirmReject}
        okText="Reject order"
        okButtonProps={{ danger: true, className: '!rounded-lg' }}
        cancelText="Keep order"
        cancelButtonProps={{ className: '!rounded-lg' }}
        title="Reject this order?"
        width="min(92%, 420px)"
        centered
      >
        <p className="text-sm text-stone-500 leading-relaxed mb-3">
          Rejecting the order from {order.address.receiverName}. This can&apos;t be undone.
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

      <Modal
        open={refundRejectOpen}
        onCancel={() => setRefundRejectOpen(false)}
        onOk={confirmRefundReject}
        okText="Reject refund"
        okButtonProps={{ danger: true, className: '!rounded-lg' }}
        cancelText="Cancel"
        cancelButtonProps={{ className: '!rounded-lg' }}
        title="Reject refund request?"
        width="min(92%, 420px)"
        centered
      >
        <p className="text-sm text-stone-500 leading-relaxed mb-3">
          Rejecting the refund for {order.address.receiverName}. The order will return to delivered.
        </p>
        {order.refundReason && (
          <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <strong className="font-semibold">Buyer reason: </strong>
            {order.refundReason}
          </div>
        )}
        <Typography.Text type="secondary" className="text-xs">
          Reason (optional)
        </Typography.Text>
        <Input.TextArea
          rows={3}
          maxLength={140}
          showCount
          placeholder="e.g. No damage found, policy not met"
          value={refundRejectReason}
          onChange={(e) => setRefundRejectReason(e.target.value)}
          className="mt-1.5 !rounded-xl"
        />
      </Modal>
    </div>
  );
}
