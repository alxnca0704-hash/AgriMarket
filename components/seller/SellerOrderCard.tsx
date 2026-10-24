'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Image } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { Order } from '@/types/order';
import { getSellerOrderGroup } from '@/constants/sellerOrders';
import { OrderAction } from '@/constants/orders';
import { SellerOrderActions } from '@/components/seller/SellerOrderActions';
import { OrderProgress } from '@/components/orders/OrderProgress';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { APP_ROUTES } from '@/constants/routes';
import { formatOrderTime, formatPrice } from '@/lib/format';

interface SellerOrderCardProps {
  order: Order;
  isActionPending: (action: OrderAction, orderId: string) => boolean;
  onConfirm: () => void | Promise<unknown>;
  onReject: (reason: string) => void | Promise<unknown>;
  onDispatch: (courier: string, trackingNumber: string) => void | Promise<unknown>;
  onComplete: () => void | Promise<unknown>;
  onConfirmReturnReceived: () => void | Promise<unknown>;
}

export function SellerOrderCard({
  order,
  isActionPending,
  onConfirm,
  onReject,
  onDispatch,
  onComplete,
  onConfirmReturnReceived,
}: SellerOrderCardProps) {
  const router = useRouter();
  const preview = order.items.slice(0, 3);
  const moreCount = Math.max(0, order.items.length - 2);
  const group = getSellerOrderGroup(order);

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push(APP_ROUTES.sellerOrderDetail(order.id))}
          className="group flex min-h-11 min-w-0 cursor-pointer items-center gap-2 text-left"
        >
          <span className="truncate text-lg font-semibold tracking-tight text-stone-900">
            {order.address.receiverName}
          </span>
          <RightOutlined className="text-[10px] text-stone-300" />
        </button>
        <OrderStatusBadge status={group} />
      </div>

      <p className="text-xs text-stone-400">Order <span className="font-mono text-stone-500">{order.id}</span> <span aria-hidden="true">·</span> {formatOrderTime(order.placedAt)}</p>

      <div className="my-4 flex items-center gap-3 rounded-xl bg-stone-50/80 p-3 sm:p-4">
        <div className="flex shrink-0 items-center gap-1.5">
          {preview.slice(0, 2).map((line) => (
            <Image key={line.productId} src={line.imageUrl} alt={line.name} preview={false} className="!h-12 !w-12 shrink-0 rounded-lg object-cover sm:!h-14 sm:!w-14" />
          ))}
          {moreCount > 0 && <span className="flex h-12 w-10 items-center justify-center rounded-lg bg-white text-xs font-semibold text-stone-500 sm:h-14">+{moreCount}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800">{preview[0]?.name}</p>
          <p className="mt-1 text-xs text-stone-500">{order.items.reduce((sum, item) => sum + item.qty, 0)} {order.items.length === 1 ? 'item' : 'items'}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">Order total</p>
          <p className="mt-0.5 text-base font-semibold tabular-nums text-stone-900">{formatPrice(order.total)}</p>
        </div>
      </div>

      <OrderProgress order={order} audience="seller" compact />

      <div className="mt-4 flex flex-col-reverse items-stretch justify-between gap-2 sm:flex-row sm:items-center">
        <Button
          type="link"
          onClick={() => router.push(APP_ROUTES.sellerOrderDetail(order.id))}
          className="!h-11 !px-0 !text-sm !font-medium !text-sage hover:!text-sage"
        >
          View details
        </Button>
        <div className="w-full sm:w-auto">
          <SellerOrderActions
            order={order}
            variant="card"
            isActionPending={isActionPending}
            onConfirm={onConfirm}
            onReject={onReject}
            onDispatch={onDispatch}
            onComplete={onComplete}
            onConfirmReturnReceived={onConfirmReturnReceived}
          />
        </div>
      </div>
    </article>
  );
}
