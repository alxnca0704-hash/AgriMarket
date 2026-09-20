import React from 'react';
import { CartProvider } from '@/components/buyer/CartProvider';
import { CheckoutShell } from '@/components/checkout/CheckoutShell';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CheckoutShell>{children}</CheckoutShell>
    </CartProvider>
  );
}