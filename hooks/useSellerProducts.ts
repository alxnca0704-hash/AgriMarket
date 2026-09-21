'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { App } from 'antd';
import { ProductCategory } from '@/constants/categories';
import { SellerListing } from '@/types/seller';
import {
  getListingsSnapshot,
  getEmptyListingsSnapshot,
  subscribeListings,
  toggleListingActive,
  setListingsOutOfStock,
  deleteListings,
  LOW_STOCK_THRESHOLD,
} from '@/lib/mockListings';
import { getStallSnapshot, subscribeStall } from '@/lib/mockStall';

export type ListingStatusFilter = 'all' | 'active' | 'inactive' | 'low';

export function getListingStockStatus(listing: SellerListing): 'active' | 'inactive' | 'low' {
  if (!listing.isActive) return 'inactive';
  if (listing.stockQty > 0 && listing.stockQty <= LOW_STOCK_THRESHOLD) return 'low';
  return 'active';
}

export function useSellerProducts() {
  const { message, modal } = App.useApp();
  const listings = useSyncExternalStore(
    subscribeListings,
    getListingsSnapshot,
    getEmptyListingsSnapshot
  );
  const stall = useSyncExternalStore(
    subscribeStall,
    getStallSnapshot,
    getStallSnapshot
  );

  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | ProductCategory>('all');
  const [status, setStatus] = useState<ListingStatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (category !== 'all' && l.category !== category) return false;
      if (status !== 'all' && getListingStockStatus(l) !== status) return false;
      if (q && !l.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [listings, query, category, status]);

  const counts = useMemo(() => {
    const result = { all: listings.length, active: 0, inactive: 0, low: 0 };
    listings.forEach((l) => {
      const s = getListingStockStatus(l);
      result[s] += 1;
    });
    return result;
  }, [listings]);

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

  const handleToggle = (id: string) => {
    toggleListingActive(id);
    message.success('Listing status updated');
  };

  const handleBulkMarkOutOfStock = () => {
    if (selectedIds.size === 0) return;
    setListingsOutOfStock(Array.from(selectedIds));
    message.success(`${selectedIds.size} item(s) marked out of stock`);
    clearSelection();
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    modal.confirm({
      title: `Delete ${selectedIds.size} listing(s)?`,
      content: 'Deleted listings cannot be restored.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Keep them',
      onOk: () => {
        deleteListings(Array.from(selectedIds));
        message.success('Listings deleted');
        clearSelection();
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
      onOk: () => {
        deleteListings([listing.id]);
        message.success('Listing deleted');
      },
    });
  };

  return {
    isLoading,
    error: null,
    listings,
    stall,
    filtered,
    counts,
    query,
    setQuery,
    category,
    setCategory,
    status,
    setStatus,
    selectedIds,
    allVisibleSelected,
    toggleSelection,
    toggleSelectVisible,
    clearSelection,
    handleToggle,
    handleBulkMarkOutOfStock,
    handleBulkDelete,
    handleDeleteOne,
  };
}