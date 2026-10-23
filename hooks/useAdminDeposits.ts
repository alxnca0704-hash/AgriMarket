'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import { usePendingAction } from '@/hooks/usePendingAction';

type PendingDeposit = { _id: string; amount: number; referenceNumber: string; createdAt: string; stallName: string; sellerName: string; approvedTotal: number; remaining: number };
const list = makeFunctionReference<'query', Record<string, never>, PendingDeposit[]>('deposits:listPending');
const approveRef = makeFunctionReference<'mutation', { depositId: string; approvedAmount: number }, null>('deposits:approve');
const rejectRef = makeFunctionReference<'mutation', { depositId: string; reason: string }, null>('deposits:reject');

export function useAdminDeposits() {
  const deposits = useQuery(list, {});
  const approve = useMutation(approveRef);
  const reject = useMutation(rejectRef);
  const actions = usePendingAction();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [confirmedAmounts, setConfirmedAmounts] = useState<Record<string, number>>({});
  const approveDeposit = (item: PendingDeposit) => actions.run(`deposit:approve:${item._id}`, () => approve({ depositId: item._id, approvedAmount: confirmedAmounts[item._id] ?? item.amount }), { success: 'Deposit approved.', error: 'Could not approve deposit.' });
  const rejectDeposit = () => rejectingId && actions.run(`deposit:reject:${rejectingId}`, () => reject({ depositId: rejectingId, reason }), { success: 'Deposit rejected.', error: 'Could not reject deposit.' }).then(result => { if (result === 'success') { setRejectingId(null); setReason(''); } });
  return { deposits, isLoading: deposits === undefined, error: deposits instanceof Error ? deposits.message : null, isPending: actions.isPending, confirmedAmounts, setConfirmedAmount: (id: string, amount: number) => setConfirmedAmounts(old => ({ ...old, [id]: amount })), approveDeposit, rejectingId, setRejectingId, reason, setReason, rejectDeposit };
}
