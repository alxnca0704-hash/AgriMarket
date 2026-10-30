'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import { App } from 'antd';
import { api } from '@/convex/_generated/api';
import { usePendingAction } from '@/hooks/usePendingAction';
import type { Id } from '@/convex/_generated/dataModel';
import type { FinanceQueryArgs, StallFinanceResult } from '@/types/finance';

const queryRef = makeFunctionReference<'query', FinanceQueryArgs & { stallId: Id<'stalls'> }, StallFinanceResult>('finance:getAdminFinanceStall');

export function useAdminStallDetail(stallId: string) {
  const { message } = App.useApp();
  const pending = usePendingAction();
  const settleMutation = useMutation(api.payouts.settleSellerOwesPlatform);
  const waiveMutation = useMutation(api.payouts.waiveSellerOwesPlatform);
  const [now] = useState(() => Date.now());
  const args = { stallId: stallId as Id<'stalls'>, from: null, to: null, now };
  const data = useQuery(queryRef, args);
  const run = async (key: string, action: () => Promise<null>, success: string) => {
    const result = await pending.run(key, action, { success, error: 'Could not update the seller receivable.' });
    return result === 'success';
  };
  return {
    data: data instanceof Error ? undefined : data,
    isLoading: data === undefined,
    error: data instanceof Error ? data.message : null,
    isSubmitting: pending.isPending('seller-owes-platform'),
    settle: async (recordId: string, referenceOrNote: string) => {
      const ok = await run('seller-owes-platform', () => settleMutation({ recordId: recordId as Id<'sellerOwesPlatform'>, referenceOrNote }), 'Seller receivable settled.');
      if (!ok) message.error('Could not settle seller receivable.');
      return ok;
    },
    waive: async (recordId: string, reason: string) => {
      const ok = await run('seller-owes-platform', () => waiveMutation({ recordId: recordId as Id<'sellerOwesPlatform'>, reason }), 'Seller receivable waived.');
      if (!ok) message.error('Could not waive seller receivable.');
      return ok;
    },
  };
}
