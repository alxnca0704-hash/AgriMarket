'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { MOCK_CATALOG } from '@/lib/mockCatalog';
import { searchCatalog } from '@/lib/search';
import {
  clearRecentSearches,
  getEmptyRecentSearchesSnapshot,
  getRecentSearchesSnapshot,
  saveRecentSearch,
  subscribeRecentSearches,
  TRENDING_SEARCHES,
} from '@/lib/mockSearch';
import { APP_ROUTES } from '@/constants/routes';
import { Seller } from '@/types/product';

export function useSearch() {
  const router = useRouter();
  const { message } = App.useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const recent = useSyncExternalStore(
    subscribeRecentSearches,
    getRecentSearchesSnapshot,
    getEmptyRecentSearchesSnapshot
  );

  const trending = useMemo(() => [...TRENDING_SEARCHES], []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const results = useMemo(() => searchCatalog(query), [query]);

  const sellerById = useMemo(() => {
    const map = new Map<string, Seller>();
    MOCK_CATALOG.sellers.forEach((s) => map.set(s.id, s));
    return map;
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const handleSubmit = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    saveRecentSearch(clean);
    setQuery(clean);
  };

  const handleSelectTerm = (term: string) => {
    handleSubmit(term);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    message.info('Recent searches cleared');
  };

  const handleOpenProduct = (productId: string) => {
    router.push(APP_ROUTES.productDetail(productId));
  };

  return {
    isLoading,
    error: null,
    query,
    results,
    sellers: sellerById,
    recent,
    trending,
    handleQueryChange,
    handleSubmit,
    handleSelectTerm,
    handleClearRecent,
    handleOpenProduct,
    clearSearch: () => setQuery(''),
  };
}