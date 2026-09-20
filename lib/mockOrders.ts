import { DeliveryAddress } from '@/types/auth';
import { Order, OrderEvent, OrderLineItem, OrderStatus } from '@/types/order';
import { Seller } from '@/types/product';

const STORAGE_KEY = 'agrimarket_orders';
const EMPTY_ORDERS: Order[] = [];

export function getOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

const ordersListeners = new Set<() => void>();
let ordersSnapshot: Order[] | null = null;

export function getOrdersSnapshot(): Order[] {
  if (ordersSnapshot === null) ordersSnapshot = getOrders();
  return ordersSnapshot;
}

export function getEmptyOrdersSnapshot(): Order[] {
  return EMPTY_ORDERS;
}

export function subscribeOrders(listener: () => void): () => void {
  ordersListeners.add(listener);
  return () => {
    ordersListeners.delete(listener);
  };
}

function updateOrdersSnapshot(next: Order[]): void {
  ordersSnapshot = next;
  saveOrders(next);
  ordersListeners.forEach((listener) => listener());
}

function makeOrderId(index: number): string {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `AGR-${day}-${rand}-${index + 1}`;
}

export interface OrderDraftGroup {
  seller: Seller;
  items: OrderLineItem[];
  subtotal: number;
}

export function createOrdersFromCheckout(params: {
  groups: OrderDraftGroup[];
  address: DeliveryAddress;
  notes: Record<string, string>;
}): Order[] {
  const placedAt = new Date().toISOString();
  const orders: Order[] = params.groups.map((group, index) => {
    const deliveryFee = group.seller.deliveryFeePeso || 0;
    const total = group.subtotal + deliveryFee;
    return {
      id: makeOrderId(index),
      sellerId: group.seller.id,
      sellerName: group.seller.name,
      sellerLocation: group.seller.location,
      deliveryFeePeso: deliveryFee,
      items: group.items,
      subtotal: group.subtotal,
      deliveryFee,
      total,
      payment: { method: 'cod', status: 'unpaid' },
      address: { ...params.address },
      note: params.notes[group.seller.id]?.trim() || undefined,
      status: 'to-ship',
      events: [{ status: 'placed', label: 'Order placed', at: placedAt }],
      placedAt,
    } satisfies Order;
  });

  updateOrdersSnapshot([...getOrdersSnapshot(), ...orders]);
  return orders;
}

export function getOrderById(orderId: string): Order | undefined {
  return getOrdersSnapshot().find((o) => o.id === orderId);
}

function nowIso(): string {
  return new Date().toISOString();
}

function appendEvent(order: Order, event: OrderEvent, patch: Partial<Order>): void {
  const next = getOrdersSnapshot().map((o) =>
    o.id === order.id
      ? { ...o, ...patch, status: (patch.status ?? o.status) as OrderStatus, events: [...o.events, event] }
      : o
  );
  updateOrdersSnapshot(next);
}

export function shipOrder(orderId: string): void {
  const order = getOrderById(orderId);
  if (!order || order.status !== 'to-ship') return;
  appendEvent(
    order,
    { status: 'to-receive', label: 'Out for delivery', at: nowIso() },
    { status: 'to-receive' }
  );
}

export function receiveOrder(orderId: string): void {
  const order = getOrderById(orderId);
  if (!order || order.status !== 'to-receive') return;
  appendEvent(
    order,
    { status: 'to-review', label: 'Delivered · waiting for your review', at: nowIso() },
    {
      status: 'to-review',
      payment: { ...order.payment, status: 'paid' },
    }
  );
}

export function reviewOrder(orderId: string): void {
  const order = getOrderById(orderId);
  if (!order || order.status !== 'to-review') return;
  appendEvent(
    order,
    { status: 'completed', label: 'Reviewed · order complete', at: nowIso() },
    {
      status: 'completed',
      completedAt: nowIso(),
    }
  );
}

export function cancelOrder(orderId: string, reason: string): void {
  const order = getOrderById(orderId);
  if (!order || order.status !== 'to-ship') return;
  appendEvent(
    order,
    { status: 'cancelled', label: 'Order cancelled', at: nowIso() },
    {
      status: 'cancelled',
      cancelledAt: nowIso(),
      cancelReason: reason.trim() || undefined,
    }
  );
}