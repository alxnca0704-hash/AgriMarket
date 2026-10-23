'use client';

import { useEffect, useRef } from 'react';
import { useConvexUserSync } from '@/hooks/useConvexUserSync';
import { toSessionUser, toStallProfile } from '@/lib/convexSync';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { ensureSellerDemoData } from '@/lib/demoSeed';
import { notifyLowStockIfNeeded } from '@/lib/mockListings';
import { useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';

const commissionBadgeRef = makeFunctionReference<'query', Record<string, never>, number>('commissions:sellerUnpaidCount');

export function useSellerShell() {
  const { current, isReady, isAuthedWithConvex } = useConvexUserSync();
  const unreadCount = useUnreadNotifications('seller');
  const unpaidCommissionCount = useQuery(commissionBadgeRef, {});

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
    unpaidCommissionCount: unpaidCommissionCount ?? 0,
    sellerTitle: stall?.stallName ?? user?.fullName ?? '',
  };
}
