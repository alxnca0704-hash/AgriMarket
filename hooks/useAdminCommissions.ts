'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import { usePendingAction } from '@/hooks/usePendingAction';
import { COMMISSION_ACTION_KEYS } from '@/constants/commissions';
const listRef = makeFunctionReference<'query', Record<string, never>, AdminCommissionPayment[]>('commissions:listPendingPayments');
const overdueRef = makeFunctionReference<'query', { now: number }, AdminOverdueInvoice[]>('commissions:listOverdueInvoices');
const countRef = makeFunctionReference<'query', Record<string, never>, number>('commissions:pendingCount');
const approveRef = makeFunctionReference<'mutation', { paymentId: string; approvedAmount: number }, null>('commissions:approvePayment');
const rejectRef = makeFunctionReference<'mutation', { paymentId: string; reason: string }, null>('commissions:rejectPayment');
export interface AdminCommissionPayment { _id: string; amount: number; referenceNumber: string; createdAt: string; invoiceId: string; stallName: string; sellerName: string; invoice: { periodStart: string; periodEnd: string; remaining: number } | null }
export interface AdminOverdueInvoice { invoiceId: string; amount: number; daysOverdue: number; stallName: string }
export function useAdminCommissions() {
  const [now, setNow] = useState(0);
  useEffect(() => { const update = () => setNow(Date.now()); update(); const timer = window.setInterval(update, 60_000); return () => window.clearInterval(timer); }, []);
  const payments = useQuery(listRef, {}); const overdue = useQuery(overdueRef, { now }); const pendingCount = useQuery(countRef, {});
  const approve = useMutation(approveRef); const reject = useMutation(rejectRef); const actions = usePendingAction();
  const [amounts, setAmounts] = useState<Record<string, number>>({}); const [reasons, setReasons] = useState<Record<string, string>>({});
  return { payments, overdue, pendingCount: pendingCount ?? 0, isLoading: payments === undefined || overdue === undefined, error: payments instanceof Error ? payments.message : overdue instanceof Error ? overdue.message : null,
    amount: (item: AdminCommissionPayment) => amounts[item._id] ?? item.amount, setAmount: (id: string, value: number) => setAmounts(old => ({ ...old, [id]: value })),
    reason: (id: string) => reasons[id] ?? '', setReason: (id: string, value: string) => setReasons(old => ({ ...old, [id]: value })),
    approve: (item: AdminCommissionPayment) => actions.run(COMMISSION_ACTION_KEYS.approvePayment(item._id), () => approve({ paymentId: item._id, approvedAmount: amounts[item._id] ?? item.amount }), { success: 'Payment approved.', error: 'Could not approve payment.' }),
    reject: (item: AdminCommissionPayment) => actions.run(COMMISSION_ACTION_KEYS.rejectPayment(item._id), () => reject({ paymentId: item._id, reason: reasons[item._id] ?? '' }), { success: 'Payment rejected.', error: 'Could not reject payment.' }),
    isPending: actions.isPending,
  };
}
