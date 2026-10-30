import type { FinanceReconciliation, FinanceQueryArgs, StallFinanceRow } from '@/types/finance';

export interface AdminDashboardArgs extends FinanceQueryArgs { days: 7 | 30 | 90 }
export interface AdminDashboardTrend { date: string; in: number; out: number; gcash: number; cod: number }
export interface AdminDashboardResult {
  expected: number; buyerPayments: number; deposited: number; codCollected: number; paidOut: number; refundsOut: number; sellerOwesPlatform: number;
  payoutAvailable: number; payoutRolling: number; payoutRequested: number; payoutPaidOut: number;
  sellerOwed: number; heldDeposits: number; buyersOwed: number; ownMoney: number;
  lastReconciliation: FinanceReconciliation | null; reconciliations: FinanceReconciliation[];
  income: { earned: number; earnedMonth: number; pending: number; codOwed: number; codOverdue: number; sales: number; salesGcash: number; salesCod: number };
  actions: { payments: number; deposits: number; commissions: number; payouts: number; returns: number; refunds: number; overdue: number };
  trend: AdminDashboardTrend[]; topSeller: StallFinanceRow[]; topPlatform: StallFinanceRow[];
  activity: { action: string; date: string; orderId: string | null; payoutId: string | null; depositId: string | null; commissionPaymentId: string | null }[];
}
