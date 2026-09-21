import { DeliveryAddress } from '@/types/auth';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'to-receive'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid';

export interface OrderLineItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  qty: number;
}

export interface OrderEvent {
  status: OrderStatus | 'placed';
  label: string;
  at: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  stallId: string;
  sellerName: string;
  sellerLocation: string;
  deliveryFeePeso: number;
  items: OrderLineItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: {
    method: 'cod';
    status: PaymentStatus;
  };
  address: DeliveryAddress;
  note?: string;
  status: OrderStatus;
  events: OrderEvent[];
  placedAt: string;
  confirmedAt?: string;
  toReceiveAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface SellerOrderStats {
  todayOrders: number;
  pendingOrders: number;
  inTransitOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSales: number;
}
