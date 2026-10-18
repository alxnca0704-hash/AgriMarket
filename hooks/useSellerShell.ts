'use client';

import { useEffect, useRef } from 'react';
import { useConvexUserSync } from '@/hooks/useConvexUserSync';
import { toSessionUser, toStallProfile } from '@/lib/convexSync';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { ensureSellerDemoData } from '@/lib/demoSeed';
import { notifyLowStockIfNeeded } from '@/lib/mockListings';

export function useSellerShell() {
  const { current, isReady, isAuthedWithConvex } = useConvexUserSync();
  const unreadCount = useUnreadNotifications('seller');

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

  return {
    isLoading: !isReady,
    error: null,
    user,
    stall,
    unreadCount,
    sellerTitle: stall?.stallName ?? user?.fullName ?? '',
  };
}