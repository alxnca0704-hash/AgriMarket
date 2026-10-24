'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import { usePendingAction } from '@/hooks/usePendingAction';
import { DEPOSIT_ACTION_KEYS } from '@/constants/deposits';
import type { DepositRecord, DepositStallRow, DepositSummary, DepositStatus } from '@/types/deposit';

type Tab = DepositStatus | 'all';
type PageData = { page: DepositRecord[]; isDone: boolean; continueCursor: string };
type Detail = { deposit: DepositRecord; stall: { stallName: string; depositPaidAmount?: number; depositDeadline?: number } | null; seller: { fullName: string } | null; attempts: DepositRecord[]; duplicateApproved: boolean } | null;
const listRef = makeFunctionReference<'query', { status: Tab; search: string; from: string | null; to: string | null; paginationOpts: { numItems: number; cursor: string | null } }, PageData>('deposits:listAdmin');
const summaryRef = makeFunctionReference<'query', { now: number }, DepositSummary>('deposits:getAdminSummary');
const stallsRef = makeFunctionReference<'query', { status: 'all' | 'unpaid' | 'partial' | 'paid'; now: number }, DepositStallRow[]>('deposits:listStalls');
const detailRef = makeFunctionReference<'query', { depositId: string }, Detail>('deposits:getAdminDetail');
const approveRef = makeFunctionReference<'mutation', { depositId: string; approvedAmount: number; overrideReason?: string }, null>('deposits:approve');
const rejectRef = makeFunctionReference<'mutation', { depositId: string; reason: string }, null>('deposits:reject');

export function useAdminDeposits() {
  const actions = usePendingAction();
  const [now, setNow] = useState(0);
  useEffect(() => { const refresh = () => setNow(Date.now()); refresh(); const timer = window.setInterval(refresh, 60_000); return () => window.clearInterval(timer); }, []);
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const cursor = cursorStack[cursorStack.length - 1] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stallStatus, setStallStatus] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [confirmedAmounts, setConfirmedAmounts] = useState<Record<string, number>>({});
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});
  const queryArgs = useMemo(() => ({ status: tab, search, from, to, paginationOpts: { numItems: 20, cursor } }), [tab, search, from, to, cursor]);
  const records = useQuery(listRef, queryArgs);
  const summary = useQuery(summaryRef, { now });
  const stalls = useQuery(stallsRef, { status: stallStatus, now });
  const detail = useQuery(detailRef, selectedId ? { depositId: selectedId } : 'skip');
  const approve = useMutation(approveRef);
  const reject = useMutation(rejectRef);
  const approveDeposit = (item: DepositRecord) => actions.run(DEPOSIT_ACTION_KEYS.approve(item._id), () => approve({ depositId: item._id, approvedAmount: confirmedAmounts[item._id] ?? item.amount, ...(overrideReasons[item._id] ? { overrideReason: overrideReasons[item._id] } : {}) }), { success: 'Deposit approved.', error: 'Could not approve deposit.' });
  const rejectDeposit = () => rejectingId && actions.run(DEPOSIT_ACTION_KEYS.reject(rejectingId), () => reject({ depositId: rejectingId, reason }), { success: 'Deposit rejected.', error: 'Could not reject deposit.' }).then(result => { if (result === 'success') { setRejectingId(null); setReason(''); } });
  const resetCursor = () => setCursorStack([null]);
  return {
    tab, setTab: (value: Tab) => { setTab(value); resetCursor(); }, search, setSearch: (value: string) => { setSearch(value); resetCursor(); },
    from, setFrom: (value: string | null) => { setFrom(value); resetCursor(); }, to, setTo: (value: string | null) => { setTo(value); resetCursor(); },
    records, summary, stalls, stallStatus, setStallStatus, isLoading: records === undefined || summary === undefined || stalls === undefined,
    error: [records, summary, stalls].find(value => value instanceof Error) instanceof Error ? ([records, summary, stalls].find(value => value instanceof Error) as Error).message : null,
    nextPage: () => records && !records.isDone && setCursorStack(stack => [...stack, records.continueCursor]), previousPage: () => setCursorStack(stack => stack.length > 1 ? stack.slice(0, -1) : stack), cursor,
    selectedId, setSelectedId, detail, confirmedAmounts, setConfirmedAmount: (id: string, amount: number) => setConfirmedAmounts(old => ({ ...old, [id]: amount })),
    overrideReasons, setOverrideReason: (id: string, value: string) => setOverrideReasons(old => ({ ...old, [id]: value })), approveDeposit,
    rejectingId, setRejectingId, reason, setReason, rejectDeposit, isPending: actions.isPending,
  };
}
