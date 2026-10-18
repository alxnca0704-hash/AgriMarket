'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Empty, Segmented, Skeleton, Badge } from 'antd';
import {
  BellOutlined,
  CarOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DollarOutlined,
  RedoOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useBuyerNotifications } from '@/hooks/useBuyerNotifications';
import { AppNotification, NotificationFilterTab, NotificationType } from '@/types/notification';
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

function iconFor(type: NotificationType) {
  switch (type) {
    case 'order_placed':
      return <ShoppingOutlined />;
    case 'order_confirmed':
      return <CheckCircleFilled className="!text-green-500" />;
    case 'order_dispatched':
      return <CarOutlined className="!text-blue-500" />;
    case 'order_completed':
      return <CheckCircleFilled className="!text-green-600" />;
    case 'order_cancelled':
      return <CloseCircleFilled className="!text-red-400" />;
    case 'payment_approved':
      return <DollarOutlined className="!text-green-500" />;
    case 'payment_rejected':
      return <DollarOutlined className="!text-red-400" />;
    case 'refund_requested':
    case 'return_approved':
    case 'return_in_transit':
    case 'return_received':
    case 'refunded':
      return <RedoOutlined className="!text-amber-500" />;
    case 'refund_rejected':
      return <CloseCircleFilled className="!text-red-400" />;
    default:
      return <BellOutlined />;
  }
}

function orderRouteFor(type: NotificationType, orderId?: string): string | null {
  if (!orderId) return null;
  const orderTypes: NotificationType[] = [
    'order_placed', 'order_confirmed', 'order_dispatched', 'order_completed',
    'order_cancelled', 'refund_requested', 'return_approved', 'return_in_transit',
    'return_received', 'refunded', 'refund_rejected', 'payment_approved', 'payment_rejected',
  ];
  if (orderTypes.includes(type)) {
    return APP_ROUTES.orderDetail(orderId);
  }
  return null;
}

const TABS: Array<{ label: string; value: NotificationFilterTab }> = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Orders', value: 'orders' },
  { label: 'Returns', value: 'returns' },
];

export interface BuyerNotificationsViewProps {
  /** Optional pre-selected tab */
  defaultTab?: NotificationFilterTab;
}

export function BuyerNotificationsView({ defaultTab }: BuyerNotificationsViewProps) {
  const router = useRouter();
  const {
    filteredNotifications,
    unreadCount,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    handleRead,
    handleReadAll,
  } = useBuyerNotifications();

  const handleNotificationClick = (n: AppNotification) => {
    void handleRead(n);
    const destination = orderRouteFor(n.type, n.orderId);
    if (destination) router.push(destination);
  };

  if (isLoading) return <NotificationsSkeleton />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Inbox</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            Notifications
          </h1>
        </div>
        {unreadCount > 0 && (
          <Badge count={unreadCount} overflowCount={99} color="#2D6A4F">
            <Button size="small" onClick={() => void handleReadAll()} className="!rounded-lg">
              Mark all read
            </Button>
          </Badge>
        )}
      </div>

      {/* Filter tabs */}
      <Segmented
        value={activeTab ?? defaultTab ?? 'all'}
        onChange={(val) => setActiveTab(val as NotificationFilterTab)}
        options={TABS.map(({ label, value }) => ({
          label: value === 'unread' && unreadCount > 0
            ? `${label} (${unreadCount})`
            : label,
          value,
        }))}
        className="!bg-stone-100"
      />

      {error && <Alert type="error" message={error} showIcon />}

      {filteredNotifications.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm py-14">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-stone-500">
                {activeTab === 'unread'
                  ? 'You\'re all caught up!'
                  : activeTab === 'orders'
                  ? 'No order notifications yet.'
                  : activeTab === 'returns'
                  ? 'No return notifications yet.'
                  : 'No notifications yet.'}
              </span>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const isUnread = !n.read;
            const clickable = !!orderRouteFor(n.type, n.orderId);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left rounded-2xl shadow-sm p-4 sm:p-5 flex items-start gap-3.5 transition-shadow hover:shadow-md ${
                  clickable ? 'cursor-pointer' : 'cursor-default'
                } ${isUnread ? 'bg-white' : 'bg-white/60'}`}
              >
                <span
                  className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-base ${
                    isUnread ? 'bg-[#E9F0EB] text-[#2D6A4F]' : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {iconFor(n.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-sm ${
                        isUnread ? 'font-semibold text-stone-900' : 'font-medium text-stone-600'
                      }`}
                    >
                      {n.title}
                    </p>
                    {isUnread && (
                      <span className="w-2 h-2 shrink-0 rounded-full bg-[#2D6A4F]" />
                    )}
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
