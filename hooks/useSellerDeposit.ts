'use client';

import { useEffect, useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import { DEPOSIT_GRACE_PERIOD_MS, SELLER_DEPOSIT_AMOUNT } from '@/constants/deposits';

type DepositRecord = { _id: string; amount: number; referenceNumber: string; status: string; approvedAmount?: number; rejectionReason?: string; createdAt: string };
type DepositData = { stall: { depositPaidAmount: number; depositStatus: string; depositDeadline: number; suspended: boolean }; submissions: DepositRecord[]; gcash: { qrUrl: string; number: string } | null } | null;
const getSellerDeposit = makeFunctionReference<'query', Record<string, never>, DepositData>('deposits:getSellerDeposit');
const submitDeposit = makeFunctionReference<'mutation', { amount: number; referenceNumber: string }, string>('deposits:submit');

export function useSellerDeposit() {
  const { message } = App.useApp();
  const data = useQuery(getSellerDeposit, {});
  const submit = useMutation(submitDeposit);
  const [amount, setAmount] = useState<number | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    const update = () => setCurrentTime(new Date().getTime());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(0, SELLER_DEPOSIT_AMOUNT - (data?.stall.depositPaidAmount ?? 0));
  const pending = data?.submissions.some(item => item.status === 'pending') ?? false;
  const deadlineDaysLeft = data ? Math.max(0, Math.ceil((data.stall.depositDeadline - currentTime) / 86400000)) : 7;
  const submitForm = async () => {
    if (!amount || amount <= 0 || amount > remaining || !referenceNumber.trim()) return;
    setIsSubmitting(true);
    try {
      await submit({ amount, referenceNumber: referenceNumber.trim() });
      setAmount(null); setReferenceNumber(''); message.success('Deposit submitted for admin review.');
    } catch (error) { message.error(error instanceof Error ? error.message : 'Could not submit deposit.'); }
    finally { setIsSubmitting(false); }
  };
  return { data, isLoading: data === undefined, remaining, pending, amount, setAmount, referenceNumber, setReferenceNumber, submitForm, isSubmitting, deadlineDaysLeft, gracePeriodMs: DEPOSIT_GRACE_PERIOD_MS };
}
