import React from 'react';
import { CartProvider } from '@/components/buyer/CartProvider';
import { BuyerShell } from '@/components/buyer/BuyerShell';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <BuyerShell>{children}</BuyerShell>
    </CartProvider>
  );
}