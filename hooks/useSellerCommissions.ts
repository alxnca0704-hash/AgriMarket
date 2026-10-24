'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import { usePendingAction } from '@/hooks/usePendingAction';
import { COMMISSION_ACTION_KEYS } from '@/constants/commissions';
import { useSellerFinance } from '@/hooks/useSellerFinance';
import type { SellerCommissionData } from '@/types/commission';

const dataRef = makeFunctionReference<'query', { now: number }, SellerCommissionData | null>('commissions:getSellerCommissions');
const submitRef = makeFunctionReference<'mutation', { invoiceId: string; amount: number; referenceNumber: string }, null>('commissions:submitPayment');
export function useSellerCommissions() {
  const [now, setNow] = useState(0);
  useEffect(() => { const update = () => setNow(Date.now()); update(); const timer = window.setInterval(update, 60_000); return () => window.clearInterval(timer); }, []);
  const data = useQuery(dataRef, { now }); const submit = useMutation(submitRef); const actions = usePendingAction();
  const sellerFinance = useSellerFinance();
  const [values, setValues] = useState<Record<string, { amount: number; referenceNumber: string }>>({});
  const setValue = (id: string, key: 'amount' | 'referenceNumber', value: string | number) => setValues(current => ({ ...current, [id]: { amount: current[id]?.amount ?? 0, referenceNumber: current[id]?.referenceNumber ?? '', [key]: value } }));
  const pay = (id: string) => actions.run(COMMISSION_ACTION_KEYS.submitPayment(id), () => submit({ invoiceId: id, amount: values[id]?.amount ?? 0, referenceNumber: values[id]?.referenceNumber ?? '' }), { success: 'Payment submitted for review.', error: 'Could not submit payment.' });
  return { data, isLoading: data === undefined || sellerFinance.financeLoading, error: data instanceof Error ? data.message : sellerFinance.financeError, finance: sellerFinance.finance, values, setValue, pay, isPending: actions.isPending };
}
