export type CommissionInvoiceStatus = 'issued' | 'pending-review' | 'partial' | 'paid' | 'overdue';
export type CommissionPaymentStatus = 'pending' | 'approved' | 'rejected';
export interface CommissionOrder { orderId: string; amount: number; date: string }
export interface CommissionPayment {
  _id: string;
  amount: number;
  referenceNumber: string;
  status: CommissionPaymentStatus;
  approvedAmount: number | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}
export interface CommissionInvoice {
  _id: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  paidAmount: number;
  remaining: number;
  creditApplied: number;
  dueAt: number;
  status: CommissionInvoiceStatus;
  pending: boolean;
  canResubmit: boolean;
  orders: CommissionOrder[];
  payments: CommissionPayment[];
}
export interface SellerCommissionData {
  unbilled: number;
  unbilledOrders: CommissionOrder[];
  invoices: CommissionInvoice[];
  gcash: { qrUrl: string; number: string } | null;
  credits: {
    available: number;
    entries: Array<{
      _id: string;
      sourceOrderId: string;
      amount: number;
      remainingAmount: number;
      createdAt: string;
    }>;
  };
}
