'use client';

import { useQuery } from 'convex/react';
import { useState } from 'react';
import { makeFunctionReference } from 'convex/server';
import type { FinanceQueryArgs } from '@/types/finance';
import type { StallAccountsResult } from '@/types/stallAccount';

const queryRef = makeFunctionReference<'query', FinanceQueryArgs, StallAccountsResult>('finance:getAdminStallAccounts');

export function useAdminStalls() {
  const [now] = useState(() => Date.now());
  const args: FinanceQueryArgs = { from: null, to: null, now };
  const data = useQuery(queryRef, args);
  return { data: data instanceof Error ? undefined : data, isLoading: data === undefined, error: data instanceof Error ? data.message : null };
}
