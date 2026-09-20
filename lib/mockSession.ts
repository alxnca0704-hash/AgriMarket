import { AuthenticatedUser, DeliveryAddress } from '@/types/auth';
import { ROLES } from '@/constants/roles';
import { formatAddressSummary } from '@/lib/format';

const STORAGE_KEY = 'agrimarket_mock_user';

export const DEMO_DELIVERY_ADDRESSES: DeliveryAddress[] = [
  {
    label: 'Home',
    receiverName: 'Demo Buyer',
    receiverPhone: '09171234567',
    region: 'National Capital Region (NCR)',
    province: 'Metro Manila',
    cityMunicipality: 'Makati City',
    barangay: 'San Lorenzo',
    streetBuilding: '142 Rizal St',
    postalCode: '1229',
  },
  {
    label: 'Work',
    receiverName: 'Demo Buyer',
    receiverPhone: '09171234567',
    region: 'National Capital Region (NCR)',
    province: 'Metro Manila',
    cityMunicipality: 'Taguig City',
    barangay: 'Fort Bonifacio',
    streetBuilding: '5th Ave, Net Park Building, BGC',
    postalCode: '1634',
  },
  {
    label: 'Farm / Warehouse',
    receiverName: 'Demo Buyer',
    receiverPhone: '09171234567',
    region: 'Region IV-A (CALABARZON)',
    province: 'Laguna',
    cityMunicipality: 'City of Santa Rosa',
    barangay: 'Balibago',
    streetBuilding: 'Paseo de Santa Rosa, Balibago',
    postalCode: '4026',
  },
];

export const DEMO_BUYER: AuthenticatedUser = {
  id: 'demo-buyer',
  role: ROLES.BUYER,
  fullName: 'Demo Buyer',
  mobileNumber: '09171234567',
  email: 'demo.user@gmail.com',
  defaultAddressSummary:
    '142 Rizal St, Brgy. San Lorenzo, Makati City, Metro Manila, NCR 1229',
  deliveryAddress: DEMO_DELIVERY_ADDRESSES[0],
  deliveryAddresses: DEMO_DELIVERY_ADDRESSES,
  createdAt: new Date().toISOString(),
};

export function getDeliveryAddresses(user: AuthenticatedUser): DeliveryAddress[] {
  if (Array.isArray(user.deliveryAddresses) && user.deliveryAddresses.length > 0) {
    return user.deliveryAddresses;
  }
  if (user.deliveryAddress) return [user.deliveryAddress];
  return [];
}

export function isSameAddress(a: DeliveryAddress, b: DeliveryAddress): boolean {
  return (
    (a.label ?? '') === (b.label ?? '') &&
    a.receiverName === b.receiverName &&
    a.receiverPhone === b.receiverPhone &&
    a.region === b.region &&
    a.province === b.province &&
    a.cityMunicipality === b.cityMunicipality &&
    a.barangay === b.barangay &&
    a.streetBuilding === b.streetBuilding &&
    a.postalCode === b.postalCode
  );
}

export function getDefaultAddressIndex(user: AuthenticatedUser): number {
  const addresses = getDeliveryAddresses(user);
  if (addresses.length === 0) return 0;
  const def = user.deliveryAddress;
  if (!def) return 0;
  const index = addresses.findIndex((a) => isSameAddress(a, def));
  return index >= 0 ? index : 0;
}

export function getSessionUser(): AuthenticatedUser {
  return getMockUser() ?? DEMO_BUYER;
}

export function getMockUser(): AuthenticatedUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthenticatedUser;
  } catch {
    return null;
  }
}

export function saveMockUser(user: AuthenticatedUser): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearMockUser(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

const userListeners = new Set<() => void>();
let userSnapshot: AuthenticatedUser | null = null;

export function getSessionUserSnapshot(): AuthenticatedUser {
  if (userSnapshot === null) userSnapshot = getMockUser() ?? DEMO_BUYER;
  return userSnapshot;
}

export function subscribeSessionUser(listener: () => void): () => void {
  userListeners.add(listener);
  return () => {
    userListeners.delete(listener);
  };
}

export function updateSessionUser(user: AuthenticatedUser): void {
  userSnapshot = user;
  saveMockUser(user);
  userListeners.forEach((listener) => listener());
}

export function persistUserAddresses(
  user: AuthenticatedUser,
  addresses: DeliveryAddress[],
  defaultIndex: number
): void {
  const def = addresses[defaultIndex] ?? addresses[0];
  updateSessionUser({
    ...user,
    deliveryAddresses: addresses,
    deliveryAddress: def ?? undefined,
    defaultAddressSummary: def ? formatAddressSummary(def) : '',
  });
}