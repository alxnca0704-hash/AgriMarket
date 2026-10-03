'use client';

import React from 'react';
import { Modal, Button } from 'antd';
import {
  EnvironmentOutlined,
  MobileOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { DeliveryAddress } from '@/types/auth';
import { formatAddressSummary, formatPrice } from '@/lib/format';

interface ConfirmOrderModalProps {
  open: boolean;
  isPlacing: boolean;
  address: DeliveryAddress;
  isDefault: boolean;
  total: number;
  itemCount: number;
  paymentMethod: 'cod' | 'gcash';
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmOrderModal({
  open,
  isPlacing,
  address,
  isDefault,
  total,
  itemCount,
  paymentMethod,
  onClose,
  onConfirm,
}: ConfirmOrderModalProps) {
  return (
    <Modal
      open={open}
      onCancel={isPlacing ? undefined : onClose}
      footer={null}
      width="min(92%, 460px)"
      centered
      title={
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-sage-soft text-sage flex items-center justify-center">
            <ShoppingOutlined />
          </span>
          <span className="text-base font-semibold text-stone-900">Confirm your order</span>
        </div>
      }
      styles={{ body: { paddingTop: 16 } }}
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-stone-50/80 p-4 space-y-3 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Delivering to
          </p>
          <div className="flex items-start gap-2.5">
            <MobileOutlined className="text-sage mt-0.5 shrink-0" />
            <p className="text-stone-700 text-sm">
              <strong className="font-semibold text-stone-900">{address.receiverName}</strong>
              <span className="text-stone-400"> · </span>
              {address.receiverPhone}
              {address.label && (
                <span className="ml-2 inline-block text-[10px] font-semibold uppercase tracking-wide text-sage bg-sage-soft px-1.5 py-0.5 rounded-full align-middle">
                  {address.label}
                </span>
              )}
              {isDefault && (
                <span className="ml-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-white bg-[#2D6A4F] px-1.5 py-0.5 rounded-full align-middle">
                  Default
                </span>
              )}
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <EnvironmentOutlined className="text-sage mt-0.5 shrink-0" />
            <p className="text-stone-600 text-sm leading-relaxed">
              {formatAddressSummary(address)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} · {paymentMethod === 'gcash' ? 'GCash via PayMongo' : 'Cash on Delivery'}
          </span>
          <span className="text-lg font-bold text-stone-900">{formatPrice(total)}</span>
        </div>

        <p className="text-xs text-stone-400 leading-relaxed -mt-1">
          {paymentMethod === 'gcash'
            ? `You will pay ${formatPrice(total)} online through GCash. Orders are paid separately per farm.`
            : `You will pay ${formatPrice(total)} to the courier in cash when it arrives. Orders ship separately per farm.`}
        </p>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
          <Button
            size="large"
            block
            disabled={isPlacing}
            onClick={onClose}
            className="!rounded-xl !h-12 !border-stone-200 hover:!border-sage hover:!text-sage"
          >
            Review again
          </Button>
          <Button
            type="primary"
            size="large"
            block
            loading={isPlacing}
            onClick={onConfirm}
            className="!rounded-xl !h-12 !font-semibold"
          >
            Confirm & place order
          </Button>
        </div>
      </div>
    </Modal>
  );
}
