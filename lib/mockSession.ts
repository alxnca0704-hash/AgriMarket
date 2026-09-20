import { AuthenticatedUser } from '@/types/auth';
import { ROLES } from '@/constants/roles';

const STORAGE_KEY = 'agrimarket_mock_user';

export const DEMO_BUYER: AuthenticatedUser = {
  id: 'demo-buyer',
  role: ROLES.BUYER,
  fullName: 'Demo Buyer',
  mobileNumber: '09171234567',
  email: 'demo.user@gmail.com',
  defaultAddressSummary:
    '142 Rizal St, Brgy. San Lorenzo, Makati City, Metro Manila, NCR 1229',
  createdAt: new Date().toISOString(),
};

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