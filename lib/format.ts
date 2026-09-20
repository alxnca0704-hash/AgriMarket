export const CURRENCY_SYMBOL = '₱';

export function formatPrice(value: number): string {
  return `${CURRENCY_SYMBOL}${value.toLocaleString('en-PH')}`;
}

export function formatUnitPrice(value: number, unit: string): string {
  return `${formatPrice(value)}/${unit}`;
}

export function formatDistance(km: number): string {
  return km >= 1 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

export function formatCount(value: number): string {
  if (value >= 10000) return `${Math.round(value / 1000)}K`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return value.toLocaleString('en-PH');
}