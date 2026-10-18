'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Empty, Skeleton } from 'antd';
import {
  BellOutlined,
  CarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DollarOutlined,
  MessageOutlined,
  RedoOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useSellerNotifications } from '@/hooks/useSellerNotifications';
import { SellerNotification } from '@/types/seller';
import { APP_ROUTES } from '@/constants/routes';

function NotificationsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-4">
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
      {[0, 1, 2].map((i) => (
        <Skeleton.Button key={i} active block className="!h-24 !rounded-2xl" />
      ))}
    </div>
  );
}

function iconFor(type: string) {
  switch (type) {
    case 'new-order':
    case 'order_placed':
      return <ShoppingOutlined />;
    case 'order-cancelled':
    case 'order_cancelled':
      return <CloseCircleFilled className="!text-red-400" />;
    case 'low-stock':
      return <BellOutlined className="!text-amber-500" />;
    case 'new-review':
      return <MessageOutlined />;
    case 'order-shipped':
    case 'order_dispatched':
      return <CarOutlined />;
    case 'order_confirmed':
    case 'order_completed':
      return <CheckCircleFilled className="!text-green-500" />;
    case 'refund_requested':
    case 'return_approved':
    case 'return_in_transit':
    case 'return_received':
    case 'refunded':
    case 'refund_rejected':
      return <RedoOutlined className="!text-amber-500" />;
    case 'payment_approved':
    case 'payment_rejected':
      return <DollarOutlined />;
    default:
      return <BellOutlined />;
  }
}

function orderRouteFor(type: string, orderId?: string): string | null {
  if (!orderId) return null;
  const orderTypes = [
    'new-order', 'order_placed', 'order_confirmed', 'order_dispatched',
    'order_completed', 'order-cancelled', 'order_cancelled',
    'refund_requested', 'return_approved', 'return_in_transit', 'return_received',
    'refunded', 'refund_rejected', 'payment_approved', 'payment_rejected',
  ];
  if (orderTypes.includes(type)) {
    return APP_ROUTES.sellerOrderDetail(orderId);
  }
  return null;
}

export function NotificationsView() {
  const router = useRouter();
  const { isLoading, error, notifications, unreadCount, handleRead, handleReadAll } =
    useSellerNotifications();

  if (isLoading) return <NotificationsSkeleton />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Inbox</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            Notifications
          </h1>
        </div>
        {unreadCount > 0 && (
          <Button size="small" onClick={() => void handleReadAll()} className="!rounded-lg">
            Mark all read
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} showIcon />}

      {notifications.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm py-14">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span className="text-stone-500">No notifications yet.</span>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: SellerNotification) => {
            const isUnread = !n.read;
            const destination = orderRouteFor(n.type as string, n.orderId ?? n.refId);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  void handleRead(n);
                  if (destination) {
                    router.push(destination);
                  }
                }}
                className={`w-full text-left rounded-2xl shadow-sm p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer transition-shadow hover:shadow-md ${
                  isUnread ? 'bg-white' : 'bg-white/60'
                }`}
              >
                <span
                  className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-base ${
                    isUnread ? 'bg-sage-soft text-sage' : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {iconFor(n.type as string)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-sm ${isUnread ? 'font-semibold text-stone-900' : 'font-medium text-stone-600'}`}
                    >
                      {n.title}
                    </p>
                    {isUnread && <CheckCircleFilled className="text-sage shrink-0" />}
                  </div>
                  <p className="text-sm text-stone-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-xs text-stone-400 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}