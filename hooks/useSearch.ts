'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { MOCK_CATALOG } from '@/lib/mockCatalog';
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  TRENDING_SEARCHES,
} from '@/lib/mockSearch';
import { APP_ROUTES } from '@/constants/routes';
import { Product, Seller } from '@/types/product';
import { useCartContext } from '@/components/buyer/CartProvider';

function searchCatalog(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_CATALOG.products.filter((product) => {
    const seller = MOCK_CATALOG.sellers.find((s) => s.id === product.sellerId);
    const haystack = [
      product.name,
      product.category,
      product.origin,
      product.tags.join(' '),
      seller?.farmName ?? '',
      seller?.location ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function useSearch() {
  const router = useRouter();
  const { message } = App.useApp();
  const cart = useCartContext();

  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>(() =>
    typeof window === 'undefined' ? [] : getRecentSearches()
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
    setRecent(getRecentSearches());
    setQuery(clean);
  };

  const handleSelectTerm = (term: string) => {
    handleSubmit(term);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecent([]);
    message.info('Recent searches cleared');
  };

  const handleQuickAdd = (productId: string) => {
    const product = MOCK_CATALOG.products.find((p) => p.id === productId);
    cart.addItem(productId, 1);
    message.success(`${product?.name ?? 'Product'} added to cart`);
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
    handleQuickAdd,
    handleOpenProduct,
    clearSearch: () => setQuery(''),
  };
}