export const ADMIN_PAYMENT_ACTIONS = {
  approve: 'adminPaymentApprove',
  reject: 'adminPaymentReject',
} as const;

export const ADMIN_PAYMENT_ACTION_KEYS = {
  approve: (paymentNote: string) => `${ADMIN_PAYMENT_ACTIONS.approve}:${paymentNote}`,
  reject: (paymentNote: string) => `${ADMIN_PAYMENT_ACTIONS.reject}:${paymentNote}`,
} as const;
