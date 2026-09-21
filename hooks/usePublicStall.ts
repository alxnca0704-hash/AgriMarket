'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { StallProfile } from '@/types/seller';
import { getStallSnapshot, subscribeStall } from '@/lib/mockStall';
import { getListingsSnapshot, subscribeListings } from '@/lib/mockListings';
import { getSellerReviews, subscribeReviews } from '@/lib/mockReviews';
import { getActiveViewSnapshot, getBuyerViewSnapshot, subscribeActiveView } from '@/lib/mockSession';

export function usePublicStall() {
  const stall = useSyncExternalStore(
    subscribeStall,
    getStallSnapshot,
    () => getStallSnapshot()
  ) as StallProfile;
  const listings = useSyncExternalStore(
    subscribeListings,
    getListingsSnapshot,
    () => getListingsSnapshot()
  );
  const reviews = useSyncExternalStore(subscribeReviews, getSellerReviews, () => getSellerReviews());
  const activeView = useSyncExternalStore(
    subscribeActiveView,
    getActiveViewSnapshot,
    getBuyerViewSnapshot
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  return {
    isLoading,
    error: null,
    activeView,
    stall,
    activeListings: listings.filter((l) => l.isActive),
    reviews,
  };
}