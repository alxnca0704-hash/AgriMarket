'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useAdminShell() {
  const pendingGcashCount = useQuery(api.admin.getPendingGcashCount, {});
  const pendingRefundCount = useQuery(api.admin.getPendingRefundCount, {});
  return { pendingGcashCount: pendingGcashCount ?? 0, pendingRefundCount: pendingRefundCount ?? 0 };
}
