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
  onDispatch: (courier: string, trackingNumber: string) => void | Promise<unknown>;
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
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

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

  const confirmDispatch = async () => {
    if (courier.trim().length < 2 || trackingNumber.trim().length < 3) return;
    const result = await onDispatch(courier.trim(), trackingNumber.trim());
    if (result === 'success') setDispatchOpen(false);
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
          onClick={() => { setCourier(''); setTrackingNumber(''); setDispatchOpen(true); }}
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

      <Modal
        open={dispatchOpen}
        onCancel={() => setDispatchOpen(false)}
        onOk={confirmDispatch}
        okText="Save and mark to receive"
        okButtonProps={{ loading: dispatchPending, disabled: courier.trim().length < 2 || courier.trim().length > 80 || trackingNumber.trim().length < 3 || trackingNumber.trim().length > 100, className: '!rounded-lg' }}
        cancelText="Cancel"
        cancelButtonProps={{ className: '!rounded-lg', disabled: dispatchPending }}
        title="Add delivery details"
        width="min(92%, 420px)"
        centered
      >
        <p className="mb-4 text-sm leading-relaxed text-stone-500">Add the courier and tracking number so the buyer can follow this delivery.</p>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-stone-700">Courier <span className="text-red-600">*</span>
            <Input maxLength={80} autoComplete="organization" placeholder="e.g. LBC" value={courier} onChange={(event) => setCourier(event.target.value)} className="mt-1.5 !rounded-xl" />
            <span className="mt-1 block text-xs font-normal text-stone-500">Enter the delivery company or courier name.</span>
          </label>
          <label className="block text-sm font-medium text-stone-700">Tracking number <span className="text-red-600">*</span>
            <Input maxLength={100} autoComplete="off" placeholder="e.g. 1234567890" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} className="mt-1.5 !rounded-xl" />
            <span className="mt-1 block text-xs font-normal text-stone-500">Enter the tracking number from your courier receipt.</span>
          </label>
        </div>
      </Modal>

    </div>
  );
}
