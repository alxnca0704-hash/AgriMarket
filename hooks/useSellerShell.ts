'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AuthenticatedUser } from '@/types/auth';
import {
  DEMO_BUYER,
  getSessionUserSnapshot,
  subscribeSessionUser,
  getActiveViewSnapshot,
  getBuyerViewSnapshot,
  subscribeActiveView,
  setActiveView,
} from '@/lib/mockSession';
import { getStallSnapshot, subscribeStall } from '@/lib/mockStall';
import {
  getNotificationsSnapshot,
  getEmptyNotificationsSnapshot,
  subscribeNotifications,
} from '@/lib/mockNotifications';
import { ensureSellerDemoData } from '@/lib/demoSeed';
import { notifyLowStockIfNeeded } from '@/lib/mockListings';

export function useSellerShell() {
  const user = useSyncExternalStore(
    subscribeSessionUser,
    getSessionUserSnapshot,
    () => DEMO_BUYER
  );
  const stall = useSyncExternalStore(
    subscribeStall,
    getStallSnapshot,
    () => getStallSnapshot()
  );
  const activeView = useSyncExternalStore(
    subscribeActiveView,
    getActiveViewSnapshot,
    getBuyerViewSnapshot
  );
  const notifications = useSyncExternalStore(
    subscribeNotifications,
    getNotificationsSnapshot,
    getEmptyNotificationsSnapshot
  );

  const [isLoading, setIsLoading] = useState(true);
  const seeded = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    ensureSellerDemoData();
    notifyLowStockIfNeeded();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    isLoading,
    error: null,
    user: user as AuthenticatedUser,
    stall,
    activeView,
    unreadCount,
    setActiveView,
    sellerTitle: stall.stallName,
  };
}