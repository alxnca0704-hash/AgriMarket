'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import type { FinanceQueryArgs, SellerFinanceResult } from '@/types/finance';

const sellerFinanceRef = makeFunctionReference<'query', FinanceQueryArgs, SellerFinanceResult>('finance:getSellerFinance');

export function useSellerFinance() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const data = useQuery(sellerFinanceRef, { from: null, to: null, now });
  return {
    finance: data instanceof Error ? undefined : data,
    financeLoading: data === undefined,
    financeError: data instanceof Error ? data.message : null,
  };
}
