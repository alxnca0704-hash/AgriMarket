export const SALE_STATUS = {
  COUNTED: 'counted',
  REFUND_REQUESTED: 'refund-requested',
  REFUNDED: 'refunded',
} as const;

export type SaleStatus = (typeof SALE_STATUS)[keyof typeof SALE_STATUS];

export const SALE_STATUS_OPTIONS = [
  { value: SALE_STATUS.COUNTED, label: 'Counted' },
  { value: SALE_STATUS.REFUND_REQUESTED, label: 'Refund requested' },
  { value: SALE_STATUS.REFUNDED, label: 'Refunded' },
] as const;

export const SALES_PAGE_SIZE = 20;
