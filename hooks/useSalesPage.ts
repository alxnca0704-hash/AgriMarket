'use client';

import { useState } from 'react';
import { App } from 'antd';
import { useConvex, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import type { Id } from '@/convex/_generated/dataModel';
import { SALES_PAGE_SIZE } from '@/constants/sales';
import type { SaleRecord, SalesQueryArgs, SalesQueryResult } from '@/types/sales';

const sellerSalesRef = makeFunctionReference<'query', SalesQueryArgs, SalesQueryResult>('sales:sellerSales');
const adminSalesRef = makeFunctionReference<'query', SalesQueryArgs, SalesQueryResult>('sales:adminSales');

export function useSalesPage(isAdmin: boolean) {
  const convex = useConvex();
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'gcash' | 'cod'>('all');
  const [saleStatus, setSaleStatus] = useState<'all' | 'counted' | 'refund-requested' | 'refunded'>('all');
  const [range, setRange] = useState<[string | null, string | null]>([null, null]);
  const [stallId, setStallId] = useState<Id<'stalls'> | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SaleRecord | null>(null);
  const [now] = useState(() => Date.now());
  const args = { search, paymentMethod, saleStatus, from: range[0], to: range[1], stallId: isAdmin ? stallId : null, page, pageSize: SALES_PAGE_SIZE, now };
  const sellerResult = useQuery(sellerSalesRef, isAdmin ? 'skip' : args);
  const adminResult = useQuery(adminSalesRef, isAdmin ? args : 'skip');
  const data = isAdmin ? adminResult : sellerResult;

  const updateFilter = (update: () => void) => { update(); setPage(1); };
  const exportCsv = async () => {
    try {
      const fetchPage = isAdmin ? adminSalesRef : sellerSalesRef;
      const first = await convex.query(fetchPage, { ...args, page: 1, pageSize: 100 });
      const rows = [...first.records];
      for (let currentPage = 2; rows.length < first.total; currentPage++) {
        const next = await convex.query(fetchPage, { ...args, page: currentPage, pageSize: 100 });
        rows.push(...next.records);
      }
      const header = ['Completed at', 'Order ID', 'Buyer', 'Stall', 'Items', 'Variants', 'Items subtotal', 'Delivery fee', 'Order total', 'Payment method', 'GCash reference', 'Sale status', 'Commission', 'Commission status', 'Invoice number', 'Payout reference', 'Refund amount', 'Refund method', 'Refund reference', 'Refund confirmed at'];
      const values = rows.map(row => [row.completedAt, row.orderId, row.buyerName, row.stallName, row.itemSummary, row.items.map(item => `${item.variantName ?? item.unit} x ${item.qty}`).join('; '), row.itemsSubtotal, row.deliveryFee, row.orderTotal, row.paymentMethod, row.gcashReference ?? '', row.saleStatus, row.commissionAmount ?? 'n/a', row.commissionStatus, row.invoiceNumber ?? '', row.payoutReference ?? '', row.refundAmount ?? '', row.refundMethod ?? '', row.refundReference ?? '', row.refundConfirmedAt ?? '']);
      const csv = [header, ...values].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = 'agrimarket-sales.csv'; link.click(); URL.revokeObjectURL(url);
    } catch (error) { message.error(error instanceof Error ? error.message : 'Could not export sales.'); }
  };

  return {
    ...data,
    isLoading: data === undefined,
    error: data instanceof Error ? data.message : null,
    search, setSearch: (value: string) => updateFilter(() => setSearch(value)),
    paymentMethod, setPaymentMethod: (value: typeof paymentMethod) => updateFilter(() => setPaymentMethod(value)),
    saleStatus, setSaleStatus: (value: typeof saleStatus) => updateFilter(() => setSaleStatus(value)),
    range, setRange: (value: [string | null, string | null]) => updateFilter(() => setRange(value)),
    stallId, setStallId: (value: string | null) => updateFilter(() => setStallId(value as Id<'stalls'> | null)),
    page, setPage, selected, setSelected, exportCsv,
  };
}
