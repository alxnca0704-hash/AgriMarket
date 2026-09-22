import { DeliveryAddress } from '@/types/auth';

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

export function formatAddressSummary(address: DeliveryAddress): string {
  return `${address.streetBuilding}, Brgy. ${address.barangay}, ${address.cityMunicipality}, ${address.province}, ${address.region} ${address.postalCode}`;
}

export function formatOrderTime(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getProductImageUrl(url: string, w = 735, h = 919): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Inject Cloudinary fill transform so every image is exactly w×h, prevents inconsistent heights from varying source aspect
  // e.g. https://res.cloudinary.com/.../image/upload/v123/file.jpg → .../image/upload/c_fill,w_735,h_919,q_auto,f_auto/v123/file.jpg
  if (url.includes('/image/upload/')) {
    return url.replace('/image/upload/', `/image/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`);
  }
  return url;
}