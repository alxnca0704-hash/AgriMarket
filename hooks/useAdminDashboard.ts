'use client';

import { useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import { usePendingAction } from '@/hooks/usePendingAction';
import type { AdminDashboardArgs, AdminDashboardResult } from '@/types/adminDashboard';
import type { Id } from '@/convex/_generated/dataModel';

const dashboardRef = makeFunctionReference<'query', AdminDashboardArgs, AdminDashboardResult>('finance:getAdminDashboard');
const reconcileRef = makeFunctionReference<'mutation', { actualBalance: number; from: string | null; to: string | null; now: number }, Id<'financeReconciliations'>>('finance:recordReconciliation');

export function useAdminDashboard() {
  const { message } = App.useApp();
  const actions = usePendingAction();
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [range, setRange] = useState<[string | null, string | null]>([null, null]);
  const [now, setNow] = useState(() => Date.now());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actual, setActual] = useState('');
  const record = useMutation(reconcileRef);
  const data = useQuery(dashboardRef, { from: range[0], to: range[1], now, days });
  const submit = async () => {
    const amount = Number(actual);
    if (!actual.trim() || !Number.isFinite(amount) || amount < 0) { message.error('Enter a valid actual GCash balance.'); return; }
    const result = await actions.run('admin-dashboard-reconciliation', () => record({ actualBalance: amount, from: range[0], to: range[1], now }), { success: 'Balance recorded.', error: 'Could not record balance.' });
    if (result === 'success') setDrawerOpen(false);
  };
  return { data, isLoading: data === undefined, error: data instanceof Error ? data.message : null, retry: () => setNow(Date.now()), days, setDays, range, setRange, drawerOpen, setDrawerOpen, actual, setActual, submit, submitting: actions.isPending('admin-dashboard-reconciliation') };
}
