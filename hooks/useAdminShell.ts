'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { makeFunctionReference } from 'convex/server';

const pendingDepositsRef = makeFunctionReference<'query', Record<string, never>, number>('deposits:pendingCount');
const pendingCommissionRef = makeFunctionReference<'query', Record<string, never>, number>('commissions:pendingCount');

export function useAdminShell() {
  const pendingGcashCount = useQuery(api.admin.getPendingGcashCount, {});
  const pendingRefundCount = useQuery(api.admin.getPendingRefundCount, {});
  const pendingDepositCount = useQuery(pendingDepositsRef, {});
  const pendingCommissionCount = useQuery(pendingCommissionRef, {});
  return { pendingGcashCount: pendingGcashCount ?? 0, pendingRefundCount: pendingRefundCount ?? 0, pendingDepositCount: pendingDepositCount ?? 0, pendingCommissionCount: pendingCommissionCount ?? 0 };
}
