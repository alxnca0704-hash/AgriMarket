'use client';

import { useMemo, useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Order, OrderStatus } from '@/types/order';
import { toOrder } from '@/lib/convexSync';

export type OrderTabKey = 'all' | OrderStatus;

export function useOrders() {
  const { message } = App.useApp();
  const raw = useQuery(api.orders.listMyOrders);
  const cancelMutation = useMutation(api.orders.cancelOrder);
  const confirmDeliveryMutation = useMutation(api.orders.confirmDelivery);
  const requestRefundMutation = useMutation(api.orders.requestRefund);

  const [activeTab, setActiveTab] = useState<OrderTabKey>('all');

  const orders = useMemo(
    () => (Array.isArray(raw) ? raw.map(toOrder) : []),
    [raw]
  );

  const isLoading = raw === undefined;
  const error = raw instanceof Error ? raw.message : null;

  const counts = useMemo(() => {
    const result: Record<OrderTabKey, number> = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      'to-receive': 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      'refund-requested': 0,
      refunded: 0,
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

  const handleCancel = async (order: Order, reason: string) => {
    try {
      await cancelMutation({ orderId: order.id as Id<'orders'>, reason });
      message.success('Order cancelled');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Could not cancel the order');
    }
  };

  const handleConfirmDelivery = async (order: Order) => {
    try {
      await confirmDeliveryMutation({ orderId: order.id as Id<'orders'> });
      message.success('Receipt confirmed');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Could not confirm receipt');
    }
  };

  const handleRequestRefund = async (order: Order, reason: string) => {
    try {
      await requestRefundMutation({ orderId: order.id as Id<'orders'>, reason });
      message.success('Refund requested — seller will review');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Could not request refund');
    }
  };

  return {
    isLoading,
    error,
    orders,
    activeTab,
    counts,
    visibleOrders,
    setActiveTab,
    handleCancel,
    handleConfirmDelivery,
    handleRequestRefund,
  };
}
