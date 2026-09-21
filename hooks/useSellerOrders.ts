'use client';

import { useMemo, useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Order } from '@/types/order';
import { SellerOrderGroupKey } from '@/constants/sellerOrders';
import { toOrder } from '@/lib/convexSync';

export function useSellerOrders() {
  const { message } = App.useApp();
  const raw = useQuery(api.orders.listSellerOrders);
  const confirmMutation = useMutation(api.orders.confirmOrder);
  const rejectMutation = useMutation(api.orders.rejectOrder);
  const dispatchMutation = useMutation(api.orders.dispatchOrder);
  const completeMutation = useMutation(api.orders.completeOrder);

  const [activeTab, setActiveTab] = useState<SellerOrderGroupKey>('all');

  const orders = useMemo(
    () => (Array.isArray(raw) ? raw.map(toOrder) : []),
    [raw]
  );

  const isLoading = raw === undefined;
  const error = raw instanceof Error ? raw.message : null;

  const counts = useMemo(() => {
    const result: Record<SellerOrderGroupKey, number> = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      'to-receive': 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach((order) => {
      result[order.status] += 1;
    });
    return result;
  }, [orders]);

  const sortedOrders = useMemo(() => {
    const visible =
      activeTab === 'all'
        ? orders
        : orders.filter((order) => order.status === activeTab);
    return [...visible].sort(
      (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    );
  }, [orders, activeTab]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      message.success(success);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const handleConfirm = (order: Order) =>
    run(() => confirmMutation({ orderId: order.id as Id<'orders'> }), 'Order confirmed');

  const handleReject = (order: Order, reason: string) =>
    run(
      () => rejectMutation({ orderId: order.id as Id<'orders'>, reason }),
      'Order rejected'
    );

  const handleDispatch = (order: Order) =>
    run(
      () => dispatchMutation({ orderId: order.id as Id<'orders'> }),
      'Order marked as to receive'
    );

  const handleComplete = (order: Order) =>
    run(() => completeMutation({ orderId: order.id as Id<'orders'> }), 'Order completed');

  return {
    isLoading,
    error,
    orders,
    activeTab,
    counts,
    sortedOrders,
    setActiveTab,
    handleConfirm,
    handleReject,
    handleDispatch,
    handleComplete,
  };
}
