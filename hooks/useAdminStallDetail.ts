'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import type { Id } from '@/convex/_generated/dataModel';
import type { FinanceQueryArgs, StallFinanceResult } from '@/types/finance';

const queryRef = makeFunctionReference<'query', FinanceQueryArgs & { stallId: Id<'stalls'> }, StallFinanceResult>('finance:getAdminFinanceStall');

export function useAdminStallDetail(stallId: string) {
  const [now] = useState(() => Date.now());
  const args = { stallId: stallId as Id<'stalls'>, from: null, to: null, now };
  const data = useQuery(queryRef, args);
  return { data: data instanceof Error ? undefined : data, isLoading: data === undefined, error: data instanceof Error ? data.message : null };
}
