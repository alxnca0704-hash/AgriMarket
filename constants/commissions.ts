/** Platform commission rate for COD accruals and GCash payouts. */
export const COMMISSION_RATE = 0.05;
export const GCASH_PAYOUT_ACTION_KEYS = {
  request: 'gcash-payout:request',
  adminPaid: (requestId: string) => `gcash-payout:paid:${requestId}`,
  adminReject: (requestId: string) => `gcash-payout:reject:${requestId}`,
} as const;
export const INVOICE_DUE_MS = 7 * 24 * 60 * 60 * 1000;
export const INVOICE_DAY = 'Monday';
export const MIN_INVOICE_AMOUNT = 50;
export const BLOCK_PAYOUT_WHEN_OVERDUE = false;

export const COMMISSION_RECEIVABLE_STATUS = {
  ACCRUED: 'accrued',
  INVOICED: 'invoiced',
  OVERDUE: 'overdue',
  PAID: 'paid',
  WAIVED: 'waived',
} as const;

export type CommissionReceivableStatus = (typeof COMMISSION_RECEIVABLE_STATUS)[keyof typeof COMMISSION_RECEIVABLE_STATUS];

export const COMMISSION_RECEIVABLE_STATUS_OPTIONS = [
  { value: COMMISSION_RECEIVABLE_STATUS.ACCRUED, label: 'Unbilled' },
  { value: COMMISSION_RECEIVABLE_STATUS.INVOICED, label: 'Invoiced' },
  { value: COMMISSION_RECEIVABLE_STATUS.OVERDUE, label: 'Overdue' },
  { value: COMMISSION_RECEIVABLE_STATUS.PAID, label: 'Paid' },
  { value: COMMISSION_RECEIVABLE_STATUS.WAIVED, label: 'Waived' },
] as const;

export const RECEIVABLES_PAGE_SIZE = 20;

export const COMMISSION_ACTION_KEYS = {
  submitPayment: (invoiceId: string) => `commission:submit:${invoiceId}`,
  approvePayment: (paymentId: string) => `commission:approve:${paymentId}`,
  rejectPayment: (paymentId: string) => `commission:reject:${paymentId}`,
} as const;
