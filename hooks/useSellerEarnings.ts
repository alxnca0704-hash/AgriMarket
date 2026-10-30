'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { PAYOUT_ACTION_KEYS, MIN_PAYOUT_AMOUNT, isPayoutDay, nextPayoutDate } from '@/constants/payouts';
import { usePendingAction } from '@/hooks/usePendingAction';
import { useSellerFinance } from '@/hooks/useSellerFinance';

export function useSellerEarnings() {
  const pendingAction = usePendingAction();
  const sellerFinance = useSellerFinance();
  const [now, setNow] = useState(() => Date.now());
  const payoutData = useQuery(api.payouts.getSellerPayouts, {});
  const requestMutation = useMutation(api.payouts.requestPayout);
  const cancelMutation = useMutation(api.payouts.cancelPayout);
  const saveDestinationMutation = useMutation(api.payouts.saveSellerPayoutDestination);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [gcashName, setGcashName] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSavingDestination, setIsSavingDestination] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const activeRequest = payoutData && 'requests' in payoutData ? payoutData.requests.find((request) => request.statusV2 === 'requested') ?? null : null;
  const amount = payoutData && 'eligibleAmount' in payoutData ? payoutData.eligibleAmount : 0;
  const amountAvailable = amount > 0 && amount >= MIN_PAYOUT_AMOUNT;
  const hasDestination = Boolean(payoutData && 'payoutGcashNumber' in payoutData && payoutData.payoutGcashNumber);
  const canRequest = Boolean(payoutData && 'isPayoutDay' in payoutData && payoutData.isPayoutDay && amountAvailable && hasDestination && !activeRequest);
  const requestDisabledReason = activeRequest ? 'Already requested for this Sunday' : !hasDestination ? 'Add your GCash payout number' : !amountAvailable ? 'No available balance' : !isPayoutDay(now) ? `Payouts can be requested on Sundays. Next: ${new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }).format(nextPayoutDate(now))}.` : '';
  const requestPayout = async () => {
    if (!canRequest || isRequesting || pendingAction.isPending(PAYOUT_ACTION_KEYS.request)) return;
    setIsRequesting(true);
    const result = await pendingAction.run(PAYOUT_ACTION_KEYS.request, () => requestMutation({}), { success: 'Payout request received.', error: 'Could not request payout.' });
    setIsRequesting(false);
    if (result === 'success') setPayoutOpen(false);
  };
  const cancelPayout = async (requestId: string) => {
    if (isCancelling) return;
    setIsCancelling(true);
    await pendingAction.run(PAYOUT_ACTION_KEYS.cancel(requestId), () => cancelMutation({ payoutRequestId: requestId as Id<'payoutRequests'> }), { success: 'Payout request cancelled.', error: 'Could not cancel payout request.' });
    setIsCancelling(false);
  };
  const saveDestination = async () => {
    if (isSavingDestination) return;
    setIsSavingDestination(true);
    const result = await pendingAction.run('gcash-payout:destination', () => saveDestinationMutation({ gcashName, gcashNumber }), { success: 'GCash payout details saved.', error: 'Could not save GCash payout details.' });
    setIsSavingDestination(false);
    if (result === 'success') setDestinationOpen(false);
  };
  return {
    isLoading: payoutData === undefined || sellerFinance.financeLoading,
    error: payoutData instanceof Error ? payoutData.message : sellerFinance.financeError,
    payoutData,
    finance: sellerFinance.finance,
    canRequest,
    requestDisabledReason,
    requestPayout,
    cancelPayout,
    activeRequest,
    isRequesting,
    isCancelling,
    isRequestPending: pendingAction.isPending(PAYOUT_ACTION_KEYS.request),
    payoutOpen,
    openPayout: () => setPayoutOpen(true),
    closePayout: () => setPayoutOpen(false),
    destinationOpen,
    openDestination: () => { setGcashName(payoutData && 'payoutGcashName' in payoutData ? payoutData.payoutGcashName ?? '' : ''); setGcashNumber(payoutData && 'payoutGcashNumber' in payoutData ? payoutData.payoutGcashNumber ?? '' : ''); setDestinationOpen(true); },
    closeDestination: () => setDestinationOpen(false),
    gcashName,
    setGcashName,
    gcashNumber,
    setGcashNumber,
    saveDestination,
    isSavingDestination,
    refreshNow: () => setNow(Date.now()),
  };
}
