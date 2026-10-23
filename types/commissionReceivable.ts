import type { CommissionReceivableStatus } from '@/constants/commissions';
import type { Id } from '@/convex/_generated/dataModel';

export interface ReceivableQueryArgs extends Record<string, unknown> {
  search: string;
  status: 'all' | CommissionReceivableStatus;
  from: string | null;
  to: string | null;
  stallId: Id<'stalls'> | null;
  page: number;
  pageSize: number;
  now: number;
}

export interface CommissionReceivable {
  accrualId: string;
  orderId: string;
  saleDate: string;
  itemsSummary: string;
  itemsSubtotal: number;
  commission: number;
  amountPaid: number;
  amountOwed: number;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceDueAt: number | null;
  status: CommissionReceivableStatus;
  paymentReference: string | null;
  paymentId: string | null;
  paymentAmount: number | null;
  paidAt: string | null;
  invoiceAmount: number | null;
  invoicePaidAmount: number | null;
  stallId: string;
  stallName: string;
}

export interface CommissionReceivableSummary {
  totalOwed: number;
  unbilled: number;
  invoiced: number;
  overdue: number;
  paid: number;
  waived: number;
  collectedToday: number;
  collectedThisWeek: number;
  collectedThisMonth: number;
}

export interface StallReceivableSummary {
  stallId: string;
  stallName: string;
  unbilled: number;
  invoiced: number;
  overdue: number;
  collected: number;
  totalOwed: number;
  oldestOverdueAt: string | null;
}

export interface ReceivablesQueryResult {
  records: CommissionReceivable[];
  total: number;
  summary: CommissionReceivableSummary;
  stalls: StallReceivableSummary[];
}
