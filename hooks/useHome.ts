'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { MOCK_CATALOG } from '@/lib/mockCatalog';
import { getSessionUser } from '@/lib/mockSession';
import { APP_ROUTES } from '@/constants/routes';
import { ProductCategory } from '@/constants/categories';
import { SortOption } from '@/constants/sortOptions';
import { Product, Seller } from '@/types/product';
import { useCartContext } from '@/components/buyer/CartProvider';

export function useHome() {
  const router = useRouter();
  const { message } = App.useApp();
  const cart = useCartContext();

  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | ProductCategory>('all');
  const [sort, setSort] = useState<SortOption>('featured');
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);

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

  const nearYou: Product[] = useMemo(() => {
    return [...MOCK_CATALOG.products]
      .sort(
        (a, b) =>
          (sellerById.get(a.sellerId)?.distanceKm ?? Infinity) -
          (sellerById.get(b.sellerId)?.distanceKm ?? Infinity)
      )
      .slice(0, 4);
  }, [sellerById]);

  const user = getSessionUser();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user.fullName.trim().split(' ')[0] || user.fullName;

  const filterCount = (maxPrice != null ? 1 : 0) + (minRating != null ? 1 : 0);

  const handleQuickAdd = (productId: string) => {
    const product = MOCK_CATALOG.products.find((p) => p.id === productId);
    cart.addItem(productId, 1);
    message.success(`${product?.name ?? 'Product'} added to cart`);
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
    nearYou,
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
    handleQuickAdd,
    handleOpenProduct,
    handleApplyFilters,
    goToSearch: () => router.push(APP_ROUTES.search),
  };
}