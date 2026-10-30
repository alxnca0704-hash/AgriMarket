export interface AdminRefundRequest {
  orderId: string;
  status: 'refund-requested' | 'seller-rejected' | 'escalated' | 'return-approved' | 'return-in-transit' | 'return-received' | 'repayment-submitted' | 'buyer-confirmed' | 'buyer-disputed';
  paymentMethod: 'cod' | 'gcash';
  paymentReference: string;
  buyerName: string;
  buyerMobileNumber: string;
  sellerName: string;
  reason: string;
  evidenceUrls: string[];
  total: number;
  items: import('@/types/order').OrderLineItem[];
  requestedAt: string;
  returnAddress: string;
  returnCarrier: string;
  returnTrackingNumber: string;
  refundGcashName?: string;
  refundGcashNumber?: string;
  sellerResponseDueAt?: number;
  buyerShipDueAt?: number;
  repaymentDueAt?: number;
  buyerResponseDueAt?: number;
  repaymentReference?: string;
  repaymentProofUrl?: string;
  buyerResponse?: 'received' | 'not-received';
  overdue?: boolean;
  timeline?: AdminRefundTimelineEvent[];
}

export interface AdminRefundTimelineEvent {
  type: string;
  label: string;
  actorRole: 'buyer' | 'seller' | 'admin' | 'system';
  at: string;
  reason?: string;
}

export type RefundDisbursementMethod = 'gcash' | 'cash' | 'seller-gcash';

export type AdminCodRefundStatus =
  | 'escalated'
  | 'return-received'
  | 'repayment-submitted'
  | 'buyer-confirmed'
  | 'buyer-disputed';

export interface AdminCodRefund {
  orderId: string;
  status: AdminCodRefundStatus;
  paymentMethod: 'cod' | 'gcash';
  paymentReference: string;
  buyerName: string;
  buyerMobileNumber: string;
  sellerName: string;
  reason: string;
  evidenceUrls: string[];
  total: number;
  items: import('@/types/order').OrderLineItem[];
  requestedAt: string;
  returnAddress: string;
  returnCarrier: string;
  returnTrackingNumber: string;
  refundGcashName: string;
  refundGcashNumber: string;
  sellerResponseDueAt?: number;
  buyerShipDueAt?: number;
  repaymentDueAt?: number;
  buyerResponseDueAt?: number;
  repaymentReference: string;
  repaymentProofUrl: string;
  buyerResponse?: 'received' | 'not-received';
  overdue: boolean;
  timeline: AdminRefundTimelineEvent[];
}

export interface AdminCodRefundDetail extends AdminCodRefund {
  refundName: string;
  returnIssue: string;
  sellerRejectReason: string;
  escalationReason: string;
  disputeReason: string;
  disputeCount: number;
  sellerDidNotRespond: boolean;
  buyerDidNotRespond: boolean;
  closedReason: string;
  refundEvents: AdminRefundTimelineEvent[];
}

export interface AdminRecordedRefund {
  orderId: string;
  buyerName: string;
  sellerName: string;
  paymentMethod: 'cod' | 'gcash';
  refundMethod: RefundDisbursementMethod | null;
  refundReference: string;
  refundAmount: number;
  refundedAt: string;
  returnCarrier: string;
  returnTrackingNumber: string;
  paidBy?: 'seller' | 'admin' | null;
  buyerConfirmedAt?: string | null;
  recordedBy?: string | null;
}

export interface AdminPayoutRequest {
  _id: string;
  sellerName: string;
  amount: number;
  gcashName: string;
  gcashNumber: string;
  orderIds: string[];
  orderSnapshots: Array<{
    orderId: string;
    amount: number;
    placedAt: string;
    deliveredAt: string;
    paymentMethod: 'cod' | 'gcash';
    itemsSubtotal: number;
    deliveryFee: number;
    commissionAmount: number;
    netPayoutAmount: number;
    completedAt: string;
  }>;
  requestedAt: string;
  itemsSubtotal: number;
  deliveryFee: number;
  commissionAmount: number;
  netPayoutAmount: number;
  completedAt: string;
  transferReference: string | null;
  reviewedAt: string | null;
  stallName: string;
  stallPhotoUrl: string;
  farmType: string;
  location: string;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  idType: string;
  idNumber: string;
  allOrdersGcash: boolean;
}
