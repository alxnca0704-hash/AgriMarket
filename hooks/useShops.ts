'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { APP_ROUTES } from '@/constants/routes';
import { toBuyerSeller } from '@/lib/convexSync';
import { Seller } from '@/types/product';

export type ShopSort = 'featured' | 'rating' | 'products' | 'name';

interface EnrichedShop {
  seller: Seller;
  stallId: string;
  productCount: number;
}

export function useShops() {
  const router = useRouter();
  const rawStalls = useQuery(api.market.listStalls);
  const rawProducts = useQuery(api.market.listActiveProducts);

  const [query, setQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<ShopSort>('featured');

  const isLoading = rawStalls === undefined || rawProducts === undefined;
  const error =
    rawStalls instanceof Error
      ? rawStalls.message
      : rawProducts instanceof Error
        ? rawProducts.message
        : null;

  const sellersById = useMemo(() => {
    const map = new Map<string, Seller>();
    (Array.isArray(rawStalls) ? rawStalls : []).forEach(({ stall, ownerName }) => {
      map.set(stall._id, toBuyerSeller(stall, ownerName));
    });
    return map;
  }, [rawStalls]);

  const productCountByStallId = useMemo(() => {
    const map = new Map<string, number>();
    if (!Array.isArray(rawProducts)) return map;
    for (const p of rawProducts) {
      map.set(p.stallId, (map.get(p.stallId) ?? 0) + 1);
    }
    return map;
  }, [rawProducts]);

  const allShops: EnrichedShop[] = useMemo(() => {
    if (!Array.isArray(rawStalls)) return [];
    return rawStalls.map(({ stall }) => {
      const seller = sellersById.get(stall._id);
      // fallback should not happen because sellersById derived from same rawStalls
      const fallbackSeller: Seller = seller ?? {
        id: stall._id,
        name: stall.stallName,
        farmName: stall.stallName,
        location: [stall.location.cityMunicipality, stall.location.province].filter(Boolean).join(', '),
        region: stall.location.region,
        province: stall.location.province,
        rating: stall.rating,
        ratingCount: stall.ratingCount,
        verified: stall.verification.status === 'verified',
        distanceKm: 0,
        deliveryFeePeso: stall.deliveryFeePeso,
        avatarUrl: stall.photoUrl,
      };
      return {
        seller: fallbackSeller,
        stallId: stall._id,
        productCount: productCountByStallId.get(stall._id) ?? 0,
      };
    });
  }, [rawStalls, sellersById, productCountByStallId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = allShops.filter(({ seller }) => {
      if (verifiedOnly && !seller.verified) return false;
      if (!q) return true;
      const inName = seller.farmName.toLowerCase().includes(q);
      const inOwner = seller.name.toLowerCase().includes(q);
      const inLocation = seller.location.toLowerCase().includes(q);
      return inName || inOwner || inLocation;
    });

    const sorted = [...list];
    switch (sort) {
      case 'rating':
        sorted.sort((a, b) => b.seller.rating - a.seller.rating || b.seller.ratingCount - a.seller.ratingCount);
        break;
      case 'products':
        sorted.sort((a, b) => b.productCount - a.productCount);
        break;
      case 'name':
        sorted.sort((a, b) => a.seller.farmName.localeCompare(b.seller.farmName));
        break;
      default:
        break;
    }
    return sorted;
  }, [allShops, query, verifiedOnly, sort]);

  const handleOpenShop = (stallId: string) => {
    router.push(APP_ROUTES.shop(stallId));
  };

  const handleQueryChange = (value: string) => setQuery(value);
  const clearSearch = () => setQuery('');

  return {
    isLoading,
    error,
    shops: filtered,
    totalShops: allShops.length,
    query,
    verifiedOnly,
    setVerifiedOnly,
    sort,
    setSort,
    handleOpenShop,
    handleQueryChange,
    clearSearch,
  };
}

export type UseShopsReturn = ReturnType<typeof useShops>;
