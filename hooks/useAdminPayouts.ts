'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { AdminPayoutRequest } from '@/types/admin';
import { usePendingAction } from '@/hooks/usePendingAction';
import { GCASH_PAYOUT_ACTION_KEYS } from '@/constants/commissions';

export function useAdminPayouts() {
  const pendingAction = usePendingAction();
  const raw = useQuery(api.payouts.listPendingPayouts, {});
  const payMutation = useMutation(api.payouts.recordPayoutSent);
  const rejectMutation = useMutation(api.payouts.rejectPayout);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const run = async (key: string, action: () => Promise<null>, success: string) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    try {
      return (await pendingAction.run(key, action, { success, error: 'Could not update the payout request.' })) === 'success';
    } finally {
      setIsSubmitting(false);
    }
  };
  return {
    payouts: (raw ?? []) as AdminPayoutRequest[],
    isLoading: raw === undefined,
    error: raw instanceof Error ? raw.message : null,
    isSubmitting,
    recordPaid: (payoutRequestId: string, transferReference: string) => run(
      GCASH_PAYOUT_ACTION_KEYS.adminPaid(payoutRequestId),
      () => payMutation({ payoutRequestId: payoutRequestId as Id<'payoutRequests'>, transferReference }),
      'GCash payout recorded.'
    ),
    reject: (payoutRequestId: string, reason: string) => run(
      GCASH_PAYOUT_ACTION_KEYS.adminReject(payoutRequestId),
      () => rejectMutation({ payoutRequestId: payoutRequestId as Id<'payoutRequests'>, reason }),
      'Payout request rejected; its eligible orders are available again.'
    ),
  };
}
