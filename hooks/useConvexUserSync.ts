'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { updateSessionUser } from '@/lib/mockSession';
import { saveStall } from '@/lib/mockStall';
import { toSessionUser, toStallProfile } from '@/lib/convexSync';

export function useConvexUserSync() {
  const current = useQuery(api.users.getCurrent);
  const isReady = current !== undefined;
  const isAuthedWithConvex = isReady && current !== null;

  useEffect(() => {
    if (!current) return;
    if (current.user) {
      updateSessionUser(toSessionUser(current.user, current.addresses, current.email));
    }
    if (current.stall) {
      saveStall(toStallProfile(current.stall));
    }
  }, [current]);

  return { current, isReady, isAuthedWithConvex };
}