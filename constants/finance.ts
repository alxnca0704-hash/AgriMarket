import type { CodFinanceStatus, GcashCommissionStatus, GcashPayoutStatus } from '@/types/finance';

export const COD_FINANCE_STATUS_LABELS: Record<CodFinanceStatus, string> = {
  accrued: 'Unbilled',
  invoiced: 'Invoiced',
  overdue: 'Overdue',
  paid: 'Paid',
  waived: 'Waived',
};

export const COD_FINANCE_STATUS_COLORS: Record<CodFinanceStatus, string> = {
  accrued: 'default',
  invoiced: 'processing',
  overdue: 'error',
  paid: 'success',
  waived: 'warning',
};

export const GCASH_PAYOUT_STATUS_LABELS: Record<GcashPayoutStatus, string> = {
  'not-requested': 'Held for seller',
  requested: 'Payout requested',
  paid: 'Paid out',
  hold: 'On hold',
  refunded: 'Refunded',
  cancelled: 'Needs refund',
};

export const GCASH_PAYOUT_STATUS_COLORS: Record<GcashPayoutStatus, string> = {
  'not-requested': 'processing',
  requested: 'warning',
  paid: 'success',
  hold: 'default',
  refunded: 'error',
  cancelled: 'error',
};

export const GCASH_COMMISSION_STATUS_LABELS: Record<GcashCommissionStatus, string> = {
  pending: 'Pending',
  collected: 'Collected',
  reversed: 'Reversed',
  none: 'None',
};

export const FINANCE_EXPORT_NAMES = {
  cod: 'agrimarket-cod-commissions.csv',
  gcash: 'agrimarket-gcash-finance.csv',
  commission: 'agrimarket-platform-commissions.csv',
  stalls: 'agrimarket-finance-per-stall.csv',
  reconciliations: 'agrimarket-gcash-reconciliations.csv',
} as const;

export const FINANCE_RECONCILIATION_KEY = 'finance-reconciliation';
