'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Order } from '@/types/order';
import { SellerOrderGroupKey } from '@/constants/sellerOrders';
import { ORDER_ACTION_KEYS, OrderAction } from '@/constants/orders';
import { usePendingAction } from '@/hooks/usePendingAction';
import { toOrder } from '@/lib/convexSync';

export function useSellerOrders() {
  const raw = useQuery(api.orders.listSellerOrders);
  const confirmMutation = useMutation(api.orders.confirmOrder);
  const rejectMutation = useMutation(api.orders.rejectOrder);
  const dispatchMutation = useMutation(api.orders.dispatchOrder);
  const completeMutation = useMutation(api.orders.completeOrder);
  const approveRefundMutation = useMutation(api.orders.approveRefund);
  const rejectRefundMutation = useMutation(api.orders.rejectRefund);
  const { run, isPending } = usePendingAction();

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
      'refund-requested': 0,
      refunded: 0,
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

  const handleApproveRefund = (order: Order) =>
    run(
      ORDER_ACTION_KEYS.approveRefund(order.id),
      () => approveRefundMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Refund approved — stock restored', error: 'Could not approve the refund' }
    );

  const handleRejectRefund = (order: Order, reason: string) =>
    run(
      ORDER_ACTION_KEYS.rejectRefund(order.id),
      () => rejectRefundMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'Refund rejected', error: 'Could not reject the refund' }
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
    handleApproveRefund,
    handleRejectRefund,
    isActionPending,
  };
}
