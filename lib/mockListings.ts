import { SellerListing } from '@/types/seller';
import { MOCK_CATALOG } from '@/lib/mockCatalog';
import { DEMO_SELLER_ID, getStallSnapshot } from '@/lib/mockStall';
import { emitSellerNotification } from '@/lib/mockNotifications';
import { LOW_STOCK_THRESHOLD } from '@/constants/products';

const STORAGE_KEY = 'agrimarket_seller_listings';
const EMPTY_LISTINGS: SellerListing[] = [];

function seedListings(): SellerListing[] {
  const now = new Date().toISOString();
  return MOCK_CATALOG.products
    .filter((p) => p.sellerId === DEMO_SELLER_ID)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      unit: p.unit as SellerListing['unit'],
      imageUrl: p.imageUrl,
      imageUrls: p.images,
      stockQty: p.stockQty,
      soldCount: p.soldCount,
      harvestDate: p.harvestDate,
      expiryDate: p.harvestDate,
      description: p.description,
      isActive: p.stockQty > 0,
      createdAt: now,
      updatedAt: now,
    }));
}

function readListings(): SellerListing[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SellerListing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const listingsListeners = new Set<() => void>();
let listingsSnapshot: SellerListing[] | null = null;

export function getListingsSnapshot(): SellerListing[] {
  if (listingsSnapshot === null) {
    const stored = readListings();
    listingsSnapshot = stored.length > 0 ? stored : seedListings();
  }
  return listingsSnapshot;
}

export function getEmptyListingsSnapshot(): SellerListing[] {
  return EMPTY_LISTINGS;
}

export function subscribeListings(listener: () => void): () => void {
  listingsListeners.add(listener);
  return () => {
    listingsListeners.delete(listener);
  };
}

function updateListingsSnapshot(next: SellerListing[]): void {
  listingsSnapshot = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listingsListeners.forEach((listener) => listener());
}

function makeListingId(): string {
  return `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export type SellerListingDraft = Omit<
  SellerListing,
  'id' | 'soldCount' | 'createdAt' | 'updatedAt'
>;

export function createListing(draft: SellerListingDraft): SellerListing {
  const now = new Date().toISOString();
  const item: SellerListing = {
    ...draft,
    id: makeListingId(),
    soldCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  updateListingsSnapshot([item, ...getListingsSnapshot()]);
  return item;
}

export function updateListing(
  id: string,
  patch: Partial<Omit<SellerListing, 'id' | 'soldCount' | 'createdAt'>>
): void {
  const next = getListingsSnapshot().map((l) =>
    l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l
  );
  updateListingsSnapshot(next);
}

export function toggleListingActive(id: string): void {
  const listing = getListingsSnapshot().find((l) => l.id === id);
  if (!listing) return;
  updateListing(id, { isActive: !listing.isActive });
}

export function setListingsOutOfStock(ids: string[]): void {
  const idsSet = new Set(ids);
  const next = getListingsSnapshot().map((l) =>
    idsSet.has(l.id) ? { ...l, isActive: false, stockQty: 0, updatedAt: new Date().toISOString() } : l
  );
  updateListingsSnapshot(next);
}

export function deleteListings(ids: string[]): void {
  const idsSet = new Set(ids);
  updateListingsSnapshot(getListingsSnapshot().filter((l) => !idsSet.has(l.id)));
}

export function isLowStock(listing: SellerListing): boolean {
  return listing.stockQty > 0 && listing.stockQty <= LOW_STOCK_THRESHOLD;
}

export function getLowStockListings(): SellerListing[] {
  return getListingsSnapshot().filter((l) => l.isActive && isLowStock(l));
}

export function getActiveListings(): SellerListing[] {
  return getListingsSnapshot().filter((l) => l.isActive);
}

export function notifyLowStockIfNeeded(): void {
  getLowStockListings().forEach((l) => {
    emitSellerNotification({
      type: 'low-stock',
      title: 'Low stock alert',
      body: `${l.name} is down to ${l.stockQty} ${l.unit}. Update stock soon.`,
      refId: l.id,
    });
  });
}

export function isSellerOperational(): boolean {
  const stall = getStallSnapshot();
  const listings = getListingsSnapshot();
  return Boolean(stall && stall.stallName && listings.length > 0);
}