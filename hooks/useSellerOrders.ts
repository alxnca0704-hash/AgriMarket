'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Order } from '@/types/order';
import { SELLER_ORDER_FILTER_STATUSES, SellerOrderGroupKey } from '@/constants/sellerOrders';
import { ORDER_ACTION_KEYS, OrderAction } from '@/constants/orders';
import { usePendingAction } from '@/hooks/usePendingAction';
import { toOrder } from '@/lib/convexSync';

export function useSellerOrders() {
  const raw = useQuery(api.orders.listSellerOrders);
  const confirmMutation = useMutation(api.orders.confirmOrder);
  const rejectMutation = useMutation(api.orders.rejectOrder);
  const dispatchMutation = useMutation(api.orders.dispatchOrder);
  const completeMutation = useMutation(api.orders.completeOrder);
  const confirmReturnReceivedMutation = useMutation(api.orders.confirmReturnReceived);
  const { run, isPending } = usePendingAction();

  const [activeTab, setActiveTab] = useState<SellerOrderGroupKey>('all');

  const orders = useMemo(
    () => (Array.isArray(raw) ? raw.map(toOrder) : []),
    [raw]
  );

  const isLoading = raw === undefined;
  const error = raw instanceof Error ? raw.message : null;

  const counts = useMemo(() => {
    const result: Record<SellerOrderGroupKey, number> = { all: orders.length, active: 0, past: 0, returns: 0 };
    for (const order of orders) {
      const filter = Object.entries(SELLER_ORDER_FILTER_STATUSES).find(([, statuses]) => statuses.includes(order.status));
      if (filter) result[filter[0] as Exclude<SellerOrderGroupKey, 'all'>] += 1;
    }
    return result;
  }, [orders]);

  const sortedOrders = useMemo(() => {
    const visible = activeTab === 'all'
      ? orders
      : orders.filter((order) => SELLER_ORDER_FILTER_STATUSES[activeTab].includes(order.status));
    return [...visible].sort(
      (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    );
  }, [orders, activeTab]);

  const handleConfirm = (order: Order) =>
    run(
      ORDER_ACTION_KEYS.confirmOrder(order.id),
      () => confirmMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Order confirmed', error: 'Could not confirm the order' }
    );

  const handleReject = (order: Order, reason: string) =>
    run(
      ORDER_ACTION_KEYS.rejectOrder(order.id),
      () => rejectMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'Order rejected', error: 'Could not reject the order' }
    );

  const handleDispatch = (order: Order) =>
    run(
      ORDER_ACTION_KEYS.dispatchOrder(order.id),
      () => dispatchMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Order marked as to receive', error: 'Could not update the order' }
    );

  const handleComplete = (order: Order) =>
    run(
      ORDER_ACTION_KEYS.completeOrder(order.id),
      () => completeMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Order completed', error: 'Could not complete the order' }
    );

  const handleConfirmReturnReceived = (order: Order) =>
    run(
      ORDER_ACTION_KEYS.confirmReturnReceived(order.id),
      () => confirmReturnReceivedMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Return receipt confirmed', error: 'Could not confirm returned goods' }
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
    sortedOrders,
    setActiveTab,
    handleConfirm,
    handleReject,
    handleDispatch,
    handleComplete,
    handleConfirmReturnReceived,
    isActionPending,
  };
}
