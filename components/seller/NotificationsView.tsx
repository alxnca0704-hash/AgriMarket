'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Empty, Skeleton } from 'antd';
import {
  BellOutlined,
  CarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  MessageOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useSellerNotifications } from '@/hooks/useSellerNotifications';
import { SellerNotificationType } from '@/types/seller';
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

function iconFor(type: SellerNotificationType) {
  switch (type) {
    case 'new-order':
      return <ShoppingOutlined />;
    case 'order-cancelled':
      return <CloseCircleFilled className="!text-red-400" />;
    case 'low-stock':
      return <BellOutlined className="!text-amber-500" />;
    case 'new-review':
      return <MessageOutlined />;
    case 'order-shipped':
      return <CarOutlined />;
    default:
      return <BellOutlined />;
  }
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
          <Button size="small" onClick={handleReadAll} className="!rounded-lg">
            Mark all read
          </Button>
        )}
      </div>

      {error && <Alert type="error" title={error} showIcon />}

      {notifications.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm py-14">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span className="text-stone-500">No notifications yet.</span>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUnread = !n.read;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  handleRead(n);
                  if (n.type === 'new-order' && n.refId) {
                    router.push(APP_ROUTES.sellerOrderDetail(n.refId));
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
                  {iconFor(n.type)}
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