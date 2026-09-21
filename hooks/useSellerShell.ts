'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useConvexUserSync } from '@/hooks/useConvexUserSync';
import { toSessionUser, toStallProfile } from '@/lib/convexSync';
import {
  getNotificationsSnapshot,
  getEmptyNotificationsSnapshot,
  subscribeNotifications,
} from '@/lib/mockNotifications';
import { ensureSellerDemoData } from '@/lib/demoSeed';
import { notifyLowStockIfNeeded } from '@/lib/mockListings';

export function useSellerShell() {
  const { current, isReady, isAuthedWithConvex } = useConvexUserSync();
  const notifications = useSyncExternalStore(
    subscribeNotifications,
    getNotificationsSnapshot,
    getEmptyNotificationsSnapshot
  );

  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    ensureSellerDemoData();
    notifyLowStockIfNeeded();
  }, []);

  const user =
    isAuthedWithConvex && current ? toSessionUser(current.user, current.addresses, current.email) : null;
  const stall = current?.stall ? toStallProfile(current.stall) : null;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    isLoading: !isReady,
    error: null,
    user,
    stall,
    unreadCount,
    sellerTitle: stall?.stallName ?? user?.fullName ?? '',
  };
}