'use client';

import React from 'react';
import { Button } from 'antd';
import { CheckCircleOutlined, ShoppingOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Order } from '@/types/order';
import { formatPrice } from '@/lib/format';

interface OrderSuccessProps {
  orders: Order[];
  onTrackOrders: () => void;
  onContinueShopping: () => void;
}

export function OrderSuccess({ orders, onTrackOrders, onContinueShopping }: OrderSuccessProps) {
  const totalPaid = orders.reduce((sum, o) => sum + o.total, 0);
  const totalItems = orders.reduce((sum, o) => sum + o.items.length, 0);

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-16 space-y-6">
      <div className="rounded-2xl bg-white shadow-sm p-6 sm:p-8 text-center">
        <span className="mx-auto w-14 h-14 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-2xl">
          <CheckCircleOutlined />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">
          {orders.some((order) => order.payment.method === 'gcash') ? 'Payment setup needs attention' : 'Order placed!'}
        </h1>
        <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">
          {orders.some((order) => order.payment.method === 'gcash')
            ? 'Your order is saved, but payment links could not all be prepared. Do not consider it paid until GCash confirms the payment.'
            : <>We&apos;ve sent your order to the farmers. Pay <strong className="text-stone-800">{formatPrice(totalPaid)}</strong> to the courier in cash when it arrives.</>}
        </p>

        <div className="mt-6 text-left space-y-2.5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-stone-50/80 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">{order.sellerName}</p>
                <p className="text-xs text-stone-400 font-mono">{order.id}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-sm font-semibold text-stone-800">{formatPrice(order.total)}</span>
                {order.payment.method === 'gcash' && order.payment.redirectUrl && (
                  <Button type="primary" size="small" href={order.payment.redirectUrl} target="_self" className="!rounded-lg">
                    Pay with GCash
                  </Button>
                )}
                {order.payment.method === 'gcash' && !order.payment.redirectUrl && (
                  <span className="text-xs text-amber-700">Payment setup failed — contact support before paying</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Button
            size="large"
            onClick={onContinueShopping}
            icon={<ShoppingOutlined />}
            className="!rounded-xl !h-12 !border-stone-200 hover:!border-sage hover:!text-sage"
          >
            Continue shopping
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={onTrackOrders}
            icon={<UnorderedListOutlined />}
            className="!rounded-xl !h-12 !font-semibold"
          >
            Track orders · {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Button>
        </div>
      </div>
    </div>
  );
}
