'use client';

import { useEffect, useState } from 'react';
import { App } from 'antd';
import { useConvex, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import type { Id } from '@/convex/_generated/dataModel';
import { RECEIVABLES_PAGE_SIZE } from '@/constants/commissions';
import type { ReceivableQueryArgs, ReceivablesQueryResult } from '@/types/commissionReceivable';

const sellerReceivablesRef = makeFunctionReference<'query', ReceivableQueryArgs, ReceivablesQueryResult>('commissions:getSellerReceivables');
const adminReceivablesRef = makeFunctionReference<'query', ReceivableQueryArgs, ReceivablesQueryResult>('commissions:getAdminReceivables');

export function useCommissionReceivables(isAdmin: boolean) {
  const convex = useConvex();
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReceivableQueryArgs['status']>('all');
  const [range, setRange] = useState<[string | null, string | null]>([null, null]);
  const [stallId, setStallId] = useState<Id<'stalls'> | null>(null);
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const args: ReceivableQueryArgs = { search, status, from: range[0], to: range[1], stallId: isAdmin ? stallId : null, page, pageSize: RECEIVABLES_PAGE_SIZE, now };
  const sellerData = useQuery(sellerReceivablesRef, isAdmin ? 'skip' : args);
  const adminData = useQuery(adminReceivablesRef, isAdmin ? args : 'skip');
  const data = isAdmin ? adminData : sellerData;
  const updateFilter = (update: () => void) => { update(); setPage(1); };

  const exportCsv = async () => {
    try {
      const queryRef = isAdmin ? adminReceivablesRef : sellerReceivablesRef;
      const first = await convex.query(queryRef, { ...args, page: 1, pageSize: 100 });
      const rows = [...first.records];
      for (let nextPage = 2; rows.length < first.total; nextPage++) {
        const next = await convex.query(queryRef, { ...args, page: nextPage, pageSize: 100 });
        rows.push(...next.records);
      }
      const headings = ['Order ID', 'Sale date', 'Order items', 'Items subtotal', 'Commission', 'Invoice number', 'Status', 'Payment reference', 'Paid date'];
      const csv = [headings, ...rows.map(row => [row.orderId, row.saleDate, row.itemsSummary, row.itemsSubtotal, row.commission, row.invoiceNumber ?? '', row.status, row.paymentReference ?? '', row.paidAt ?? ''])]
        .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = 'agrimarket-commission-receivables.csv'; link.click(); URL.revokeObjectURL(url);
    } catch (error) { message.error(error instanceof Error ? error.message : 'Could not export receivables.'); }
  };

  return {
    ...data,
    isLoading: data === undefined,
    error: data instanceof Error ? data.message : null,
    search, setSearch: (value: string) => updateFilter(() => setSearch(value)),
    status, setStatus: (value: ReceivableQueryArgs['status']) => updateFilter(() => setStatus(value)),
    range, setRange: (value: [string | null, string | null]) => updateFilter(() => setRange(value)),
    stallId, setStallId: (value: string | null) => updateFilter(() => setStallId(value as Id<'stalls'> | null)),
    page, setPage, exportCsv,
  };
}
