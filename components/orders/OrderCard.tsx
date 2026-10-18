'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Image } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { Order } from '@/types/order';
import { OrderAction } from '@/constants/orders';
import { OrderActions } from '@/components/orders/OrderActions';
import { OrderProgress } from '@/components/orders/OrderProgress';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { APP_ROUTES } from '@/constants/routes';
import { formatOrderTime, formatPrice } from '@/lib/format';

interface OrderCardProps {
  order: Order;
  isActionPending: (action: OrderAction, orderId: string) => boolean;
  onConfirmDelivery: () => void | Promise<unknown>;
  onCancel: (reason: string) => void | Promise<unknown>;
  onRequestRefund?: (reason: string, evidenceUrls: string[]) => void | Promise<unknown>;
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

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm transition-shadow sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push(APP_ROUTES.orderDetail(order.id))}
          className="group flex min-h-11 min-w-0 cursor-pointer items-center gap-2 text-left"
        >
          <span className="truncate text-lg font-semibold tracking-tight text-stone-900 transition-colors group-hover:text-sage">
            {order.sellerName}
          </span>
          <RightOutlined className="text-[10px] text-stone-300" />
        </button>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <OrderStatusBadge status={order.status} />
          {order.payment.method === 'gcash' && (
            <span className={`text-[11px] font-medium ${order.payment.status === 'paid' ? 'text-sage' : order.payment.status === 'rejected' ? 'text-error' : 'text-amber-700'}`}>
              {order.payment.status === 'paid' ? 'GCash paid' : order.payment.status === 'rejected' ? 'Proof rejected' : 'Pending verification'}
            </span>
          )}
        </span>
      </div>

      <p className="text-xs text-stone-400">Order <span className="font-mono text-stone-500">{order.id}</span> <span aria-hidden="true">·</span> {formatOrderTime(order.placedAt)}</p>

      <div className="my-4 flex items-center gap-3 rounded-xl bg-stone-50/80 p-3 sm:p-4">
        <div className="flex shrink-0 items-center gap-1.5">
          {preview.slice(0, 2).map((line) => (
            <Image key={line.productId} src={line.imageUrl} alt={line.name} preview={false} className="!h-12 !w-12 shrink-0 rounded-lg object-cover sm:!h-14 sm:!w-14" />
          ))}
          {order.items.length > 2 && <span className="flex h-12 w-10 items-center justify-center rounded-lg bg-white text-xs font-semibold text-stone-500 sm:h-14">+{order.items.length - 2}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800">{preview[0]?.name}</p>
          <p className="mt-1 text-xs text-stone-500">
            {order.items.reduce((sum, item) => sum + item.qty, 0)} {order.items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">Total</p>
          <p className="mt-0.5 text-base font-semibold tabular-nums text-stone-900">{formatPrice(order.total)}</p>
        </div>
      </div>

      <OrderProgress order={order} audience="buyer" compact />

      <div className="mt-4 flex flex-col-reverse items-stretch justify-between gap-2 sm:flex-row sm:items-center">
        <Button
          type="link"
          onClick={() => router.push(APP_ROUTES.orderDetail(order.id))}
          className="!h-11 !px-0 !text-sm !font-medium !text-sage hover:!text-sage"
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
    </article>
  );
}
