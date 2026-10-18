'use client';

import { useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { SellerNotification, SellerNotificationType } from '@/types/seller';
import {
  getNotificationsSnapshot,
  markNotificationRead as markMockRead,
  markAllNotificationsRead as markAllMockRead,
} from '@/lib/mockNotifications';

export function useSellerNotifications() {
  const convexNotifications = useQuery(api.notifications.listMyNotifications, {
    role: 'seller',
  });
  const unreadCountQuery = useQuery(api.notifications.getUnreadNotificationCount, {
    role: 'seller',
  });

  const markReadMutation = useMutation(api.notifications.markNotificationRead);
  const markAllReadMutation = useMutation(api.notifications.markAllNotificationsRead);

  const notifications: SellerNotification[] = useMemo(() => {
    if (convexNotifications !== undefined) {
      return convexNotifications.map((n) => ({
        id: n._id as string,
        type: n.type as SellerNotificationType,
        title: n.title,
        body: n.body,
        refId: n.orderId as string | undefined,
        orderId: n.orderId as string | undefined,
        read: n.read,
        createdAt: n.createdAt,
      }));
    }
    return getNotificationsSnapshot();
  }, [convexNotifications]);

  const unreadCount =
    typeof unreadCountQuery === 'number'
      ? unreadCountQuery
      : notifications.filter((n) => !n.read).length;

  const isLoading = convexNotifications === undefined;

  const handleRead = async (notification: SellerNotification) => {
    if (notification.read) return;
    if (convexNotifications !== undefined) {
      try {
        await markReadMutation({
          notificationId: notification.id as Id<'notifications'>,
        });
      } catch {
        // Ignore
      }
    } else {
      markMockRead(notification.id);
    }
  };

  const handleReadAll = async () => {
    if (convexNotifications !== undefined) {
      try {
        await markAllReadMutation({ role: 'seller' });
      } catch {
        // Ignore
      }
    } else {
      markAllMockRead();
    }
  };

  return {
    isLoading,
    error: null,
    notifications,
    unreadCount,
    handleRead,
    handleReadAll,
  };
}