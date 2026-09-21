'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { getSellerOrderStats } from '@/lib/mockOrders';
import { DEMO_SELLER_ID } from '@/lib/mockStall';
import {
  getListingsSnapshot,
  getEmptyListingsSnapshot,
  subscribeListings,
  getLowStockListings,
  getActiveListings,
} from '@/lib/mockListings';
import { toStallProfile } from '@/lib/convexSync';
import { useConvexUserSync } from '@/hooks/useConvexUserSync';

export function useSellerDashboard() {
  const { current, isReady } = useConvexUserSync();
  const listings = useSyncExternalStore(
    subscribeListings,
    getListingsSnapshot,
    getEmptyListingsSnapshot
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const stall = current?.stall ? toStallProfile(current.stall) : null;
  const stats = getSellerOrderStats(DEMO_SELLER_ID);
  const activeListings = getActiveListings();
  const lowStock = getLowStockListings();
  const outOfStockCount = listings.filter((l) => !l.isActive).length;

  return {
    isLoading: isLoading || !isReady,
    error: null,
    stall,
    stats,
    activeListings,
    lowStock,
    outOfStockCount,
    listingCount: listings.length,
  };
}