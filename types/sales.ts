import type { SaleStatus } from '@/constants/sales';
import type { CommissionReceivableStatus } from '@/constants/commissions';
import type { Id } from '@/convex/_generated/dataModel';

export interface SalesQueryArgs extends Record<string, unknown> {
  search: string;
  paymentMethod: 'all' | 'gcash' | 'cod';
  saleStatus: 'all' | 'counted' | 'refund-requested' | 'refunded';
  from: string | null;
  to: string | null;
  stallId: Id<'stalls'> | null;
  page: number;
  pageSize: number;
  now: number;
}

export interface SaleRecord {
  orderId: string;
  completedAt: string;
  buyerName: string;
  stallName: string;
  itemSummary: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    unit: string;
    imageUrl: string;
    qty: number;
  }>;
  itemsSubtotal: number;
  deliveryFee: number;
  orderTotal: number;
  paymentMethod: 'gcash' | 'cod';
  gcashReference: string | null;
  saleStatus: SaleStatus;
  stallId: string;
  commissionAmount: number | null;
  commissionStatus: CommissionReceivableStatus | 'pending' | 'collected' | 'reversed' | 'n/a';
  invoiceNumber: string | null;
  payoutReference: string | null;
  refundAmount: number | null;
  refundMethod: 'gcash' | 'cash' | 'seller-gcash' | null;
  refundReference: string | null;
  refundConfirmedAt: string | null;
}

export interface SalesSummary {
  totalSales: number;
  gcashSales: number;
  codSales: number;
  orderCount: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  commissionAccrued: number;
  commissionCollected: number;
  codCommissionOwed: number;
  gcashCommission: number;
  totalCommission: number;
}

export interface StallSalesSummary {
  stallId: string;
  stallName: string;
  orders: number;
  gcashTotal: number;
  codTotal: number;
  total: number;
  refundedTotal: number;
}

export interface SalesQueryResult {
  records: SaleRecord[];
  total: number;
  summary: SalesSummary;
  stalls: StallSalesSummary[];
}
