'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { StallProfile } from '@/types/seller';
import { toSellerListing, toStallProfile } from '@/lib/convexSync';
import { getSellerReviews, subscribeReviews } from '@/lib/mockReviews';
import { getActiveViewSnapshot, getBuyerViewSnapshot, subscribeActiveView } from '@/lib/mockSession';

export function usePublicStall(stallId: string) {
  const raw = useQuery(api.market.getPublicStall, { stallId: stallId as Id<'stalls'> });
  const reviews = useSyncExternalStore(subscribeReviews, getSellerReviews, () => getSellerReviews());
  const activeView = useSyncExternalStore(
    subscribeActiveView,
    getActiveViewSnapshot,
    getBuyerViewSnapshot
  );

  const stall: StallProfile = useMemo(() => {
    if (raw == null || raw instanceof Error) {
      return {
        stallName: 'Farm',
        description: '',
        photoUrl: '',
        farmType: '',
        location: {
          region: '',
          province: '',
          cityMunicipality: '',
          barangay: '',
          streetBuilding: '',
          postalCode: '',
        },
        deliveryFeePeso: 0,
        pickupAvailable: false,
        verification: { status: 'unverified', idType: '', idNumber: '' },
        rating: 0,
        ratingCount: 0,
        createdAt: '',
        updatedAt: '',
      };
    }
    return toStallProfile(raw.stall);
  }, [raw]);

  const activeListings = useMemo(
    () =>
      raw == null || raw instanceof Error
        ? []
        : raw.products.map((p) => toSellerListing(p)),
    [raw]
  );

  return {
    isLoading: raw === undefined,
    error: raw instanceof Error ? raw.message : null,
    notFound: raw === null,
    activeView,
    stall,
    activeListings,
    reviews,
  };
}