'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useUnreadNotifications(role?: 'buyer' | 'seller'): number {
  const count = useQuery(
    api.notifications.getUnreadNotificationCount,
    role ? { role } : {}
  );
  return typeof count === 'number' ? count : 0;
}
