'use client';

import React, { useState } from 'react';
import { Button, Input, Modal, Typography } from 'antd';
import { CarOutlined, CheckCircleOutlined, CloseCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { Order } from '@/types/order';
import { ORDER_ACTIONS, OrderAction } from '@/constants/orders';

interface SellerOrderActionsProps {
  order: Order;
  variant?: 'card' | 'detail';
  isActionPending: (action: OrderAction, orderId: string) => boolean;
  onConfirm: () => void | Promise<unknown>;
  onReject: (reason: string) => void | Promise<unknown>;
  onDispatch: () => void | Promise<unknown>;
  onComplete: () => void | Promise<unknown>;
  onApproveRefund?: () => void | Promise<unknown>;
  onRejectRefund?: (reason: string) => void | Promise<unknown>;
}

export function SellerOrderActions({
  order,
  variant = 'card',
  isActionPending,
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

  const confirmPending = isActionPending(ORDER_ACTIONS.confirmOrder, order.id);
  const rejectPending = isActionPending(ORDER_ACTIONS.rejectOrder, order.id);
  const dispatchPending = isActionPending(ORDER_ACTIONS.dispatchOrder, order.id);
  const completePending = isActionPending(ORDER_ACTIONS.completeOrder, order.id);
  const approvePending = isActionPending(ORDER_ACTIONS.approveRefund, order.id);
  const rejectRefundPending = isActionPending(ORDER_ACTIONS.rejectRefund, order.id);

  const openReject = () => {
    setReason('');
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    const result = await onReject(reason);
    if (result === 'success') setRejectOpen(false);
  };

  const openRefundReject = () => {
    setRefundRejectReason('');
    setRefundRejectOpen(true);
  };

  const confirmRefundReject = async () => {
    const result = await onRejectRefund?.(refundRejectReason);
    if (result === 'success') setRefundRejectOpen(false);
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
            loading={confirmPending}
            className="!rounded-xl !font-semibold"
          >
            Confirm order
          </Button>
          <Button
            size={compact ? 'middle' : 'large'}
            onClick={openReject}
            disabled={rejectPending}
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
          loading={dispatchPending}
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
          loading={completePending}
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
            loading={approvePending}
            className="!rounded-xl !font-semibold"
          >
            Approve refund
          </Button>
          <Button
            size={compact ? 'middle' : 'large'}
            onClick={openRefundReject}
            disabled={rejectRefundPending}
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
        okButtonProps={{ danger: true, loading: rejectPending, className: '!rounded-lg' }}
        cancelText="Keep order"
        cancelButtonProps={{ className: '!rounded-lg', disabled: rejectPending }}
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
        okButtonProps={{ danger: true, loading: rejectRefundPending, className: '!rounded-lg' }}
        cancelText="Cancel"
        cancelButtonProps={{ className: '!rounded-lg', disabled: rejectRefundPending }}
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
