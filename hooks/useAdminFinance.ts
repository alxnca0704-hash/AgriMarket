'use client';

import { useEffect, useState } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import type { Id } from '@/convex/_generated/dataModel';
import { FINANCE_EXPORT_NAMES, FINANCE_RECONCILIATION_KEY } from '@/constants/finance';
import { COD_FINANCE_STATUS_LABELS, GCASH_PAYOUT_STATUS_LABELS } from '@/constants/finance';
import { usePendingAction } from '@/hooks/usePendingAction';
import type {
  AdminFinanceResult,
  FinanceQueryArgs,
  StallFinanceResult,
  StallFinanceRow,
} from '@/types/finance';

const adminFinanceRef = makeFunctionReference<'query', FinanceQueryArgs, AdminFinanceResult>('finance:getAdminFinance');
const stallFinanceRef = makeFunctionReference<'query', FinanceQueryArgs & { stallId: Id<'stalls'> }, StallFinanceResult>('finance:getAdminFinanceStall');
const recordReconciliationRef = makeFunctionReference<
  'mutation',
  FinanceQueryArgs & { actualBalance: number },
  Id<'financeReconciliations'>
>('finance:recordReconciliation');

interface SelectedStall {
  id: Id<'stalls'>;
  name: string;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function useAdminFinance() {
  const { message } = App.useApp();
  const actions = usePendingAction();
  const [range, setRangeState] = useState<[string | null, string | null]>([null, null]);
  const [now, setNow] = useState(0);
  const [selectedStall, setSelectedStall] = useState<SelectedStall | null>(null);
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [actualBalance, setActualBalance] = useState('');
  const recordReconciliation = useMutation(recordReconciliationRef);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const args: FinanceQueryArgs = { from: range[0], to: range[1], now };
  const data = useQuery(adminFinanceRef, args);
  const stallDetail = useQuery(stallFinanceRef, selectedStall ? { ...args, stallId: selectedStall.id } : 'skip');

  const setRange = (value: [string | null, string | null]) => {
    setRangeState(value);
    setSelectedStall(null);
  };

  const exportCsv = (kind: 'cod' | 'gcash' | 'commission' | 'stalls' | 'reconciliations') => {
    if (!data) return;
    if (kind === 'cod') {
      downloadCsv(FINANCE_EXPORT_NAMES.cod, [
        ['Order ID', 'Stall', 'Sale date', 'Commission', 'Amount paid', 'Amount owed', 'Status', 'Invoice number', 'Paid at'],
        ...data.codRecords.map(row => [
          row.orderId, row.stallName, row.saleDate, row.commission, row.amountPaid, row.amountOwed,
          COD_FINANCE_STATUS_LABELS[row.status], row.invoiceNumber ?? '', row.paidAt ?? '',
        ]),
      ]);
      return;
    }
    if (kind === 'gcash') {
      downloadCsv(FINANCE_EXPORT_NAMES.gcash, [
        ['Order ID', 'Stall', 'Date', 'Order total', 'Net payout', 'Commission', 'Order status', 'Payout status', 'Payout reference', 'Refunded amount', 'Commission status', 'Commission collected at'],
        ...data.gcashRecords.map(row => [
          row.orderId, row.stallName, row.date, row.orderTotal, row.netPayout, row.commission, row.status,
          GCASH_PAYOUT_STATUS_LABELS[row.payoutStatus], row.payoutReference ?? '', row.refundedAmount,
          row.commissionStatus, row.commissionCollectedAt ?? '',
        ]),
      ]);
      return;
    }
    if (kind === 'commission') {
      const gcashRows = data.gcashRecords.filter(row => row.commissionStatus !== 'none');
      const codRows = data.codRecords.filter(row => row.amountPaid > 0);
      downloadCsv(FINANCE_EXPORT_NAMES.commission, [
        ['Source', 'Order ID', 'Stall', 'Date', 'Commission collected', 'Status', 'Collected at'],
        ...gcashRows.map(row => ['GCash', row.orderId, row.stallName, row.date, row.commission, row.commissionStatus, row.commissionCollectedAt ?? '']),
        ...codRows.map(row => ['COD', row.orderId, row.stallName, row.saleDate, row.amountPaid, row.status, row.paidAt ?? '']),
      ]);
      return;
    }
    if (kind === 'stalls') {
      downloadCsv(FINANCE_EXPORT_NAMES.stalls, [
        ['Stall', 'COD owed', 'COD overdue', 'GCash owed to seller', 'GCash paid out', 'GCash commission collected', 'COD commission collected', 'Total commission'],
        ...data.stalls.map(row => [
          row.stallName, row.codOwed, row.codOverdue, row.gcashOwedToSeller, row.gcashPaidOut,
          row.gcashCommissionCollected, row.codCommissionCollected, row.totalCommission,
        ]),
      ]);
      return;
    }
    downloadCsv(FINANCE_EXPORT_NAMES.reconciliations, [
      ['Recorded at', 'Admin', 'From', 'To', 'Actual balance', 'Expected balance', 'Difference'],
      ...data.reconciliations.map(row => [
        row.createdAt, row.adminEmail, row.from ?? '', row.to ?? '', row.actualBalance, row.expectedBalance, row.difference,
      ]),
    ]);
  };

  const submitReconciliation = async () => {
    const actual = Number(actualBalance);
    if (!actualBalance.trim() || !Number.isFinite(actual) || actual < 0) {
      message.error('Enter a valid actual GCash balance.');
      return false;
    }
    const result = await actions.run(
      FINANCE_RECONCILIATION_KEY,
      () => recordReconciliation({ actualBalance: actual, from: args.from, to: args.to, now }),
      { success: 'GCash reconciliation recorded.', error: 'Could not record the reconciliation.' }
    );
    if (result === 'success') {
      setReconciliationOpen(false);
      setActualBalance('');
      return true;
    }
    return false;
  };

  return {
    ...data,
    isLoading: data === undefined,
    error: data instanceof Error ? data.message : null,
    range,
    setRange,
    selectedStall,
    openStall: (row: StallFinanceRow) => setSelectedStall({ id: row.stallId as Id<'stalls'>, name: row.stallName }),
    closeStall: () => setSelectedStall(null),
    stallDetail,
    stallLoading: selectedStall !== null && stallDetail === undefined,
    stallError: stallDetail instanceof Error ? stallDetail.message : null,
    reconciliationOpen,
    openReconciliation: () => {
      setActualBalance(data ? String(data.gcash.expectedBalance) : '');
      setReconciliationOpen(true);
    },
    closeReconciliation: () => setReconciliationOpen(false),
    actualBalance,
    setActualBalance,
    submitReconciliation,
    isReconciliationPending: actions.isPending(FINANCE_RECONCILIATION_KEY),
    exportCsv,
  };
}
