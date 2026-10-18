'use client';

import React from 'react';
import Image from 'next/image';
import { Alert, Button, Input, Radio, Skeleton } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { formatPrice } from '@/lib/format';
import { PaymentMethod } from '@/types/order';

interface PaymentMethodCardProps {
  total: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  gcashSettings: { qrUrl: string; number: string } | null | undefined;
  paymentReference: string;
  onPaymentReferenceChange: (value: string) => void;
  onCopyNumber: () => void;
  paymentNote: string;
  onCopyPaymentNote: () => void;
}

export function PaymentMethodCard({
  total,
  paymentMethod,
  onPaymentMethodChange,
  gcashSettings,
  paymentReference,
  onPaymentReferenceChange,
  onCopyNumber,
  paymentNote,
  onCopyPaymentNote,
}: PaymentMethodCardProps) {
  return (
    <section className="rounded-2xl bg-white shadow-sm p-4 sm:p-6 space-y-4">
      <h2 className="text-sm font-semibold text-stone-900">Payment method</h2>
      <Radio.Group
        value={paymentMethod}
        onChange={(event) => onPaymentMethodChange(event.target.value as PaymentMethod)}
        className="flex flex-col gap-3"
      >
        <Radio value="cod">Cash on Delivery</Radio>
        <Radio value="gcash">GCash</Radio>
      </Radio.Group>
      {paymentMethod === 'cod' ? (
        <p className="rounded-xl bg-stone-50 p-4 text-xs text-stone-500">
          Pay {formatPrice(total)} in cash to the courier when your order arrives.
        </p>
      ) : (
        <div className="space-y-4 rounded-xl bg-stone-50 p-4">
          {gcashSettings === undefined ? <Skeleton active paragraph={{ rows: 2 }} /> : gcashSettings === null ? (
            <Alert type="warning" showIcon message="GCash payments are not configured yet." />
          ) : (
            <>
              <div className="flex flex-col items-start gap-3 sm:flex-row">
                <Image src={gcashSettings.qrUrl} alt="GCash payment QR code" width={140} height={245} unoptimized className="h-auto w-32 rounded-lg bg-white" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-stone-800">Pay {formatPrice(total)} using GCash</p>
                  <p className="text-sm text-stone-600">{gcashSettings.number}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button icon={<CopyOutlined />} onClick={onCopyNumber}>Copy number</Button>
                    <a href={gcashSettings.qrUrl} download target="_blank" rel="noreferrer">
                      <Button icon={<DownloadOutlined />}>Download QR</Button>
                    </a>
                  </div>
                  <p className="text-xs text-stone-500">Payment note: <span className="font-mono text-stone-700">{paymentNote}</span></p>
                  <Button size="small" onClick={onCopyPaymentNote}>Copy payment note</Button>
                </div>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-stone-600">GCash reference number</span>
                <Input value={paymentReference} onChange={(event) => onPaymentReferenceChange(event.target.value)} placeholder="Enter the reference number" />
              </label>
              <p className="text-xs text-stone-500">Enter the reference number from your GCash transaction. Your payment will show as awaiting verification after order placement.</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
