'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { EarningsPeriod, getEarningsSummary } from '@/lib/earnings';
import { toOrder } from '@/lib/convexSync';
import { COMMISSION_RATE, GCASH_PAYOUT_ACTION_KEYS } from '@/constants/commissions';
import { usePendingAction } from '@/hooks/usePendingAction';
import { useSellerFinance } from '@/hooks/useSellerFinance';

export const EARNINGS_PERIOD_OPTIONS: Array<{ key: EarningsPeriod; label: string }> = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export function useSellerEarnings() {
  const pendingAction = usePendingAction();
  const sellerFinance = useSellerFinance();
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => { const refresh = () => setCurrentTime(Date.now()); refresh(); const timer = window.setInterval(refresh, 60_000); return () => window.clearInterval(timer); }, []);
  const rawOrders = useQuery(api.orders.listSellerOrders);
  const payoutData = useQuery(api.payouts.getSellerPayouts, {});
  const depositData = useQuery(api.deposits.getSellerDeposit, { now: currentTime });
  const requestMutation = useMutation(api.payouts.requestPayout);
  const backfillMutation = useMutation(api.payouts.backfillSellerGcashCommissions);
  const [period, setPeriod] = useState<EarningsPeriod>('weekly');
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [gcashName, setGcashName] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    void backfillMutation({});
  }, [backfillMutation]);

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
  const selectedBreakdown = payoutData && 'orders' in payoutData
    ? payoutData.orders.filter((order) => selectedPayoutOrderIds.includes(order.orderId)).reduce((total, order) => ({ items: total.items + order.itemsSubtotal, delivery: total.delivery + order.deliveryFee, commission: total.commission + order.commissionAmount, net: total.net + order.netPayoutAmount }), { items: 0, delivery: 0, commission: 0, net: 0 })
    : { items: 0, delivery: 0, commission: 0, net: 0 };

  const requestPayout = async () => {
    if (isRequesting || pendingAction.isPending(GCASH_PAYOUT_ACTION_KEYS.request)) return;
    setIsRequesting(true);
    const outcome = await pendingAction.run(GCASH_PAYOUT_ACTION_KEYS.request, () => requestMutation({ gcashName, gcashNumber, orderIds: selectedPayoutOrderIds as Id<'orders'>[] }), { success: 'Payout request sent for admin review.', error: 'Could not request payout.' });
    if (outcome === 'success') {
      setPayoutOpen(false);
      setSelectedOrderIds([]);
    }
    setIsRequesting(false);
  };

  return {
    isLoading: rawOrders === undefined || payoutData === undefined || depositData === undefined || sellerFinance.financeLoading,
    error: rawOrders instanceof Error ? rawOrders.message : payoutData instanceof Error ? payoutData.message : depositData instanceof Error ? depositData.message : sellerFinance.financeError,
    depositHeld: depositData?.stall?.depositPaidAmount ?? 0,
    finance: sellerFinance.finance,
    summary,
    period,
    setPeriod,
    payoutData,
    selectedOrderIds: selectedPayoutOrderIds,
    selectedPayoutAmount,
    selectedBreakdown,
    commissionRate: COMMISSION_RATE,
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
    isRequestPending: pendingAction.isPending(GCASH_PAYOUT_ACTION_KEYS.request),
  };
}
