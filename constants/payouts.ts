export const PAYOUT_DAY = 'Sunday' as const;
export const PAYOUT_TIMEZONE = 'Asia/Manila' as const;
export const MIN_PAYOUT_AMOUNT = 0;
export function getNetPayoutAmount(order: {
  subtotal: number;
  deliveryFee: number;
  commissionAmount?: number;
  netPayoutAmount?: number;
}): number {
  if (order.netPayoutAmount !== undefined) return order.netPayoutAmount;
  const commission = order.commissionAmount ?? Math.round(order.subtotal * 0.05 * 100) / 100;
  return Math.round((order.subtotal + order.deliveryFee - commission) * 100) / 100;
}
export const PAYOUT_ACTION_KEYS = {
  request: 'gcash-payout:request',
  cancel: (requestId: string) => `gcash-payout:cancel:${requestId}`,
} as const;

export function isPayoutDay(now: Date | number = new Date()): boolean {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: PAYOUT_TIMEZONE }).format(now instanceof Date ? now : new Date(now)) === PAYOUT_DAY;
}

export function nextPayoutDate(now: Date | number = new Date()): Date {
  const current = now instanceof Date ? now : new Date(now);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PAYOUT_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(current);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
  const manilaMidnightUtc = Date.UTC(part('year'), part('month') - 1, part('day')) - 8 * 60 * 60 * 1000;
  const weekday = new Date(manilaMidnightUtc).getUTCDay();
  const days = (7 - weekday) % 7 || 7;
  return new Date(manilaMidnightUtc + days * 86400000);
}

export function payoutBatchWeek(now: Date | number = new Date()): string {
  const date = now instanceof Date ? now : new Date(now);
  const manilaDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const day = manilaDate.getUTCDay() || 7;
  manilaDate.setUTCDate(manilaDate.getUTCDate() + 4 - day);
  const year = manilaDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((manilaDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}
