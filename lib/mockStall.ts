import { StallProfile } from '@/types/seller';
import { ASSET_ROUTES } from '@/constants/routes';

export const DEMO_SELLER_ID = 'sell-celso';
export const DEMO_SELLER_NAME = 'Celso Farm';

const STORAGE_KEY = 'agrimarket_stall';

export const DEMO_SELLER_STALL: StallProfile = {
  stallName: DEMO_SELLER_NAME,
  description:
    'Family-run highland farm in La Trinidad, Benguet. We grow cool-climate vegetables and strawberries with organic compost and daily harvests.',
  photoUrl: ASSET_ROUTES.logo,
  farmType: 'crops',
  location: {
    region: 'Cordillera Administrative Region (CAR)',
    province: 'Benguet',
    cityMunicipality: 'La Trinidad',
    barangay: 'Pico',
    streetBuilding: 'Km 6 La Trinidad Valley Road',
    postalCode: '2601',
  },
  deliveryFeePeso: 49,
  pickupAvailable: true,
  verification: {
    status: 'verified',
    idType: 'Barangay Clearance',
    idNumber: 'A-000512',
  },
  rating: 4.8,
  ratingCount: 214,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

function readStall(): StallProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StallProfile;
  } catch {
    return null;
  }
}

function writeStall(stall: StallProfile): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stall));
}

const stallListeners = new Set<() => void>();
let stallSnapshot: StallProfile | null = null;
let hasStoredStall = false;

export function getStall(): StallProfile {
  return readStall() ?? DEMO_SELLER_STALL;
}

export function getStallSnapshot(): StallProfile {
  if (stallSnapshot === null) {
    const stored = readStall();
    if (stored) {
      stallSnapshot = stored;
      hasStoredStall = true;
    } else {
      stallSnapshot = DEMO_SELLER_STALL;
    }
  }
  return stallSnapshot;
}

export function subscribeStall(listener: () => void): () => void {
  stallListeners.add(listener);
  return () => {
    stallListeners.delete(listener);
  };
}

function updateStallSnapshot(next: StallProfile): void {
  stallSnapshot = next;
  hasStoredStall = true;
  writeStall(next);
  stallListeners.forEach((listener) => listener());
}

export function saveStall(stall: StallProfile): void {
  const next: StallProfile = {
    ...stall,
    updatedAt: new Date().toISOString(),
  };
  updateStallSnapshot(next);
}

export function createStall(draft: StallProfile): StallProfile {
  const now = new Date().toISOString();
  const next: StallProfile = {
    ...draft,
    stallName: draft.stallName.trim(),
    createdAt: now,
    updatedAt: now,
  };
  updateStallSnapshot(next);
  return next;
}

export function hasStoredStallProfile(): boolean {
  return hasStoredStall || readStall() !== null;
}