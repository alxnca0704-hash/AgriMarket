'use client';

import { CommissionReceivablesPanel } from '@/components/commissions/CommissionReceivablesPanel';

export function AdminReceivablesView() {
  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
    <header><p className="text-xs font-medium uppercase tracking-wide text-stone-400">Platform finance</p><h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">Commission receivables</h1><p className="mt-1 text-sm text-stone-500">Read-only balances derived from commission accruals, invoices, and approved payments.</p></header>
    <CommissionReceivablesPanel isAdmin />
  </div>;
}
