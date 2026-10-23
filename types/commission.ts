export type CommissionInvoiceStatus = 'issued' | 'pending-review' | 'partial' | 'paid' | 'overdue';
export interface CommissionOrder { orderId: string; amount: number; date: string }
export interface CommissionInvoice {
  _id: string; periodStart: string; periodEnd: string; amount: number; paidAmount: number; remaining: number;
  dueAt: number; status: CommissionInvoiceStatus; pending: boolean; canResubmit: boolean; orders: CommissionOrder[];
}
export interface SellerCommissionData {
  unbilled: number;
  invoices: CommissionInvoice[];
  gcash: { qrUrl: string; number: string } | null;
}
