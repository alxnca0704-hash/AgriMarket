'use client';

import { useMemo, useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ProductCategory } from '@/constants/categories';
import { SellerListing } from '@/types/seller';
import { toSellerListing, toStallProfile } from '@/lib/convexSync';
import { useConvexUserSync } from '@/hooks/useConvexUserSync';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export function useSellerProducts() {
  const { message, modal } = App.useApp();
  const { current, isReady } = useConvexUserSync();
  const rawProducts = useQuery(api.products.listMyProducts);
  const setProductsOutOfStock = useMutation(api.products.setProductsOutOfStock);
  const deleteProducts = useMutation(api.products.deleteProducts);

  const listings = useMemo(
    () => (Array.isArray(rawProducts) ? rawProducts.map(toSellerListing) : []),
    [rawProducts]
  );
  const stall = current?.stall ? toStallProfile(current.stall) : null;
  const error = rawProducts instanceof Error ? rawProducts.message : null;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | ProductCategory>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isLoading = !isReady || rawProducts === undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (category !== 'all' && l.category !== category) return false;
      if (q && !l.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [listings, query, category]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id));

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((l) => next.delete(l.id));
      } else {
        filtered.forEach((l) => next.add(l.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkMarkOutOfStock = async () => {
    if (selectedIds.size === 0) return;
    try {
      await setProductsOutOfStock({
        productIds: Array.from(selectedIds) as Id<'products'>[],
      });
      message.success(`${selectedIds.size} item(s) marked out of stock`);
      clearSelection();
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    modal.confirm({
      title: `Delete ${selectedIds.size} listing(s)?`,
      content: 'Deleted listings cannot be restored.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Keep them',
      onOk: async () => {
        try {
          await deleteProducts({
            productIds: Array.from(selectedIds) as Id<'products'>[],
          });
          message.success('Listings deleted');
          clearSelection();
        } catch (err) {
          message.error(errorMessage(err));
        }
      },
    });
  };

  const handleDeleteOne = (listing: SellerListing) => {
    modal.confirm({
      title: `Delete “${listing.name}”?`,
      content: 'This will remove the listing from your stall.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Keep it',
      onOk: async () => {
        try {
          await deleteProducts({ productIds: [listing.id as Id<'products'>] });
          message.success('Listing deleted');
        } catch (err) {
          message.error(errorMessage(err));
        }
      },
    });
  };

  return {
    isLoading,
    error,
    listings,
    stall,
    filtered,
    query,
    setQuery,
    category,
    setCategory,
    selectedIds,
    allVisibleSelected,
    toggleSelection,
    toggleSelectVisible,
    clearSelection,
    handleBulkMarkOutOfStock,
    handleBulkDelete,
    handleDeleteOne,
  };
}