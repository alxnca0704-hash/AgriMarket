'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Order, OrderStatus } from '@/types/order';
import {
  getEmptyOrdersSnapshot,
  getOrdersSnapshot,
  subscribeOrders,
  shipOrder,
  receiveOrder,
  reviewOrder,
  cancelOrder,
} from '@/lib/mockOrders';

export type OrderTabKey = 'all' | OrderStatus;

export function useOrders() {
  const orders = useSyncExternalStore(
    subscribeOrders,
    getOrdersSnapshot,
    getEmptyOrdersSnapshot
  );

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTabKey>('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const counts = useMemo(() => {
    const result: Record<OrderTabKey, number> = {
      all: orders.length,
      'to-ship': 0,
      'to-receive': 0,
      'to-review': 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach((order) => {
      result[order.status] += 1;
    });
    return result;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter((order) => order.status === activeTab);
  }, [orders, activeTab]);

  const handleShip = (order: Order) => shipOrder(order.id);
  const handleReceive = (order: Order) => receiveOrder(order.id);
  const handleReview = (order: Order) => reviewOrder(order.id);
  const handleCancel = (order: Order, reason: string) =>
    cancelOrder(order.id, reason);

  return {
    isLoading,
    error: null,
    orders,
    activeTab,
    counts,
    visibleOrders,
    setActiveTab,
    handleShip,
    handleReceive,
    handleReview,
    handleCancel,
  };
}