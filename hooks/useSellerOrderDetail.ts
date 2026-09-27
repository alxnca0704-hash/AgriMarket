'use client';

import { useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Order } from '@/types/order';
import { ORDER_ACTION_KEYS, OrderAction } from '@/constants/orders';
import { usePendingAction } from '@/hooks/usePendingAction';
import { toOrder } from '@/lib/convexSync';

function isValidOrderId(value: string): boolean {
  return /^[a-z0-9]{32}$/.test(value);
}

export function useSellerOrderDetail(orderId: string) {
  const skip = !isValidOrderId(orderId);
  const raw = useQuery(
    api.orders.getSellerOrder,
    skip ? 'skip' : { orderId: orderId as Id<'orders'> }
  );
  const confirmMutation = useMutation(api.orders.confirmOrder);
  const rejectMutation = useMutation(api.orders.rejectOrder);
  const dispatchMutation = useMutation(api.orders.dispatchOrder);
  const completeMutation = useMutation(api.orders.completeOrder);
  const approveRefundMutation = useMutation(api.orders.approveRefund);
  const rejectRefundMutation = useMutation(api.orders.rejectRefund);
  const { run, isPending } = usePendingAction();

  const isLoading = !skip && raw === undefined;
  const order: Order | undefined = !skip && raw ? toOrder(raw) : undefined;
  const error = raw instanceof Error ? raw.message : null;
  const notFound = skip || (!isLoading && !order);

  const handleConfirm = () => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.confirmOrder(order.id),
      () => confirmMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Order confirmed', error: 'Could not confirm the order' }
    );
  };

  const handleReject = (reason: string) => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.rejectOrder(order.id),
      () => rejectMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'Order rejected', error: 'Could not reject the order' }
    );
  };

  const handleDispatch = () => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.dispatchOrder(order.id),
      () => dispatchMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Order marked as to receive', error: 'Could not update the order' }
    );
  };

  const handleComplete = () => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.completeOrder(order.id),
      () => completeMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Order completed', error: 'Could not complete the order' }
    );
  };

  const handleApproveRefund = () => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.approveRefund(order.id),
      () => approveRefundMutation({ orderId: order.id as Id<'orders'> }),
      { success: 'Refund approved — stock restored', error: 'Could not approve the refund' }
    );
  };

  const handleRejectRefund = (reason: string) => {
    if (!order) return Promise.resolve('skipped' as const);
    return run(
      ORDER_ACTION_KEYS.rejectRefund(order.id),
      () => rejectRefundMutation({ orderId: order.id as Id<'orders'>, reason }),
      { success: 'Refund rejected', error: 'Could not reject the refund' }
    );
  };

  const isActionPending = useCallback(
    (action: OrderAction, id: string) => isPending(ORDER_ACTION_KEYS[action](id)),
    [isPending]
  );

  return {
    isLoading,
    error,
    notFound,
    order,
    handleConfirm,
    handleReject,
    handleDispatch,
    handleComplete,
    handleApproveRefund,
    handleRejectRefund,
    isActionPending,
  };
}
