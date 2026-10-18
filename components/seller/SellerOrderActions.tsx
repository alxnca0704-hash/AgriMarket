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
  onConfirmReturnReceived: () => void | Promise<unknown>;
}

export function SellerOrderActions({
  order,
  variant = 'card',
  isActionPending,
  onConfirm,
  onReject,
  onDispatch,
  onComplete,
  onConfirmReturnReceived,
}: SellerOrderActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const compact = variant === 'card';

  const confirmPending = isActionPending(ORDER_ACTIONS.confirmOrder, order.id);
  const rejectPending = isActionPending(ORDER_ACTIONS.rejectOrder, order.id);
  const dispatchPending = isActionPending(ORDER_ACTIONS.dispatchOrder, order.id);
  const completePending = isActionPending(ORDER_ACTIONS.completeOrder, order.id);
  const returnReceivedPending = isActionPending(ORDER_ACTIONS.confirmReturnReceived, order.id);

  const openReject = () => {
    setReason('');
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    const result = await onReject(reason);
    if (result === 'success') setRejectOpen(false);
  };

  return (
    <div className={compact ? 'flex flex-wrap items-center justify-end gap-2' : 'flex flex-wrap gap-2.5'}>
      {order.status === 'pending' && (
        order.payment.method === 'gcash' && order.payment.status !== 'paid' ? (
          <p className="w-full rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {order.payment.status === 'rejected'
              ? 'GCash proof was rejected. The buyer must resubmit payment proof before fulfilment can begin.'
              : 'Waiting for admin approval of GCash payment before fulfilment can begin.'}
          </p>
        ) : <>
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

      {order.status === 'return-in-transit' && (
        <Button type="primary" size={compact ? 'middle' : 'large'} icon={<CheckOutlined />} onClick={onConfirmReturnReceived} loading={returnReceivedPending} className="!rounded-xl !font-semibold">
          Confirm returned goods received
        </Button>
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

    </div>
  );
}
