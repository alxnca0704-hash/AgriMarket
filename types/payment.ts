import type { OrderStatus } from '@/types/order';

export type AdminPaymentStatus = 'pending' | 'paid' | 'rejected';
export type PaymentEventType = 'submitted' | 'approved' | 'rejected' | 'resubmitted';

export interface AdminPaymentEvent {
  type: PaymentEventType;
  actorId: string;
  actorRole: 'buyer' | 'admin';
  referenceNumber: string;
  expectedAmount: number;
  reason?: string;
  at: string;
}

export interface AdminPaymentOrder {
  orderId: string;
  stallName: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: AdminPaymentStatus;
  payoutStatus: string;
}

export interface AdminPaymentRecord {
  paymentNote: string;
  paymentReference: string;
  submittedAt: string;
  buyerName: string;
  expectedAmount: number;
  status: AdminPaymentStatus;
  attemptNumber: number;
  reviewedBy: string;
  reviewedAt: string;
  rejectionReason: string;
  sellerNames: string[];
  orderIds: string[];
  orders: AdminPaymentOrder[];
  events: AdminPaymentEvent[];
  needsRefund: boolean;
  duplicateApproved: boolean;
}
