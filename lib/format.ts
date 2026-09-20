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