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

export function useOrderDetail(orderId: string) {
  const { message } = App.useApp();
  const skip = !isValidOrderId(orderId);
  const raw = useQuery(
    api.orders.getMyOrder,
    skip ? 'skip' : { orderId: orderId as Id<'orders'> }
  );
  const cancelMutation = useMutation(api.orders.cancelOrder);
  const confirmDeliveryMutation = useMutation(api.orders.confirmDelivery);

  const isLoading = !skip && raw === undefined;
  const order: Order | undefined = !skip && raw ? toOrder(raw) : undefined;
  const error = raw instanceof Error ? raw.message : null;
  const notFound = skip || (!isLoading && !order);

  const handleCancel = async (reason: string) => {
    if (!order) return;
    try {
      await cancelMutation({ orderId: order.id as Id<'orders'>, reason });
      message.success('Order cancelled');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Could not cancel the order');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order) return;
    try {
      await confirmDeliveryMutation({ orderId: order.id as Id<'orders'> });
      message.success('Receipt confirmed');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Could not confirm receipt');
    }
  };

  return {
    isLoading,
    error,
    notFound,
    order,
    handleCancel,
    handleConfirmDelivery,
  };
}
