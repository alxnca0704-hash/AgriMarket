'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Image, Tag } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { Order } from '@/types/order';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TAG_COLORS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TAG_COLORS, OrderAction } from '@/constants/orders';
import { OrderActions } from '@/components/orders/OrderActions';
import { APP_ROUTES } from '@/constants/routes';
import { formatOrderTime, formatPrice } from '@/lib/format';

interface OrderCardProps {
  order: Order;
  isActionPending: (action: OrderAction, orderId: string) => boolean;
  onConfirmDelivery: () => void | Promise<unknown>;
  onCancel: (reason: string) => void | Promise<unknown>;
  onRequestRefund?: (reason: string) => void | Promise<unknown>;
}

export function OrderCard({
  order,
  isActionPending,
  onConfirmDelivery,
  onCancel,
  onRequestRefund,
}: OrderCardProps) {
  const router = useRouter();
  const preview = order.items.slice(0, 3);
  const moreCount = order.items.length - preview.length;

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-3 border-b border-stone-100">
        <button
          type="button"
          onClick={() => router.push(APP_ROUTES.orderDetail(order.id))}
          className="min-w-0 text-left cursor-pointer group flex items-center gap-1.5"
        >
          <span className="text-sm font-semibold text-stone-900 truncate group-hover:text-[#2D6A4F] transition-colors">
            {order.sellerName}
          </span>
          <RightOutlined className="text-[10px] text-stone-300" />
        </button>
        <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
          <Tag
            color={ORDER_STATUS_TAG_COLORS[order.status]}
            className="!m-0 !border-none !rounded-full !px-2.5 !py-0.5 !text-xs !font-semibold"
          >
            {ORDER_STATUS_LABELS[order.status]}
          </Tag>
          <Tag
            color={order.status === 'refunded' ? 'default' : PAYMENT_STATUS_TAG_COLORS[order.payment.status]}
            className="!m-0 !border-none !rounded-full !px-2.5 !py-0.5 !text-xs !font-semibold"
          >
            {order.status === 'refunded' ? 'Refunded' : PAYMENT_STATUS_LABELS[order.payment.status]}
          </Tag>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {preview.map((line) => (
            <Image
              key={line.productId}
              src={line.imageUrl}
              alt={line.name}
              preview={false}
              className="!w-12 !h-12 sm:!w-14 sm:!h-14 rounded-xl object-cover shrink-0"
            />
          ))}
          {moreCount > 0 && (
            <span className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-stone-50 text-xs font-semibold text-stone-500 shrink-0">
              +{moreCount}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-sm text-stone-500">
            {order.items.reduce((sum, i) => sum + i.qty, 0)}{' '}
            {order.items.length === 1 ? 'item' : 'items'}
          </p>
          <p className="text-base font-bold text-stone-900">{formatPrice(order.total)}</p>
          <p className="text-xs text-stone-400 mt-0.5">Placed {formatOrderTime(order.placedAt)}</p>
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button
          type="link"
          onClick={() => router.push(APP_ROUTES.orderDetail(order.id))}
          className="!px-0 !h-auto !text-sm !font-medium !text-[#2D6A4F] hover:!text-[#1B4332]"
        >
          View details
        </Button>
        {order.status === 'pending' || order.status === 'to-receive' || order.status === 'delivered' ? (
          <div className="w-full sm:w-auto">
            <OrderActions
              order={order}
              variant="card"
              isActionPending={isActionPending}
              onConfirmDelivery={onConfirmDelivery}
              onCancel={onCancel}
              onRequestRefund={onRequestRefund}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
