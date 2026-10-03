'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { APP_ROUTES } from '@/constants/routes';

const ORDER_ID_PATTERN = /^[a-z0-9]{32}$/;

export function useGcashReturn(orderIds: string[], currentStep: number) {
  const router = useRouter();
  const redirectStarted = useRef(false);
  const validOrderIds = useMemo(
    () => orderIds.length > 0 && orderIds.length <= 25 && orderIds.every((id) => ORDER_ID_PATTERN.test(id)),
    [orderIds]
  );
  const validStep = Number.isInteger(currentStep) && currentStep >= 0 && currentStep < orderIds.length;
  const rawOrders = useQuery(
    api.orders.getMyGcashOrders,
    validOrderIds && validStep
      ? { orderIds: orderIds as Id<'orders'>[] }
      : 'skip'
  );

  const orders = rawOrders ?? [];
  const currentOrder = orders[currentStep];
  const isLoading = validOrderIds && validStep && rawOrders === undefined;
  const hasError = !validOrderIds || !validStep || (rawOrders !== undefined && rawOrders.length !== orderIds.length);
  const hasFailedPayment = orders.some((order) => order.paymentStatus === 'failed' || order.paymentStatus === 'expired');
  const allPaid = !hasError && orders.length > 0 && orders.every((order) => order.paymentStatus === 'paid');
  const nextOrderIndex = orders.findIndex((order, index) => index > currentStep && order.paymentStatus !== 'paid');
  const currentPaid = currentOrder?.paymentStatus === 'paid';
  const nextPaymentUrl = nextOrderIndex >= 0 ? orders[nextOrderIndex].paymentRedirectUrl : undefined;

  useEffect(() => {
    if (redirectStarted.current || hasError || hasFailedPayment) return;

    if (allPaid) {
      redirectStarted.current = true;
      const timer = window.setTimeout(() => router.replace(APP_ROUTES.home), 3500);
      return () => window.clearTimeout(timer);
    }

    if (currentPaid && nextOrderIndex >= 0) {
      if (!nextPaymentUrl) return;
      redirectStarted.current = true;
      const timer = window.setTimeout(() => window.location.assign(nextPaymentUrl), 1800);
      return () => window.clearTimeout(timer);
    }
  }, [allPaid, currentPaid, hasError, hasFailedPayment, nextOrderIndex, nextPaymentUrl, router]);

  const goHome = () => router.replace(APP_ROUTES.home);

  if (isLoading) return { state: 'loading' as const, goHome };
  if (hasError || !currentOrder) return { state: 'error' as const, goHome };
  if (hasFailedPayment) return { state: 'failed' as const, goHome };
  if (allPaid) return { state: 'success' as const, total: orders.reduce((sum, order) => sum + order.total, 0), continuing: false, goHome };
  if (currentPaid) return { state: 'success' as const, total: currentOrder.total, continuing: nextOrderIndex >= 0, goHome };
  return { state: 'checking' as const, total: currentOrder.total, goHome };
}
