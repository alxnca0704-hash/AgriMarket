'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Order } from '@/types/order';
import {
  getEmptyOrdersSnapshot,
  getOrdersSnapshot,
  subscribeOrders,
  shipOrder,
  receiveOrder,
  reviewOrder,
  cancelOrder,
} from '@/lib/mockOrders';

export function useOrderDetail(orderId: string) {
  const orders = useSyncExternalStore(
    subscribeOrders,
    getOrdersSnapshot,
    getEmptyOrdersSnapshot
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const order: Order | undefined = orders.find((o) => o.id === orderId);

  const handleShip = () => order && shipOrder(order.id);
  const handleReceive = () => order && receiveOrder(order.id);
  const handleReview = () => order && reviewOrder(order.id);
  const handleCancel = (reason: string) => order && cancelOrder(order.id, reason);

  return {
    isLoading,
    error: null,
    notFound: !isLoading && !order,
    order,
    handleShip,
    handleReceive,
    handleReview,
    handleCancel,
  };
}