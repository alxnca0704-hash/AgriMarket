export const COMMISSION_RATE = 0.005;
export const INVOICE_DUE_MS = 7 * 24 * 60 * 60 * 1000;
export const INVOICE_DAY = 'Monday';
export const MIN_INVOICE_AMOUNT = 20;
export const BLOCK_PAYOUT_WHEN_OVERDUE = false;

export const COMMISSION_ACTION_KEYS = {
  submitPayment: (invoiceId: string) => `commission:submit:${invoiceId}`,
  approvePayment: (paymentId: string) => `commission:approve:${paymentId}`,
  rejectPayment: (paymentId: string) => `commission:reject:${paymentId}`,
} as const;
