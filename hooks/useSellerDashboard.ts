'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SellerOrderStats } from '@/types/order';
import { LOW_STOCK_THRESHOLD } from '@/constants/products';
import { toOrder, toSellerListing, toStallProfile } from '@/lib/convexSync';
import { useConvexUserSync } from '@/hooks/useConvexUserSync';

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function useSellerDashboard() {
  const { current, isReady } = useConvexUserSync();
  const rawProducts = useQuery(api.products.listMyProducts);
  const rawOrders = useQuery(api.orders.listSellerOrders);
  const [now] = useState(() => Date.now());
  const rawSales = useQuery(api.sales.sellerSales, {
    search: '',
    paymentMethod: 'all',
    saleStatus: 'all',
    from: null,
    to: null,
    stallId: null,
    page: 1,
    pageSize: 1,
    now,
  });
  const rawFinance = useQuery(api.finance.getSellerFinance, { from: null, to: null, now });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const listings = useMemo(
    () => (Array.isArray(rawProducts) ? rawProducts.map(toSellerListing) : []),
    [rawProducts]
  );
  const stall = current?.stall ? toStallProfile(current.stall) : null;

  const stats = useMemo<SellerOrderStats>(() => {
    const orders = Array.isArray(rawOrders) ? rawOrders.map(toOrder) : [];
    const result: SellerOrderStats = {
      todayOrders: 0,
      pendingOrders: 0,
      inTransitOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSales: rawSales?.summary.totalSales ?? 0,
    };
    orders.forEach((order) => {
      if (isToday(order.placedAt)) result.todayOrders += 1;
      if (order.status === 'pending' || order.status === 'confirmed') {
        result.pendingOrders += 1;
      } else if (order.status === 'to-receive' || order.status === 'delivered') {
        result.inTransitOrders += 1;
      } else if (order.status === 'completed') {
        result.completedOrders += 1;
      } else if (order.status === 'cancelled') {
        result.cancelledOrders += 1;
      }
    });
    return result;
  }, [rawOrders, rawSales]);

  const activeListings = listings.filter((l) => l.isActive);
  const lowStock = listings.filter(
    (l) => l.isActive && l.stockQty > 0 && l.stockQty <= LOW_STOCK_THRESHOLD
  );
  const outOfStockCount = listings.filter((l) => !l.isActive).length;

  const error =
    rawProducts instanceof Error
      ? rawProducts.message
      : rawOrders instanceof Error
        ? rawOrders.message
        : rawSales instanceof Error
          ? rawSales.message
          : rawFinance instanceof Error
            ? rawFinance.message
            : null;

  return {
    isLoading:
      isLoading || !isReady || rawProducts === undefined || rawOrders === undefined || rawSales === undefined || rawFinance === undefined,
    error,
    stall,
    stats,
    codCommissionOwed: rawFinance?.cod.totalOwed ?? 0,
    payoutAvailable: rawFinance?.gcash.availableBalance ?? 0,
    payoutRolling: rawFinance?.gcash.rollingBalance ?? 0,
    payoutRequested: rawFinance?.gcash.requestedBalance ?? 0,
    payoutPaidOut: rawFinance?.gcash.paidOut ?? 0,
    activeListings,
    lowStock,
    outOfStockCount,
    listingCount: listings.length,
  };
}
