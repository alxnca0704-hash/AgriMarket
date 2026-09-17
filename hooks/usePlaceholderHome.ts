'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { AuthenticatedUser } from '@/types/auth';

export function usePlaceholderHome() {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem('agrimarket_user') : null;
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Fallback demo user if accessed directly
        setUser({
          id: 'usr_demo',
          role: ROLES.BUYER,
          fullName: 'Juan dela Cruz',
          mobileNumber: '0917 123 4567',
          defaultAddressSummary: '123 Rizal St, Brgy. San Antonio, Pasig City, Metro Manila 1600',
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      setError('Unable to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogOut = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('agrimarket_user');
    }
    router.push(APP_ROUTES.landing);
  };

  return {
    user,
    isLoading,
    error,
    handleLogOut,
  };
}
