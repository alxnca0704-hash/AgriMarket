'use client';

import { useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { AdminPayoutRequest } from '@/types/admin';

export function useAdminPayouts() {
  const { message } = App.useApp();
  const raw = useQuery(api.payouts.listPendingPayouts, {});
  const payMutation = useMutation(api.payouts.recordPayoutSent);
  const rejectMutation = useMutation(api.payouts.rejectPayout);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const run = async (action: () => Promise<null>, success: string) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    try {
      await action();
      message.success(success);
      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Could not update the payout request.');
      return false;
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
      () => payMutation({ payoutRequestId: payoutRequestId as Id<'payoutRequests'>, transferReference }),
      'GCash payout recorded.'
    ),
    reject: (payoutRequestId: string, reason: string) => run(
      () => rejectMutation({ payoutRequestId: payoutRequestId as Id<'payoutRequests'>, reason }),
      'Payout request rejected; its eligible orders are available again.'
    ),
  };
}
