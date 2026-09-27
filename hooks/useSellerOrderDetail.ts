'use client';

import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Order } from '@/types/order';
import { toOrder } from '@/lib/convexSync';

function isValidOrderId(value: string): boolean {
  return /^[a-z0-9]{32}$/.test(value);
}

export function useSellerOrderDetail(orderId: string) {
  const { message } = App.useApp();
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

  const isLoading = !skip && raw === undefined;
  const order: Order | undefined = !skip && raw ? toOrder(raw) : undefined;
  const error = raw instanceof Error ? raw.message : null;
  const notFound = skip || (!isLoading && !order);

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      message.success(success);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const handleConfirm = () => {
    if (!order) return;
    return run(() => confirmMutation({ orderId: order.id as Id<'orders'> }), 'Order confirmed');
  };

  const handleReject = (reason: string) => {
    if (!order) return;
    return run(
      () => rejectMutation({ orderId: order.id as Id<'orders'>, reason }),
      'Order rejected'
    );
  };

  const handleDispatch = () => {
    if (!order) return;
    return run(
      () => dispatchMutation({ orderId: order.id as Id<'orders'> }),
      'Order marked as to receive'
    );
  };

  const handleComplete = () => {
    if (!order) return;
    return run(() => completeMutation({ orderId: order.id as Id<'orders'> }), 'Order completed');
  };

  const handleApproveRefund = () => {
    if (!order) return;
    return run(() => approveRefundMutation({ orderId: order.id as Id<'orders'> }), 'Refund approved — stock restored');
  };

  const handleRejectRefund = (reason: string) => {
    if (!order) return;
    return run(
      () => rejectRefundMutation({ orderId: order.id as Id<'orders'>, reason }),
      'Refund rejected'
    );
  };

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
  };
}
