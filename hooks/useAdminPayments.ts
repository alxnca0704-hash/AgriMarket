'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePendingAction } from '@/hooks/usePendingAction';
import { ADMIN_PAYMENT_ACTION_KEYS } from '@/constants/payments';

export function useAdminPayments() {
  const { run, isPending } = usePendingAction();
  const reviewMutation = useMutation(api.admin.reviewGcashPayment);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [approvePrompt, setApprovePrompt] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const data = useQuery(api.admin.listAdminGcashPayments, { status, search, ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}), ...(to ? { to: new Date(`${to}T23:59:59`).toISOString() } : {}), page, pageSize: 20 });
  const exportData = useQuery(api.admin.listAdminGcashPayments, { status, search, ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}), ...(to ? { to: new Date(`${to}T23:59:59`).toISOString() } : {}), page: 1, pageSize: 1000 });
  const act = async (paymentNote: string, decision: 'paid' | 'rejected') => {
    const key = decision === 'paid' ? ADMIN_PAYMENT_ACTION_KEYS.approve(paymentNote) : ADMIN_PAYMENT_ACTION_KEYS.reject(paymentNote);
    const result = await run(key, () => reviewMutation({ paymentNote, decision, ...(decision === 'paid' ? { ...(overrideReason.trim() ? { duplicateOverrideReason: overrideReason.trim() } : {}) } : { reason: reason.trim() }) }), { success: decision === 'paid' ? 'Payment approved.' : 'Payment rejected; buyer can resubmit.', error: 'Could not review payment.' });
    if (result === 'success') { setRejecting(null); setApprovePrompt(null); setReason(''); setOverrideReason(''); }
  };
  return {
    data, exportData, isLoading: data === undefined, error: data instanceof Error ? data.message : null,
    status, setStatus: (value: typeof status) => { setStatus(value); setPage(1); },
    search, setSearch: (value: string) => { setSearch(value); setPage(1); },
    from, setFrom: (value: string) => { setFrom(value); setPage(1); },
    to, setTo: (value: string) => { setTo(value); setPage(1); }, page, setPage,
    selected, setSelected, rejecting, setRejecting, reason, setReason,
    approvePrompt, setApprovePrompt, overrideReason, setOverrideReason,
    isPending: (note: string, decision: 'paid' | 'rejected') => isPending(decision === 'paid' ? ADMIN_PAYMENT_ACTION_KEYS.approve(note) : ADMIN_PAYMENT_ACTION_KEYS.reject(note)),
    approve: (note: string) => act(note, 'paid'), reject: (note: string) => act(note, 'rejected'),
  };
}
