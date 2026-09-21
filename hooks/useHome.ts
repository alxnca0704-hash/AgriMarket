'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { saveRecentSearch } from '@/lib/mockSearch';
import { DEMO_BUYER, getSessionUserSnapshot, subscribeSessionUser } from '@/lib/mockSession';
import { toBuyerProduct, toBuyerSeller } from '@/lib/convexSync';
import { APP_ROUTES } from '@/constants/routes';
import { ProductCategory } from '@/constants/categories';
import { SortOption } from '@/constants/sortOptions';
import { Product, Seller } from '@/types/product';

export function useHome() {
  const router = useRouter();

  const rawStalls = useQuery(api.market.listStalls);
  const rawProducts = useQuery(api.market.listActiveProducts);

  const [activeCategory, setActiveCategory] = useState<'all' | ProductCategory>('all');
  const [sort, setSort] = useState<SortOption>('featured');
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const isLoading = rawStalls === undefined || rawProducts === undefined;

  const sellerById = useMemo(() => {
    const map = new Map<string, Seller>();
    (Array.isArray(rawStalls) ? rawStalls : []).forEach(({ stall, ownerName }) => {
      map.set(stall._id, toBuyerSeller(stall, ownerName));
    });
    return map;
  }, [rawStalls]);

  const stallById = useMemo(() => {
    const map = new Map<string, NonNullable<typeof rawStalls>[number]['stall']>();
    (Array.isArray(rawStalls) ? rawStalls : []).forEach(({ stall }) => map.set(stall._id, stall));
    return map;
  }, [rawStalls]);

  const allProducts = useMemo(() => {
    if (!Array.isArray(rawProducts)) return [];
    const products: Product[] = [];
    for (const raw of rawProducts) {
      const stall = stallById.get(raw.stallId);
      if (!stall) continue;
      products.push(toBuyerProduct(raw, stall));
    }
    return products;
  }, [rawProducts, stallById]);

  const error =
    rawStalls instanceof Error
      ? rawStalls.message
      : rawProducts instanceof Error
        ? rawProducts.message
        : null;

  const filtered = useMemo(() => {
    let list = allProducts.filter((p) =>
      activeCategory === 'all' ? true : p.category === activeCategory
    );

    if (maxPrice != null) list = list.filter((p) => p.price <= maxPrice);
    if (minRating != null) list = list.filter((p) => p.rating >= minRating);

    const sorted = [...list];
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'freshness':
        sorted.sort(
          (a, b) =>
            new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime()
        );
        break;
      default:
        break;
    }
    return sorted;
  }, [allProducts, activeCategory, sort, maxPrice, minRating]);

  const user = useSyncExternalStore(
    subscribeSessionUser,
    getSessionUserSnapshot,
    () => DEMO_BUYER
  );
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const hour = new Date().getHours();
      setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const firstName = user.fullName.trim().split(' ')[0] || user.fullName;

  const filterCount = (maxPrice != null ? 1 : 0) + (minRating != null ? 1 : 0);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allProducts.filter((p) => {
      const seller = sellerById.get(p.sellerId);
      const inName = p.name.toLowerCase().includes(q);
      const inFarm = seller ? seller.farmName.toLowerCase().includes(q) : false;
      const inCategory = p.category.toLowerCase().includes(q);
      return inName || inFarm || inCategory;
    });
  }, [query, allProducts, sellerById]);

  const isSearching = searchResults.length > 0 || query.trim().length > 0;

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const handleSubmitSearch = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    saveRecentSearch(clean);
    setQuery(clean);
  };

  const clearSearch = () => {
    setQuery('');
  };

  const handleOpenProduct = (productId: string) => {
    router.push(APP_ROUTES.productDetail(productId));
  };

  const handleApplyFilters = (price: number | null, rating: number | null) => {
    setMaxPrice(price);
    setMinRating(rating);
    setFilterOpen(false);
  };

  return {
    isLoading,
    error,
    greeting,
    firstName,
    deliveryAddress: user.defaultAddressSummary,
    products: filtered,
    sellers: sellerById,
    activeCategory,
    setActiveCategory,
    sort,
    setSort,
    filterOpen,
    setFilterOpen,
    maxPrice,
    minRating,
    setMaxPrice,
    setMinRating,
    filterCount,
    handleOpenProduct,
    handleApplyFilters,
    query,
    searchResults,
    isSearching,
    handleQueryChange,
    handleSubmitSearch,
    clearSearch,
  };
}