'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { App } from 'antd';
import { Order } from '@/types/order';
import { SellerOrderGroupKey } from '@/constants/sellerOrders';
import {
  getEmptyOrdersSnapshot,
  getOrdersSnapshot,
  subscribeOrders,
  acceptOrder,
  markOrderReady,
  shipOrder,
  cancelOrder,
} from '@/lib/mockOrders';
import { DEMO_SELLER_ID } from '@/lib/mockStall';

export function useSellerOrders() {
  const { message } = App.useApp();
  const allOrders = useSyncExternalStore(
    subscribeOrders,
    getOrdersSnapshot,
    getEmptyOrdersSnapshot
  );

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SellerOrderGroupKey>('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const orders: Order[] = useMemo(
    () => allOrders.filter((o) => o.sellerId === DEMO_SELLER_ID),
    [allOrders]
  );

  const counts = useMemo(() => {
    const result: Record<SellerOrderGroupKey, number> = {
      all: orders.length,
      new: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach((order) => {
      if (order.status === 'to-ship' && !order.acceptedAt) result.new += 1;
      else if (order.status === 'to-ship' && order.acceptedAt && !order.readyAt) result.preparing += 1;
      else if (order.status === 'completed') result.completed += 1;
      else if (order.status === 'cancelled') result.cancelled += 1;
      else result.ready += 1;
    });
    return result;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter((o) => {
      if (activeTab === 'new') return o.status === 'to-ship' && !o.acceptedAt;
      if (activeTab === 'preparing') return o.status === 'to-ship' && !!o.acceptedAt && !o.readyAt;
      if (activeTab === 'ready') {
        return (
          o.status === 'to-ship' ||
          o.status === 'to-receive' ||
          o.status === 'to-review'
        );
      }
      return o.status === activeTab;
    });
  }, [orders, activeTab]);

  const sortedOrders = useMemo(
    () =>
      [...visibleOrders].sort(
        (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
      ),
    [visibleOrders]
  );

  const handleAccept = (order: Order) => {
    acceptOrder(order.id);
    message.success('Order accepted');
  };

  const handleMarkReady = (order: Order) => {
    markOrderReady(order.id);
    message.success('Marked as ready for dispatch');
  };

  const handleMarkShipped = (order: Order) => {
    shipOrder(order.id);
    message.success('Order marked as shipped');
  };

  const handleCancel = (order: Order, reason: string) => {
    cancelOrder(order.id, reason);
    message.success('Order cancelled');
  };

  return {
    isLoading,
    error: null,
    orders,
    activeTab,
    counts,
    sortedOrders,
    setActiveTab,
    handleAccept,
    handleMarkReady,
    handleMarkShipped,
    handleCancel,
  };
}