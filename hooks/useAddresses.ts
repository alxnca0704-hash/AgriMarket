'use client';

import { useEffect, useState } from 'react';
import { useAddressBook } from '@/hooks/useAddressBook';

export function useAddresses() {
  const addressBook = useAddressBook();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return {
    isLoading,
    error: null,
    addressBook,
  };
}