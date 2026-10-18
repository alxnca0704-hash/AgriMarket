'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Order } from '@/types/order';
import { ORDER_ACTION_KEYS, ORDER_FILTER_STATUSES, ORDER_LIST_FILTERS, OrderAction, OrderListFilter } from '@/constants/orders';
import { usePendingAction } from '@/hooks/usePendingAction';
import { toOrder } from '@/lib/convexSync';

export function useOrders() {
  const raw = useQuery(api.orders.listMyOrders);
  const cancelMutation = useMutation(api.orders.cancelOrder);
  const confirmDeliveryMutation = useMutation(api.orders.confirmDelivery);
  const requestRefundMutation = useMutation(api.orders.requestRefund);
  const { run, isPending } = usePendingAction();

  const [activeTab, setActiveTab] = useState<OrderListFilter>('all');

  const orders = useMemo(
    () => (Array.isArray(raw) ? raw.map(toOrder) : []),
    [raw]
  );

  const isLoading = raw === undefined;
  const error = raw instanceof Error ? raw.message : null;

  const counts = useMemo(() => {
    const result: Record<OrderListFilter, number> = { all: orders.length, active: 0, past: 0, returns: 0 };
    for (const order of orders) {
      const filter = ORDER_LIST_FILTERS.find(({ key }) =>
        key !== 'all' && ORDER_FILTER_STATUSES[key].includes(order.status)
      );
      if (filter) result[filter.key] += 1;
    }
    return result;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter((order) => ORDER_FILTER_STATUSES[activeTab].includes(order.status));
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
      { success: 'Receipt confirmed and order completed', error: 'Could not confirm receipt' }
    );

  const handleRequestRefund = (order: Order, reason: string, evidenceUrls: string[]) =>
    run(
      ORDER_ACTION_KEYS.requestRefund(order.id),
      () => requestRefundMutation({ orderId: order.id as Id<'orders'>, reason, evidenceUrls }),
      { success: 'Return request sent — the admin has been notified', error: 'Could not request refund' }
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
