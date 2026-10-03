import { DeliveryAddress } from '@/types/auth';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'to-receive'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refund-requested'
  | 'refunded';

export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'expired' | 'awaiting_gcash_authorization' | 'awaiting_payment_method';
export type PaymentMethod = 'cod' | 'gcash';

export interface OrderLineItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  qty: number;
}

export interface OrderEvent {
  status: OrderStatus | 'placed' | 'refund-rejected' | 'payment-pending' | 'payment-failed' | 'payment-paid' | 'payment-expired' | 'awaiting_gcash_authorization' | 'awaiting_payment_method';
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
      method: PaymentMethod;
      status: PaymentStatus;
      redirectUrl?: string;
      hasPaymentIntent: boolean;
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
  refundReason?: string;
  refundRequestedAt?: string;
  refundConfirmedAt?: string;
  refundRejectedAt?: string;
  refundRejectReason?: string;
}

export interface SellerOrderStats {
  todayOrders: number;
  pendingOrders: number;
  inTransitOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSales: number;
}
