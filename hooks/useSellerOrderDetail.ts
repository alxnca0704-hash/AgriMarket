'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { App } from 'antd';
import { Order } from '@/types/order';
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

export function useSellerOrderDetail(orderId: string) {
  const { message } = App.useApp();
  const allOrders = useSyncExternalStore(
    subscribeOrders,
    getOrdersSnapshot,
    getEmptyOrdersSnapshot
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  const order: Order | undefined = allOrders.find(
    (o) => o.id === orderId && o.sellerId === DEMO_SELLER_ID
  );

  const notFound = !isLoading && !order;

  const handleAccept = () => {
    if (!order) return;
    acceptOrder(order.id);
    message.success('Order accepted');
  };

  const handleMarkReady = () => {
    if (!order) return;
    markOrderReady(order.id);
    message.success('Marked as ready for dispatch');
  };

  const handleMarkShipped = () => {
    if (!order) return;
    shipOrder(order.id);
    message.success('Order marked as shipped');
  };

  const handleCancel = (reason: string) => {
    if (!order) return;
    cancelOrder(order.id, reason);
    message.success('Order cancelled');
  };

  return {
    isLoading,
    error: null,
    notFound,
    order,
    handleAccept,
    handleMarkReady,
    handleMarkShipped,
    handleCancel,
  };
}