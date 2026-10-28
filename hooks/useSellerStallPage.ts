'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { APP_ROUTES } from '@/constants/routes';
import { isLegacySellerStallTab, parseSellerStallTab, type SellerStallTab } from '@/constants/sellerStall';
import { formatOrderId, formatPrice } from '@/lib/format';
import { useSellerCommissions } from '@/hooks/useSellerCommissions';
import { useSellerDeposit } from '@/hooks/useSellerDeposit';
import { useSellerEarnings } from '@/hooks/useSellerEarnings';
import { useSellerFinance } from '@/hooks/useSellerFinance';
import { useSellerStall } from '@/hooks/useSellerStall';
import { useSalesPage } from '@/hooks/useSalesPage';
import type { SalesQueryResult } from '@/types/sales';

export interface SellerActivityItem {
  id: string;
  type: 'sale' | 'payout' | 'commission' | 'deposit';
  title: string;
  detail: string;
  at: string;
}

export interface SellerAttentionItem {
  key: string;
  title: string;
  detail: string;
  tab: SellerStallTab;
  tone: 'error' | 'warning' | 'info';
}

export interface SellerStallPageResult {
  tab: SellerStallTab;
  setTab: (tab: SellerStallTab) => void;
  stall: ReturnType<typeof useSellerStall>;
  finance: ReturnType<typeof useSellerFinance>;
  earnings: ReturnType<typeof useSellerEarnings>;
  commissions: ReturnType<typeof useSellerCommissions>;
  sales: ReturnType<typeof useSalesPage>;
  deposit: ReturnType<typeof useSellerDeposit>;
  recentSales: SalesQueryResult | undefined;
  activity: SellerActivityItem[];
  attention: SellerAttentionItem[];
  counts: {
    unpaidInvoices: number;
    payoutReady: number;
    depositRemaining: number;
    actionCount: number;
    sales: number;
    payouts: number;
    platform: number;
    deposit: number;
  };
  isLoading: boolean;
  error: string | null;
}

