'use client';

import Image from 'next/image';

import { ASSET_ROUTES } from '@/constants/routes';

interface BrandMarkProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function BrandMark({ size = 'sm', className = '' }: BrandMarkProps) {
  const logoHeight = size === 'md' ? 44 : 32;

  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src={ASSET_ROUTES.logo}
        alt="Agrimarket"
        width={2172}
        height={724}
        priority
        className="w-auto block select-none"
        style={{ height: logoHeight }}
      />
    </span>
  );
}
