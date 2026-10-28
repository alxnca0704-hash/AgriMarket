import type { OrderStatus, RefundEvent } from '@/types/order';

export interface BuyerCodRefund {
  orderId: string;
  status: OrderStatus;
  refundNumber: string;
  refundName: string;
  sellerName: string;
  total: number;
  returnAddress: string;
  returnCarrier: string;
  returnTrackingNumber: string;
  sellerResponseDueAt: number | null;
  buyerShipDueAt: number | null;
  repaymentDueAt: number | null;
  buyerResponseDueAt: number | null;
  repaymentReference: string;
  repaymentProofUrl: string;
  repaymentSubmittedAt: string | null;
  sellerRejectReason: string;
  escalationReason: string;
  numberIssue: boolean;
  numberIssueReason: string;
  buyerResponse: 'received' | 'not-received' | null;
  disputeCount: number;
  overdue: boolean;
  closedReason: string;
  timeline: RefundEvent[];
}

export interface SellerCodRefund {
  orderId: string;
  status: OrderStatus;
  buyerName: string;
  total: number;
  itemsSubtotal: number;
  deliveryFee: number;
  reason: string;
  evidenceUrls: string[];
  refundName: string;
  maskedNumber: string;
  defaultReturnAddress: string;
  returnAddress: string;
  returnCarrier: string;
  returnTrackingNumber: string;
  shippingDeadline: number | null;
  repaymentDueAt: number | null;
  repaymentRemainingMs: number | null;
  sellerResponseDueAt: number | null;
  numberIssue: boolean;
  numberIssueReason: string;
  overdue: boolean;
  repaymentReference: string;
  repaymentProofUrl: string;
  repaymentSubmittedAt: string | null;
  repaymentRejectReason: string;
  sellerRejectReason: string;
  buyerResponse: 'received' | 'not-received' | null;
  buyerConfirmedAt: string | null;
  disputeReason: string;
  returnIssue: string;
  canRevealNumber: boolean;
  timeline: RefundEvent[];
}
