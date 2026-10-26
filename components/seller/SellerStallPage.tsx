'use client';

import { useSellerStallPage } from '@/hooks/useSellerStallPage';
import { SellerStallView } from '@/components/seller/SellerStallView';

export function SellerStallPage() {
  const page = useSellerStallPage();
  return <SellerStallView page={page} />;
}
