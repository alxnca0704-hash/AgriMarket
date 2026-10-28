'use client';

import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, UndoOutlined } from '@ant-design/icons';
import { Order } from '@/types/order';
import { ORDER_ACTIONS, OrderAction } from '@/constants/orders';
import { isValidGcashNumber, RETURN_REQUEST_WINDOW_MS, RETURN_WINDOW_CLOSED_MESSAGE } from '@/constants/refunds';
import { useRefundEvidence } from '@/hooks/useRefundEvidence';

interface OrderActionsProps {
  order: Order;
  variant?: 'card' | 'detail';
  isActionPending: (action: OrderAction, orderId: string) => boolean;
  onConfirmDelivery: () => void | Promise<unknown>;
  onCancel: (reason: string) => void | Promise<unknown>;
  onRequestRefund?: (
    reason: string,
    evidenceUrls: string[],
    refundGcashNumber?: string,
    refundGcashName?: string
  ) => void | Promise<unknown>;
}

export function OrderActions({
  order,
  variant = 'card',
  isActionPending,
  onConfirmDelivery,
  onCancel,
  onRequestRefund,
}: OrderActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundGcashNumber, setRefundGcashNumber] = useState('');
  const [refundGcashName, setRefundGcashName] = useState('');
  const [refundWindowOpen, setRefundWindowOpen] = useState<boolean | null>(null);
  const evidence = useRefundEvidence();

  const showRefund = order.status === 'delivered' || order.status === 'completed';

  useEffect(() => {
    const deliveredAt = order.deliveredAt ? Date.parse(order.deliveredAt) : NaN;
    const open =
      Number.isFinite(deliveredAt) && Date.now() - deliveredAt <= RETURN_REQUEST_WINDOW_MS;
    const timer = setTimeout(() => setRefundWindowOpen(open), 0);
    return () => clearTimeout(timer);
  }, [order.deliveredAt]);

  const compact = variant === 'card';

  const confirmPending = isActionPending(ORDER_ACTIONS.confirmDelivery, order.id);
  const cancelPending = isActionPending(ORDER_ACTIONS.cancelOrder, order.id);
  const refundPending = isActionPending(ORDER_ACTIONS.requestRefund, order.id);

  const openCancel = () => {
    setReason('');
    setCancelOpen(true);
  };

  const confirmCancel = async () => {
    const result = await onCancel(reason);
    if (result === 'success') setCancelOpen(false);
  };

  const isCod = order.payment.method === 'cod';
  const refundDetailsValid = !isCod
    || (isValidGcashNumber(refundGcashNumber) && refundGcashName.trim().length >= 2);

  const openRefund = () => {
    setRefundReason('');
    setRefundGcashNumber('');
    setRefundGcashName('');
    evidence.setFiles([]);
    setRefundOpen(true);
  };

  const confirmDelivery = async () => {
    const result = await onConfirmDelivery();
    if (result === 'success') setConfirmDeliveryOpen(false);
  };

  const confirmRefund = async () => {
    const trimmed = refundReason.trim();
    if (trimmed.length < 10) return;
    if (evidence.files.length < 1 || evidence.files.length > 5) return;
    if (!refundDetailsValid) return;
    const evidenceUrls = await evidence.upload();
    const result = await onRequestRefund?.(
      trimmed,
      evidenceUrls,
      isCod ? refundGcashNumber.trim() : undefined,
      isCod ? refundGcashName.trim() : undefined
    );
    if (result === 'success') setRefundOpen(false);
  };

  return (
    <div className={`${compact ? 'flex flex-wrap items-center justify-end gap-2' : 'flex flex-wrap gap-2.5'}`}>
      {order.status === 'to-receive' && (
        <Button
          type="primary"
          size={compact ? 'middle' : 'large'}
          onClick={() => setConfirmDeliveryOpen(true)}
          disabled={confirmPending}
          icon={<CheckCircleOutlined />}
          className="!rounded-xl !font-semibold"
        >
          Confirm received
        </Button>
      )}

      <Modal
        open={confirmDeliveryOpen}
        onCancel={() => setConfirmDeliveryOpen(false)}
        onOk={confirmDelivery}
        title="Did you receive this order?"
        okText="Yes, I received it"
        okButtonProps={{ loading: confirmPending, disabled: confirmPending, className: '!rounded-lg' }}
        cancelText="Not yet"
        cancelButtonProps={{ className: '!rounded-lg', disabled: confirmPending }}
        width="min(92%, 420px)"
        centered
      >
        <p className="text-sm text-stone-500 leading-relaxed">
          Confirm only if your order has arrived. This will mark the order as complete. If it has not arrived, choose “Not yet.”
        </p>
      </Modal>

      {order.status === 'pending' && (
        order.payment.method === 'gcash' ? (
          <span className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Contact support to cancel a GCash order.</span>
        ) : <Button
          size={compact ? 'middle' : 'large'}
          onClick={openCancel}
          disabled={cancelPending}
          danger
          icon={<CloseCircleOutlined />}
          className="!rounded-xl"
        >
          Cancel order
        </Button>
      )}

      {showRefund && onRequestRefund && refundWindowOpen !== null && (
        refundWindowOpen ? (
          <Button
            size={compact ? 'middle' : 'large'}
            onClick={openRefund}
            disabled={refundPending}
            icon={<UndoOutlined />}
            className="!rounded-xl"
          >
            Request refund
          </Button>
        ) : (
          <Button
            size={compact ? 'middle' : 'large'}
            disabled
            icon={<UndoOutlined />}
            className="!rounded-xl"
            title={RETURN_WINDOW_CLOSED_MESSAGE}
          >
            Return window closed
          </Button>
        )
      )}

      <Modal
        open={cancelOpen}
        onCancel={() => setCancelOpen(false)}
        onOk={confirmCancel}
        okText="Cancel order"
        okButtonProps={{ danger: true, loading: cancelPending, className: '!rounded-lg' }}
        cancelText="Keep order"
        cancelButtonProps={{ className: '!rounded-lg', disabled: cancelPending }}
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
          loading: refundPending || evidence.isUploading,
          disabled: refundPending || evidence.isUploading || refundReason.trim().length < 10 || evidence.files.length < 1 || evidence.files.length > 5 || !refundDetailsValid,
          className: '!rounded-lg',
        }}
        cancelText="Keep order"
        cancelButtonProps={{ className: '!rounded-lg', disabled: refundPending || evidence.isUploading }}
        title="Request a return?"
        width="min(92%, 420px)"
        centered
      >
        <p className="text-sm text-stone-500 leading-relaxed mb-3">
          Order <span className="font-mono">{order.id}</span> from {order.sellerName}. Describe the issue and attach evidence for review.
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
        <Typography.Text type="secondary" className="mt-4 block text-xs">Photos or video (1–5 files, up to 5 MB each)</Typography.Text>
        {isCod && (
          <div className="mt-4 space-y-3 rounded-xl bg-stone-50 p-3">
            <p className="text-xs leading-relaxed text-stone-500">
              The seller will send the refund to this GCash account after receiving the returned goods.
            </p>
            <div>
              <Typography.Text type="secondary" className="text-xs">GCash account name (required)</Typography.Text>
              <Input
                maxLength={100}
                autoComplete="name"
                placeholder="Name on the GCash account"
                value={refundGcashName}
                onChange={(event) => setRefundGcashName(event.target.value)}
                className="mt-1.5 !rounded-xl"
              />
            </div>
            <div>
              <Typography.Text type="secondary" className="text-xs">GCash mobile number (required)</Typography.Text>
              <Input
                maxLength={13}
                inputMode="tel"
                autoComplete="tel"
                placeholder="09XXXXXXXXX"
                value={refundGcashNumber}
                onChange={(event) => setRefundGcashNumber(event.target.value)}
                className="mt-1.5 !rounded-xl"
              />
              {refundGcashNumber.trim().length > 0 && !isValidGcashNumber(refundGcashNumber) && (
                <p className="mt-1 text-xs text-red-600">Enter a valid Philippine mobile number.</p>
              )}
            </div>
          </div>
        )}
        <Upload
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          multiple
          maxCount={5}
          beforeUpload={(file) => {
            const next = [...evidence.files, file].slice(0, 5);
            evidence.setFiles(next);
            return false;
          }}
          onRemove={(file: UploadFile) => {
            evidence.setFiles(evidence.files.filter((item) => item.name !== file.name));
          }}
          fileList={evidence.files.map((file, index) => ({ uid: `${file.name}-${index}`, name: file.name, status: 'done' as const }))}
          className="mt-1 block"
        >
          <Button className="!rounded-lg" disabled={evidence.files.length >= 5}>Choose evidence</Button>
        </Upload>
        {evidence.error && <p className="mt-2 text-sm text-error">{evidence.error}</p>}
      </Modal>
    </div>
  );
}
