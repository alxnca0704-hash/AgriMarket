import { Order, OrderEvent, OrderLineItem } from '@/types/order';
import { DeliveryAddress } from '@/types/auth';
import { MOCK_CATALOG } from '@/lib/mockCatalog';
import { DEMO_SELLER_ID, DEMO_SELLER_NAME } from '@/lib/mockStall';
import { bootstrapOrders, getSellerOrders } from '@/lib/mockOrders';
import { seedDemoNotifications } from '@/lib/mockNotifications';

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

function lineItem(productId: string, qty: number): OrderLineItem {
  const product = MOCK_CATALOG.products.find((p) => p.id === productId);
  return {
    productId,
    sellerId: DEMO_SELLER_ID,
    name: product?.name ?? 'Product',
    price: product?.price ?? 0,
    unit: product?.unit ?? 'kg',
    imageUrl: product?.imageUrl ?? '',
    qty,
  };
}

function buyerAddress(receiverName: string, city: string): DeliveryAddress {
  return {
    label: 'Home',
    receiverName,
    receiverPhone: '09171234567',
    region: 'National Capital Region (NCR)',
    province: 'Metro Manila',
    cityMunicipality: city,
    barangay: 'San Lorenzo',
    streetBuilding: '142 Rizal St',
    postalCode: '1229',
  };
}

function computeTotals(items: OrderLineItem[], deliveryFee: number) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

function makeOrder(seed: {
  id: string;
  buyer: string;
  city: string;
  items: OrderLineItem[];
  status: Order['status'];
  placedHoursAgo: number;
  acceptedHoursAgo?: number;
  readyHoursAgo?: number;
  shippedHoursAgo?: number;
  completedDaysAgo?: number;
  cancelReason?: string;
  note?: string;
}): Order {
  const totals = computeTotals(seed.items, 49);
  const events: OrderEvent[] = [
    { status: 'placed', label: 'Order placed', at: hoursAgo(seed.placedHoursAgo) },
  ];
  if (seed.acceptedHoursAgo !== undefined) {
    events.push({ status: 'to-ship', label: 'Order accepted · preparing', at: hoursAgo(seed.acceptedHoursAgo) });
  }
  if (seed.readyHoursAgo !== undefined) {
    events.push({ status: 'to-ship', label: 'Marked ready for dispatch', at: hoursAgo(seed.readyHoursAgo) });
  }
  if (seed.shippedHoursAgo !== undefined) {
    events.push({ status: 'to-receive', label: 'Out for delivery', at: hoursAgo(seed.shippedHoursAgo) });
  }
  if (seed.completedDaysAgo !== undefined) {
    events.push(
      { status: 'to-review', label: 'Delivered · waiting for your review', at: daysAgo(seed.completedDaysAgo + 0.5) },
      { status: 'completed', label: 'Reviewed · order complete', at: daysAgo(seed.completedDaysAgo) }
    );
  }

  return {
    id: seed.id,
    sellerId: DEMO_SELLER_ID,
    sellerName: DEMO_SELLER_NAME,
    sellerLocation: 'La Trinidad, Benguet',
    deliveryFeePeso: 49,
    items: seed.items,
    ...totals,
    payment: {
      method: 'cod',
      status: seed.status === 'to-review' || seed.status === 'completed' ? 'paid' : 'unpaid',
    },
    address: buyerAddress(seed.buyer, seed.city),
    note: seed.note,
    status: seed.status,
    events,
    placedAt: hoursAgo(seed.placedHoursAgo),
    acceptedAt:
      seed.acceptedHoursAgo !== undefined ? hoursAgo(seed.acceptedHoursAgo) : undefined,
    readyAt: seed.readyHoursAgo !== undefined ? hoursAgo(seed.readyHoursAgo) : undefined,
    shippedAt:
      seed.shippedHoursAgo !== undefined ? hoursAgo(seed.shippedHoursAgo) : undefined,
    cancelReason: seed.cancelReason,
    completedAt:
      seed.completedDaysAgo !== undefined ? daysAgo(seed.completedDaysAgo) : undefined,
  } satisfies Order;
}

export function ensureSellerDemoData(): void {
  if (getSellerOrders(DEMO_SELLER_ID).length > 0) {
    seedDemoNotifications();
    return;
  }

  seedOrders();
  seedDemoNotifications();
}

function seedOrders(): void {
  const orders: Order[] = [
    makeOrder({
      id: 'AGR-DEMO-0001',
      buyer: 'Liza M.',
      city: 'Makati City',
      items: [lineItem('prod-1', 3)],
      status: 'to-ship',
      placedHoursAgo: 2,
      note: 'Kindly keep the strawberries separate — they are a gift.',
    }),
    makeOrder({
      id: 'AGR-DEMO-0002',
      buyer: 'Miggs A.',
      city: 'Taguig City',
      items: [lineItem('prod-7', 4), lineItem('prod-8', 2)],
      status: 'to-ship',
      placedHoursAgo: 6,
      acceptedHoursAgo: 5,
    }),
    makeOrder({
      id: 'AGR-DEMO-0003',
      buyer: 'Nikki R.',
      city: 'Quezon City',
      items: [lineItem('prod-1', 6)],
      status: 'to-ship',
      placedHoursAgo: 26,
      acceptedHoursAgo: 25,
      readyHoursAgo: 8,
    }),
    makeOrder({
      id: 'AGR-DEMO-0004',
      buyer: 'Ramon D.',
      city: 'Mandaluyong City',
      items: [lineItem('prod-8', 5)],
      status: 'to-receive',
      placedHoursAgo: 60,
      acceptedHoursAgo: 58,
      readyHoursAgo: 30,
      shippedHoursAgo: 22,
    }),
    makeOrder({
      id: 'AGR-DEMO-0005',
      buyer: 'Grace T.',
      city: 'Pasig City',
      items: [lineItem('prod-1', 4), lineItem('prod-7', 3)],
      status: 'to-review',
      placedHoursAgo: 92,
      acceptedHoursAgo: 90,
      readyHoursAgo: 50,
      shippedHoursAgo: 44,
    }),
    makeOrder({
      id: 'AGR-DEMO-0006',
      buyer: 'Jomar B.',
      city: 'Marikina City',
      items: [lineItem('prod-8', 10)],
      status: 'completed',
      placedHoursAgo: 140,
      acceptedHoursAgo: 138,
      readyHoursAgo: 96,
      shippedHoursAgo: 90,
      completedDaysAgo: 3,
    }),
    makeOrder({
      id: 'AGR-DEMO-0007',
      buyer: 'Ann V.',
      city: 'San Juan City',
      items: [lineItem('prod-7', 2)],
      status: 'cancelled',
      placedHoursAgo: 70,
      cancelReason: 'Buyer could not arrange pickup in time.',
    }),
  ];
  bootstrapOrders(orders);
}