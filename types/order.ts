import { DeliveryAddress } from '@/types/auth';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'to-receive'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refund-requested'
  | 'seller-rejected'
  | 'escalated'
  | 'return-approved'
  | 'return-in-transit'
  | 'return-received'
  | 'repayment-submitted'
  | 'buyer-confirmed'
  | 'buyer-disputed'
  | 'refunded';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'rejected';
export type PaymentMethod = 'cod' | 'gcash';
export interface PaymentAttempt {
  type: 'submitted' | 'approved' | 'rejected' | 'resubmitted';
  actorId: string;
  actorRole: 'buyer' | 'admin';
  referenceNumber: string;
  expectedAmount: number;
  reason?: string;
  at: string;
}

export interface OrderLineItem {
  productId: string;
  variantId?: string;
  variantName?: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  qty: number;
}

export interface OrderEvent {
  status: OrderStatus | 'placed' | 'refund-rejected';
  label: string;
  at: string;
}

export interface RefundEvent {
  type: string;
  label: string;
  actorRole: 'buyer' | 'seller' | 'admin' | 'system';
  at: string;
  reason?: string;
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
    reference?: string;
    note?: string;
    submittedAt?: string;
    rejectionReason?: string;
    reviewedAt?: string;
    attempts: PaymentAttempt[];
  };
  address: DeliveryAddress;
  note?: string;
  status: OrderStatus;
  events: OrderEvent[];
  placedAt: string;
  confirmedAt?: string;
  toReceiveAt?: string;
  deliveryCourier?: string;
  deliveryTrackingNumber?: string;
  deliveredAt?: string;
  completedAt?: string;
  commissionRate?: number;
  commissionAmount?: number;
  netPayoutAmount?: number;
  cancelledAt?: string;
  cancelReason?: string;
  refundReason?: string;
  refundEvidenceUrls?: string[];
  refundPayoutHold?: boolean;
  returnFromStatus?: 'delivered' | 'completed';
  refundRequestedAt?: string;
  returnApprovedAt?: string;
  returnAddress?: string;
  returnCarrier?: string;
  returnTrackingNumber?: string;
  returnShippedAt?: string;
  returnReceivedAt?: string;
  refundConfirmedAt?: string;
  refundMethod?: 'gcash' | 'cash' | 'seller-gcash';
  refundFundedBy?: 'seller' | 'admin';
  refundAffectsPlatformGcash?: boolean;
  refundReference?: string;
  refundAmount?: number;
  refundRejectedAt?: string;
  refundRejectReason?: string;
  refundGcashNumber?: string;
  refundGcashName?: string;
  refundSellerResponseDueAt?: number;
  refundBuyerShipDueAt?: number;
  refundRepaymentDueAt?: number;
  refundRepaymentRemainingMs?: number;
  refundBuyerResponseDueAt?: number;
  refundNumberIssue?: boolean;
  refundNumberIssueReason?: string;
  refundNumberIssueReportedAt?: string;
  refundSellerApprovedAt?: string;
  refundSellerRejectedAt?: string;
  refundSellerRejectReason?: string;
  refundEscalatedAt?: string;
  refundBuyerEscalatedAt?: string;
  refundEscalationDecision?: 'approved' | 'upheld';
  refundEscalationReason?: string;
  refundRepaymentReference?: string;
  refundRepaymentProofUrl?: string;
  refundRepaymentSubmittedAt?: string;
  refundRepaymentRejectedAt?: string;
  refundRepaymentRejectReason?: string;
  refundBuyerConfirmedAt?: string;
  refundBuyerDisputedAt?: string;
  refundBuyerDisputeReason?: string;
  refundBuyerResponse?: 'received' | 'not-received';
  refundBuyerResponseAt?: string;
  refundBuyerDidNotRespond?: boolean;
  refundSellerDidNotRespond?: boolean;
  refundDisputeCount?: number;
  refundOverdue?: boolean;
  refundOverdueAt?: string;
  refundClosedAt?: string;
  refundCloseReason?: string;
  refundSellerReminderSentAt?: string;
  refundRepaymentReminderSentAt?: string;
  refundBuyerReminderSentAt?: string;
  refundBuyerResponseReminderSentAt?: string;
  refundOverdueNotifiedAt?: string;
  refundReturnIssue?: string;
  refundAdminDecisionReason?: string;
  refundRecordedBy?: string;
  refundRecordedAt?: string;
  refundEvents?: RefundEvent[];
  payoutRequestId?: string;
}

export interface SellerOrderStats {
  todayOrders: number;
  pendingOrders: number;
  inTransitOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSales: number;
}
