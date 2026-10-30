import type { OrderStatus } from '@/types/order';

export interface FinanceQueryArgs extends Record<string, unknown> {
  from: string | null;
  to: string | null;
  now: number;
}

export type CodFinanceStatus = 'accrued' | 'invoiced' | 'overdue' | 'paid' | 'waived';
export type GcashPayoutStatus = 'not-requested' | 'requested' | 'paid' | 'hold' | 'refunded' | 'cancelled';
export type GcashCommissionStatus = 'pending' | 'collected' | 'reversed' | 'none';

export interface CodFinanceSection {
  unbilled: number;
  invoiced: number;
  overdue: number;
  collected: number;
  waived: number;
  totalOwed: number;
  orderCount: number;
}

export interface GcashFinanceSection {
  totalReceived: number;
  inReturnWindow: number;
  payoutReady: number;
  availableBalance: number;
  rollingBalance: number;
  requestedBalance: number;
  payoutRequested: number;
  paidOut: number;
  onHold: number;
  refunded: number;
  needsRefund: number;
  owedToSellers: number;
  commissionKept: number;
  expectedBalance: number;
}

export interface CommissionFinanceSection {
  gcashPending: number;
  gcashCollected: number;
  gcashReversed: number;
  codCollected: number;
  totalEarned: number;
  expectedAdditional: number;
  collectedToday: number;
  collectedThisWeek: number;
  collectedThisMonth: number;
  collectedAllTime: number;
}

export interface CodFinanceRecord {
  orderId: string;
  stallId: string;
  stallName: string;
  saleDate: string;
  commission: number;
  amountPaid: number;
  amountOwed: number;
  status: CodFinanceStatus;
  invoiceNumber: string | null;
  paidAt: string | null;
}

export interface GcashFinanceRecord {
  orderId: string;
  stallId: string;
  stallName: string;
  date: string;
  orderTotal: number;
  netPayout: number;
  commission: number;
  status: OrderStatus;
  payoutStatus: GcashPayoutStatus;
  payoutReference: string | null;
  refundedAmount: number;
  commissionStatus: GcashCommissionStatus;
  commissionCollectedAt: string | null;
}

export interface StallFinanceRow {
  stallId: string;
  stallName: string;
  codOwed: number;
  codOverdue: number;
  gcashOwedToSeller: number;
  gcashPaidOut: number;
  payoutAvailable: number;
  payoutRolling: number;
  payoutRequested: number;
  sellerOwesPlatform: number;
  gcashCommissionCollected: number;
  codCommissionCollected: number;
  totalCommission: number;
}

export interface FinanceReconciliation {
  _id: string;
  actualBalance: number;
  expectedBalance: number;
  difference: number;
  from: string | null;
  to: string | null;
  adminEmail: string;
  createdAt: string;
}

export interface AdminFinanceResult {
  cod: CodFinanceSection;
  gcash: GcashFinanceSection;
  commission: CommissionFinanceSection;
  sellerOwesPlatform: number;
  stalls: StallFinanceRow[];
  codRecords: CodFinanceRecord[];
  gcashRecords: GcashFinanceRecord[];
  reconciliations: FinanceReconciliation[];
}

export interface SellerFinanceResult {
  cod: CodFinanceSection;
  gcash: GcashFinanceSection;
  commission: CommissionFinanceSection;
  sellerOwesPlatform: number;
}

export interface StallFinanceOrder {
  orderId: string;
  date: string;
  paymentMethod: 'cod' | 'gcash';
  itemsSubtotal: number;
  deliveryFee: number;
  commissionAmount: number;
  netPayoutAmount: number | null;
  status: OrderStatus;
  invoiceNumber: string | null;
  payoutReference: string | null;
  refundAmount: number | null;
  refundMethod: 'gcash' | 'cash' | 'seller-gcash' | null;
  refundReference: string | null;
  refundConfirmedAt: string | null;
}

export interface StallFinanceResult {
  stallId: string;
  stallName: string;
  payoutBalance: { available: number; rolling: number; requested: number; paidOut: number };
  sellerOwesPlatform: Array<{ _id: string; orderId: string; amount: number; reason: string; status: 'open' | 'settled' | 'waived'; createdAt: string; referenceOrNote: string | null }>;
  orders: StallFinanceOrder[];
}
