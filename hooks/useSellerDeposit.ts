'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import { DEPOSIT_ACTION_KEYS, DEPOSIT_GRACE_PERIOD_MS, STALL_DEPOSIT_AMOUNT } from '@/constants/deposits';
import { usePendingAction } from '@/hooks/usePendingAction';

type DepositRecord = { _id: string; amount: number; referenceNumber: string; status: string; approvedAmount?: number; rejectionReason?: string; submittedAt?: string; createdAt: string };
type DepositData = { stall: { depositPaidAmount: number; depositStatus: string; depositDeadline: number; overdue: boolean }; submissions: DepositRecord[]; gcash: { qrUrl: string; number: string } | null } | null;
const getSellerDeposit = makeFunctionReference<'query', { now: number }, DepositData>('deposits:getSellerDeposit');
const submitDeposit = makeFunctionReference<'mutation', { amount: number; referenceNumber: string }, string>('deposits:submit');

export function useSellerDeposit() {
  const actions = usePendingAction();
  const [currentTime, setCurrentTime] = useState(0);
  const data = useQuery(getSellerDeposit, { now: currentTime });
  const submit = useMutation(submitDeposit);
  const [amount, setAmount] = useState<number | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    const update = () => setCurrentTime(new Date().getTime());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(0, STALL_DEPOSIT_AMOUNT - (data?.stall.depositPaidAmount ?? 0));
  const pending = data?.submissions.some(item => item.status === 'pending') ?? false;
  const deadlineDaysLeft = data ? Math.max(0, Math.ceil((data.stall.depositDeadline - currentTime) / 86400000)) : 7;
  const submitForm = async () => {
    if (!amount || amount <= 0 || amount > remaining || !referenceNumber.trim()) return;
    setIsSubmitting(true);
    const outcome = await actions.run(DEPOSIT_ACTION_KEYS.submit, () => submit({ amount, referenceNumber }), { success: 'Deposit submitted for admin review.', error: 'Could not submit deposit.' });
    if (outcome === 'success') { setAmount(null); setReferenceNumber(''); }
    setIsSubmitting(false);
  };
  return { data, isLoading: data === undefined, error: data instanceof Error ? data.message : null, remaining, pending, amount, setAmount, referenceNumber, setReferenceNumber, submitForm, isSubmitting: isSubmitting || actions.isPending(DEPOSIT_ACTION_KEYS.submit), deadlineDaysLeft, gracePeriodMs: DEPOSIT_GRACE_PERIOD_MS };
}
