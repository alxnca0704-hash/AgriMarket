'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Order, OrderStatus } from '@/types/order';
import { ORDER_ACTION_KEYS, OrderAction } from '@/constants/orders';
import { usePendingAction } from '@/hooks/usePendingAction';
import { toOrder } from '@/lib/convexSync';

export type OrderTabKey = 'all' | OrderStatus;

export function useOrders() {
  const raw = useQuery(api.orders.listMyOrders);
  const cancelMutation = useMutation(api.orders.cancelOrder);
  const confirmDeliveryMutation = useMutation(api.orders.confirmDelivery);
  const requestRefundMutation = useMutation(api.orders.requestRefund);
  const { run, isPending } = usePendingAction();

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

  const handleCancel = (order: Order, reason: string) =>
    run(
      ORDER_ACTION_KEYS.cancelOrder(order.id),
      () => cancelMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'Order cancelled', error: 'Could not cancel the order' }
    );

  const handleConfirmDelivery = (order: Order) =>
    run(
      ORDER_ACTION_KEYS.confirmDelivery(order.id),
      () => confirmDeliveryMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Receipt confirmed', error: 'Could not confirm receipt' }
    );

  const handleRequestRefund = (order: Order, reason: string) =>
    run(
      ORDER_ACTION_KEYS.requestRefund(order.id),
      () => requestRefundMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'Refund requested — seller will review', error: 'Could not request refund' }
    );

  const isActionPending = useCallback(
    (action: OrderAction, orderId: string) => isPending(ORDER_ACTION_KEYS[action](orderId)),
    [isPending]
  );

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
    isActionPending,
  };
}
