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
import { getStallSnapshot, subscribeStall } from '@/lib/mockStall';

export function useSellerDashboard() {
  const listings = useSyncExternalStore(
    subscribeListings,
    getListingsSnapshot,
    getEmptyListingsSnapshot
  );
  const stall = useSyncExternalStore(subscribeStall, getStallSnapshot, () => getStallSnapshot());

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const stats = getSellerOrderStats(DEMO_SELLER_ID);
  const activeListings = getActiveListings();
  const lowStock = getLowStockListings();
  const outOfStockCount = listings.filter((l) => !l.isActive).length;

  return {
    isLoading,
    error: null,
    stall,
    stats,
    activeListings,
    lowStock,
    outOfStockCount,
    listingCount: listings.length,
  };
}