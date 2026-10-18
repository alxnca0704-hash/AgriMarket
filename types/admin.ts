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
  }>;
  requestedAt: string;
  stallName: string;
  stallPhotoUrl: string;
  farmType: string;
  location: string;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  idType: string;
  idNumber: string;
}
