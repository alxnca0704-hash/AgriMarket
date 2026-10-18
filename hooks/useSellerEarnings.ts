'use client';

import { useMemo, useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { EarningsPeriod, getEarningsSummary } from '@/lib/earnings';
import { toOrder } from '@/lib/convexSync';

export const EARNINGS_PERIOD_OPTIONS: Array<{ key: EarningsPeriod; label: string }> = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export function useSellerEarnings() {
  const { message } = App.useApp();
  const rawOrders = useQuery(api.orders.listSellerOrders);
  const payoutData = useQuery(api.payouts.getSellerPayouts, {});
  const requestMutation = useMutation(api.payouts.requestPayout);
  const [period, setPeriod] = useState<EarningsPeriod>('weekly');
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [gcashName, setGcashName] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const sellerOrders = useMemo(
    () => (Array.isArray(rawOrders) ? rawOrders.map(toOrder) : []),
    [rawOrders]
  );
  const summary = useMemo(() => getEarningsSummary(period, sellerOrders), [period, sellerOrders]);
  const selectedPayoutOrderIds = payoutData && 'orders' in payoutData
    ? payoutData.orders.filter((order) => order.payoutStatus === 'ready' && selectedOrderIds.includes(order.orderId)).map((order) => order.orderId)
    : [];
  const selectedPayoutAmount = payoutData && 'orders' in payoutData
    ? payoutData.orders.filter((order) => selectedPayoutOrderIds.includes(order.orderId)).reduce((total, order) => total + order.amount, 0)
    : 0;

  const requestPayout = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await requestMutation({ gcashName, gcashNumber, orderIds: selectedPayoutOrderIds as Id<'orders'>[] });
      message.success('Payout request sent for admin review.');
      setPayoutOpen(false);
      setSelectedOrderIds([]);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Could not request payout.');
    } finally {
      setIsRequesting(false);
    }
  };

  return {
    isLoading: rawOrders === undefined || payoutData === undefined,
    error: rawOrders instanceof Error ? rawOrders.message : payoutData instanceof Error ? payoutData.message : null,
    summary,
    period,
    setPeriod,
    payoutData,
    selectedOrderIds: selectedPayoutOrderIds,
    selectedPayoutAmount,
    togglePayoutOrder: (orderId: string) => setSelectedOrderIds((previous) => previous.includes(orderId)
      ? previous.filter((id) => id !== orderId)
      : previous.length < 100 ? [...previous, orderId] : previous),
    selectAllReadyOrders: () => setSelectedOrderIds(payoutData && 'orders' in payoutData
      ? payoutData.orders.filter((order) => order.payoutStatus === 'ready').slice(0, 100).map((order) => order.orderId)
      : []),
    payoutOpen,
    openPayout: () => setPayoutOpen(true),
    closePayout: () => setPayoutOpen(false),
    gcashName,
    setGcashName,
    gcashNumber,
    setGcashNumber,
    requestPayout,
    isRequesting,
  };
}
