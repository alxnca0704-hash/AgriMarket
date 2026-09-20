'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_CATALOG } from '@/lib/mockCatalog';
import { searchCatalog } from '@/lib/search';
import { saveRecentSearch } from '@/lib/mockSearch';
import { DEMO_BUYER, getSessionUserSnapshot, subscribeSessionUser } from '@/lib/mockSession';
import { APP_ROUTES } from '@/constants/routes';
import { ProductCategory } from '@/constants/categories';
import { SortOption } from '@/constants/sortOptions';
import { Seller } from '@/types/product';

export function useHome() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | ProductCategory>('all');
  const [sort, setSort] = useState<SortOption>('featured');
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  const sellers = MOCK_CATALOG.sellers;

  const sellerById = useMemo(() => {
    const map = new Map<string, Seller>();
    sellers.forEach((s) => map.set(s.id, s));
    return map;
  }, [sellers]);

  const filtered = useMemo(() => {
    let list = MOCK_CATALOG.products.filter((p) =>
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
  }, [activeCategory, sort, maxPrice, minRating]);

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

  const searchResults = useMemo(() => searchCatalog(query), [query]);
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
    error: null,
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