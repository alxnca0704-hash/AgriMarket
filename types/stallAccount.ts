export interface StallAccountRow {
  stallId: string; stallName: string; sellerName: string; verificationStatus: string;
  gcashSales: number; gcashOwed: number; gcashPaidOut: number; codSales: number;
  payoutAvailable: number; payoutRolling: number; payoutRequested: number; payoutPaidOut: number; sellerOwesPlatform: number;
  codOwed: number; codOverdue: number; commissionEarned: number;
  depositRequired: number; depositPaid: number; depositRemaining: number; depositStatus: string;
  refundedAmount: number; refundedGcash: number; refundedCod: number; refundedCount: number;
  inProgressAmount: number; inProgressCount: number; needsRefundAmount: number; needsRefundCount: number;
}
export interface StallAccountsResult {
  rows: StallAccountRow[];
  expectedGcashBalance: number;
  reconciliations: Array<{ _id: string; actualBalance: number; expectedBalance: number; difference: number; from: string | null; to: string | null; adminEmail: string; createdAt: string }>;
}
