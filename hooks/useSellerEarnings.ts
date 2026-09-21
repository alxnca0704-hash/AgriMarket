'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { App } from 'antd';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PayoutMethod } from '@/types/seller';
import {
  EarningsPeriod,
  getEarningsSummary,
  getPayoutMethodSnapshot,
  subscribePayout,
  savePayoutMethod,
} from '@/lib/mockEarnings';
import { toOrder } from '@/lib/convexSync';

export const EARNINGS_PERIOD_OPTIONS: Array<{ key: EarningsPeriod; label: string }> = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export function useSellerEarnings() {
  const { message } = App.useApp();
  const rawOrders = useQuery(api.orders.listSellerOrders);
  const payout = useSyncExternalStore(
    subscribePayout,
    getPayoutMethodSnapshot,
    () => getPayoutMethodSnapshot()
  );

  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<EarningsPeriod>('weekly');
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutDraft, setPayoutDraft] = useState<PayoutMethod>(() => payout);
  const [payoutErrors, setPayoutErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const sellerOrders = useMemo(
    () => (Array.isArray(rawOrders) ? rawOrders.map(toOrder) : []),
    [rawOrders]
  );

  const summary = useMemo(() => getEarningsSummary(period, sellerOrders), [period, sellerOrders]);

  const openPayout = () => {
    setPayoutDraft(payout);
    setPayoutErrors({});
    setPayoutOpen(true);
  };

  const closePayout = () => setPayoutOpen(false);

  const updatePayoutField = <K extends keyof PayoutMethod>(
    field: K,
    value: PayoutMethod[K]
  ) => {
    setPayoutDraft((prev) => ({ ...prev, [field]: value }));
    if (payoutErrors[field]) {
      setPayoutErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const savePayout = () => {
    const errs: Record<string, string> = {};
    if (!payoutDraft.accountName.trim()) errs.accountName = 'Account name is required';
    if (!payoutDraft.accountNumber.trim()) errs.accountNumber = 'Account number is required';
    if (!payoutDraft.bankName?.trim()) {
      errs.bankName = 'Bank name is required';
    }
    setPayoutErrors(errs);
    if (Object.keys(errs).length > 0) return;

    savePayoutMethod(payoutDraft);
    setPayoutOpen(false);
    message.success('Payout method saved');
  };

  return {
    isLoading: isLoading || rawOrders === undefined,
    error: rawOrders instanceof Error ? rawOrders.message : null,
    summary,
    period,
    setPeriod,
    payout,
    payoutOpen,
    payoutDraft,
    payoutErrors,
    openPayout,
    closePayout,
    updatePayoutField,
    savePayout,
  };
}