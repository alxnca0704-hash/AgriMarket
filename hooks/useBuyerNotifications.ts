'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { AppNotification, NotificationFilterTab } from '@/types/notification';
import { toAppNotification } from '@/lib/convexSync';

export interface UseBuyerNotificationsResult {
  notifications: AppNotification[];
  filteredNotifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  activeTab: NotificationFilterTab;
  setActiveTab: (tab: NotificationFilterTab) => void;
  handleRead: (notification: AppNotification) => Promise<void>;
  handleReadAll: () => Promise<void>;
}

export function useBuyerNotifications(): UseBuyerNotificationsResult {
  const [activeTab, setActiveTab] = useState<NotificationFilterTab>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  const rawNotifications = useQuery(api.notifications.listMyNotifications, {
    role: 'buyer',
  });
  const unreadCountQuery = useQuery(api.notifications.getUnreadNotificationCount, {
    role: 'buyer',
  });

  const markReadMutation = useMutation(api.notifications.markNotificationRead);
  const markAllReadMutation = useMutation(api.notifications.markAllNotificationsRead);

  const isLoading = rawNotifications === undefined;

  const notifications = useMemo(() => {
    if (!rawNotifications) return [];
    return rawNotifications.map(toAppNotification);
  }, [rawNotifications]);

  const unreadCount =
    typeof unreadCountQuery === 'number'
      ? unreadCountQuery
      : notifications.filter((n) => !n.read).length;

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'orders':
        return notifications.filter(
          (n) =>
            n.type === 'order_placed' ||
            n.type === 'order_confirmed' ||
            n.type === 'order_dispatched' ||
            n.type === 'order_delivered' ||
            n.type === 'order_completed' ||
            n.type === 'order_cancelled' ||
            n.type === 'payment_approved' ||
            n.type === 'payment_rejected'
        );
      case 'returns':
        return notifications.filter(
          (n) =>
            n.type === 'refund_requested' ||
            n.type === 'return_approved' ||
            n.type === 'return_in_transit' ||
            n.type === 'return_received' ||
            n.type === 'refunded' ||
            n.type === 'refund_rejected'
        );
      case 'all':
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  const handleRead = async (notification: AppNotification) => {
    if (notification.read) return;
    try {
      setActionError(null);
      await markReadMutation({
        notificationId: notification.id as Id<'notifications'>,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update notification');
    }
  };

  const handleReadAll = async () => {
    try {
      setActionError(null);
      await markAllReadMutation({ role: 'buyer' });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  };

  return {
    notifications,
    filteredNotifications,
    unreadCount,
    isLoading,
    error: actionError,
    activeTab,
    setActiveTab,
    handleRead,
    handleReadAll,
  };
}
