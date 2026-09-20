import { DeliveryAddress } from '@/types/auth';

export type OrderStatus = 'to-ship' | 'to-receive' | 'to-review' | 'completed' | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid';

export interface OrderLineItem {
  productId: string;
  sellerId: string;
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
  sellerId: string;
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
  cancelledAt?: string;
  cancelReason?: string;
  completedAt?: string;
}