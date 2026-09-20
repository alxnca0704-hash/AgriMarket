'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { APP_ROUTES } from '@/constants/routes';
import { BrandMark } from '@/components/BrandMark';

export function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href={APP_ROUTES.home} className="flex items-center no-underline">
            <BrandMark />
          </Link>
          <Link
            href={APP_ROUTES.cart}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-[#2D6A4F] no-underline transition-colors"
          >
            <ArrowLeftOutlined className="text-xs" />
            Back to cart
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}