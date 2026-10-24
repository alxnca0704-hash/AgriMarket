export const STALL_DEPOSIT_AMOUNT = 2000;
export const DEPOSIT_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export const DEPOSIT_ACTION_KEYS = {
  submit: 'deposit:submit',
  approve: (depositId: string) => `deposit:approve:${depositId}`,
  reject: (depositId: string) => `deposit:reject:${depositId}`,
} as const;
