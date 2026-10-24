export type DepositStatus = 'pending' | 'approved' | 'rejected';
export type StallDepositStatus = 'unpaid' | 'partial' | 'paid';
export type DepositEvent =
  | { type: string; actorId: string; actorRole: 'seller' | 'admin'; amount?: number; reason?: string; at: string }
  | { status: string; label: string; actor?: string; amount?: number; reason?: string; at: string };

export interface DepositRecord {
  _id: string;
  stallId: string;
  sellerId: string;
  amount: number;
  referenceNumber: string;
  status: DepositStatus;
  approvedAmount?: number;
  rejectionReason?: string;
  submittedAt?: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  attemptNumber?: number;
  events: DepositEvent[];
  stallName: string;
  sellerName: string;
  approvedTotal: number;
  remaining: number;
}

export interface DepositSummary {
  approvedTotal: number;
  unpaid: number;
  partial: number;
  paid: number;
  pendingCount: number;
  pendingAmount: number;
  totalExpected: number;
  approvedToday: number;
  approvedWeek: number;
  approvedMonth: number;
}

export interface DepositStallRow {
  stallId: string;
  stallName: string;
  paid: number;
  remaining: number;
  status: StallDepositStatus;
  deadline: number;
  overdue: boolean;
}
