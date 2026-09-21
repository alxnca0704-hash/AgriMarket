'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { SellerNotification } from '@/types/seller';
import {
  getNotificationsSnapshot,
  getEmptyNotificationsSnapshot,
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/mockNotifications';

export function useSellerNotifications() {
  const notifications = useSyncExternalStore(
    subscribeNotifications,
    getNotificationsSnapshot,
    getEmptyNotificationsSnapshot
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRead = (notification: SellerNotification) => {
    if (!notification.read) markNotificationRead(notification.id);
  };

  const handleReadAll = () => markAllNotificationsRead();

  return {
    isLoading,
    error: null,
    notifications,
    unreadCount,
    handleRead,
    handleReadAll,
  };
}