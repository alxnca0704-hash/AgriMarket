'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { AuthenticatedUser } from '@/types/auth';
import { clearMockUser, getMockUser } from '@/lib/mockSession';

const DEMO_USER: AuthenticatedUser = {
  id: 'demo-buyer',
  role: ROLES.BUYER,
  fullName: 'Demo Buyer',
  mobileNumber: '09171234567',
  email: 'demo.user@gmail.com',
  defaultAddressSummary: '142 Rizal St, Brgy. San Lorenzo, Makati City, Metro Manila, NCR 1229',
  createdAt: new Date().toISOString(),
};

export function usePlaceholderHome() {
  const router = useRouter();
  const [user] = useState<AuthenticatedUser | null>(() =>
    typeof window === 'undefined' ? DEMO_USER : getMockUser() ?? DEMO_USER
  );

  const handleLogOut = () => {
    clearMockUser();
    router.push(APP_ROUTES.landing);
  };

  return {
    user,
    isLoading: false,
    error: null,
    handleLogOut,
  };
}