export function useSellerStallPage(): SellerStallPageResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = parseSellerStallTab(rawTab);
  const stall = useSellerStall();
  const finance = useSellerFinance();
  const earnings = useSellerEarnings();
  const commissions = useSellerCommissions();
  const sales = useSalesPage(false);
  const deposit = useSellerDeposit();
  const [recentNow] = useState(() => Date.now());

  useEffect(() => {
    if (isLegacySellerStallTab(rawTab)) {
      router.replace(APP_ROUTES.sellerStallTab('platform'), { scroll: false });
    }
  }, [rawTab, router]);

  const recentSales = useQuery(
    api.sales.sellerSales,
    stall.stallId
      ? {
          search: '',
          paymentMethod: 'all',
          saleStatus: 'all',
          from: null,
          to: null,
          stallId: stall.stallId,
          page: 1,
          pageSize: 8,
          now: recentNow,
        }
      : 'skip'
  );

  const invoices = useMemo(
    () => commissions.data?.invoices ?? [],
    [commissions.data?.invoices]
  );
  const payoutRequests = useMemo(() => {
    const payoutData = earnings.payoutData && 'requests' in earnings.payoutData ? earnings.payoutData : null;
    return payoutData?.requests ?? [];
  }, [earnings.payoutData]);
  const payableInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.remaining > 0 && !invoice.pending),
    [invoices]
  );
  const cod = finance.finance?.cod;
  const gcash = finance.finance?.gcash;
  const codRefundBlocked = earnings.payoutData && 'codRefundBlocked' in earnings.payoutData
    ? earnings.payoutData.codRefundBlocked
    : false;
  const codRefundOverdueAmount = earnings.payoutData && 'codRefundOverdueAmount' in earnings.payoutData
    ? earnings.payoutData.codRefundOverdueAmount
    : 0;
  const unpaidInvoices = payableInvoices.length;
  const payoutReady = gcash?.payoutReady ?? 0;
  const depositRemaining = deposit.remaining;
  const depositNeedsAction = depositRemaining > 0 && !deposit.pending;

  const activity = useMemo<SellerActivityItem[]>(() => {
    const rows: SellerActivityItem[] = [];
    for (const sale of recentSales?.records ?? []) {
      rows.push({
        id: `sale-${sale.orderId}`,
        type: 'sale',
        title: 'Sale recorded',
        detail: `${formatOrderId(sale.orderId)} · ${formatPrice(sale.orderTotal)} · ${sale.paymentMethod === 'gcash' ? 'GCash' : 'COD'}`,
        at: sale.completedAt,
      });
    }
    for (const request of payoutRequests) {
      rows.push({
        id: `payout-${request._id}`,
        type: 'payout',
        title: request.status === 'paid' ? 'Payout sent' : request.status === 'rejected' ? 'Payout rejected' : 'Payout requested',
        detail: `${formatPrice(request.amount)} · ${request.orderCount} order${request.orderCount === 1 ? '' : 's'}`,
        at: request.requestedAt,
      });
    }
    for (const invoice of invoices) {
      rows.push({
        id: `invoice-${invoice._id}`,
        type: 'commission',
        title: invoice.pending ? 'Commission payment under review' : 'Commission invoice issued',
        detail: `${formatPrice(invoice.remaining > 0 ? invoice.remaining : invoice.amount)} · ${invoice.pending ? 'Awaiting admin review' : invoice.remaining > 0 ? 'Payment due' : 'Paid'}`,
        at: invoice.periodEnd,
      });
    }
    for (const submission of deposit.data?.submissions ?? []) {
      rows.push({
        id: `deposit-${submission._id}`,
        type: 'deposit',
        title: `Deposit ${submission.status}`,
        detail: `${formatPrice(submission.approvedAmount ?? submission.amount)} · ${submission.referenceNumber}`,
        at: submission.reviewedAt ?? submission.submittedAt ?? submission.createdAt,
      });
    }
    return rows
      .filter((row) => Number.isFinite(Date.parse(row.at)))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8);
  }, [deposit.data?.submissions, invoices, payoutRequests, recentSales?.records]);

  const attention = useMemo<SellerAttentionItem[]>(() => {
    const rows: SellerAttentionItem[] = [];
    if ((cod?.overdue ?? 0) > 0) {
      rows.push({
        key: 'overdue-commission',
        title: 'Commission overdue',
        detail: `${formatPrice(cod?.overdue ?? 0)} past due`,
        tab: 'platform',
        tone: 'error',
      });
    } else if (unpaidInvoices > 0) {
      rows.push({
        key: 'commission-due',
        title: 'Commission invoice due',
        detail: `${formatPrice(payableInvoices.reduce((sum, invoice) => sum + invoice.remaining, 0))} to pay`,
        tab: 'platform',
        tone: 'warning',
      });
    }
    if ((cod?.unbilled ?? 0) > 0) {
      rows.push({
        key: 'unbilled-commission',
        title: 'COD commission accruing',
        detail: `${formatPrice(cod?.unbilled ?? 0)} unbilled`,
        tab: 'platform',
        tone: 'info',
      });
    }
    if (codRefundBlocked) {
      rows.push({
        key: 'cod-refund-overdue',
        title: 'COD refund overdue',
        detail: `${formatPrice(codRefundOverdueAmount)} must be refunded to unblock payouts`,
        tab: 'payouts',
        tone: 'error',
      });
    } else if (payoutReady > 0) {
      rows.push({
        key: 'payout-ready',
        title: 'GCash earnings ready',
        detail: `${formatPrice(payoutReady)} can be requested`,
        tab: 'payouts',
        tone: 'info',
      });
    }
    if (depositNeedsAction) {
      rows.push({
        key: 'deposit-remaining',
        title: 'Stall deposit incomplete',
        detail: `${formatPrice(depositRemaining)} remaining`,
        tab: 'deposit',
        tone: deposit.deadlineDaysLeft <= 3 ? 'error' : 'warning',
      });
    }
    return rows.slice(0, 5);
  }, [cod?.overdue, cod?.unbilled, codRefundBlocked, codRefundOverdueAmount, deposit.deadlineDaysLeft, depositNeedsAction, depositRemaining, payableInvoices, payoutReady, unpaidInvoices]);

  const error = stall.error
    ?? finance.financeError
    ?? earnings.error
    ?? commissions.error
    ?? sales.error
    ?? deposit.error;
  const isLoading = stall.isLoading
    || finance.financeLoading
    || earnings.isLoading
    || commissions.isLoading
    || sales.isLoading
    || deposit.isLoading;

  return {
    tab,
    setTab: (next) => {
      if (next === tab) return;
      router.push(APP_ROUTES.sellerStallTab(next), { scroll: false });
    },
    stall,
    finance,
    earnings,
    commissions,
    sales,
    deposit,
    recentSales,
    activity,
    attention,
    counts: {
      unpaidInvoices,
      payoutReady,
      depositRemaining: depositNeedsAction ? 1 : 0,
      actionCount: (unpaidInvoices > 0 ? 1 : 0) + (payoutReady > 0 || codRefundBlocked ? 1 : 0) + (depositNeedsAction ? 1 : 0),
      sales: 0,
      payouts: payoutReady > 0 || codRefundBlocked ? 1 : 0,
      platform: unpaidInvoices,
      deposit: depositNeedsAction ? 1 : 0,
    },
    isLoading,
    error,
  };
}
