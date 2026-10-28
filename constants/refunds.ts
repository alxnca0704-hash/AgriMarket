export const RETURN_REQUEST_WINDOW_MS = 24 * 60 * 60 * 1000;

export const RETURN_WINDOW_CLOSED_MESSAGE =
  'The 24-hour return window for this order has closed.';

export const COD_REFUND_BUYER_SHIP_MS = 3 * 24 * 60 * 60 * 1000;
export const COD_REFUND_REPAYMENT_DEADLINE_MS = 3 * 24 * 60 * 60 * 1000;
export const COD_REFUND_BUYER_RESPONSE_MS = 3 * 24 * 60 * 60 * 1000;
export const COD_REFUND_REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;
export const BLOCK_PAYOUT_WHEN_REFUND_OVERDUE = true;

export const COD_REFUND_METHOD_LABEL = "Seller's GCash";

export function normalizeGcashNumber(value: string): string {
  const compact = value.trim().replace(/[\s-]/g, '');
  if (/^09\d{9}$/.test(compact)) return compact;
  if (/^\+639\d{9}$/.test(compact)) return `0${compact.slice(3)}`;
  if (/^639\d{9}$/.test(compact)) return `0${compact.slice(2)}`;
  return compact;
}

export function isValidGcashNumber(value: string): boolean {
  return /^09\d{9}$/.test(normalizeGcashNumber(value));
}

export function maskGcashNumber(value: string | undefined): string {
  const normalized = value ? normalizeGcashNumber(value) : '';
  if (!normalized) return '';
  if (normalized.length <= 6) return normalized;
  return `${normalized.slice(0, 4)}${'*'.repeat(Math.max(0, normalized.length - 6))}${normalized.slice(-2)}`;
}
