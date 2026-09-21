import { SellerNotification, SellerNotificationType } from '@/types/seller';

const STORAGE_KEY = 'agrimarket_seller_notifications';
const EMPTY_NOTIFICATIONS: SellerNotification[] = [];

function readNotifications(): SellerNotification[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SellerNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotifications(items: SellerNotification[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const notificationsListeners = new Set<() => void>();
let notificationsSnapshot: SellerNotification[] | null = null;

export function getNotificationsSnapshot(): SellerNotification[] {
  if (notificationsSnapshot === null) notificationsSnapshot = readNotifications();
  return notificationsSnapshot;
}

export function getEmptyNotificationsSnapshot(): SellerNotification[] {
  return EMPTY_NOTIFICATIONS;
}

export function subscribeNotifications(listener: () => void): () => void {
  notificationsListeners.add(listener);
  return () => {
    notificationsListeners.delete(listener);
  };
}

function updateNotificationsSnapshot(next: SellerNotification[]): void {
  notificationsSnapshot = next;
  writeNotifications(next);
  notificationsListeners.forEach((listener) => listener());
}

function makeNotificationId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function emitSellerNotification(params: {
  type: SellerNotificationType;
  title: string;
  body: string;
  refId?: string;
}): SellerNotification {
  const item: SellerNotification = {
    id: makeNotificationId(),
    type: params.type,
    title: params.title,
    body: params.body,
    refId: params.refId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  updateNotificationsSnapshot([item, ...getNotificationsSnapshot()]);
  return item;
}

export function markNotificationRead(id: string): void {
  const next = getNotificationsSnapshot().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  updateNotificationsSnapshot(next);
}

export function markAllNotificationsRead(): void {
  const next = getNotificationsSnapshot().map((n) => ({ ...n, read: true }));
  updateNotificationsSnapshot(next);
}

const SEED_NOTIFICATIONS: Array<Omit<SellerNotification, 'id' | 'read'>> = [
  {
    type: 'new-order',
    title: 'New order received',
    body: 'A buyer ordered Highland Strawberries. Accept the order to confirm.',
    refId: 'AGR-DEMO-0001',
    createdAt: '2026-09-21T08:15:00.000Z',
  },
  {
    type: 'low-stock',
    title: 'Low stock alert',
    body: 'Baguio Broccoli Crowns is down to 60 kg. Update your stock soon.',
    createdAt: '2026-09-21T07:40:00.000Z',
  },
];

export function seedDemoNotifications(): void {
  if (getNotificationsSnapshot().length > 0) return;
  const seeded = SEED_NOTIFICATIONS.map((n, index) => ({
    ...n,
    id: `notif-seed-${index}`,
    read: false,
  }));
  updateNotificationsSnapshot(seeded);
}