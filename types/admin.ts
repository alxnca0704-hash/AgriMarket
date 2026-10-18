export interface AdminRefundRequest {
  orderId: string;
  status: 'refund-requested' | 'return-approved' | 'return-in-transit' | 'return-received';
  paymentMethod: 'cod' | 'gcash';
  paymentReference: string;
  buyerName: string;
  buyerMobileNumber: string;
  sellerName: string;
  reason: string;
  evidenceUrls: string[];
  total: number;
  requestedAt: string;
  returnAddress: string;
  returnCarrier: string;
  returnTrackingNumber: string;
}

export type RefundDisbursementMethod = 'gcash' | 'cash';
