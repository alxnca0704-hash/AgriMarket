'use client';

import React from 'react';
import { Image } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { Product, Seller } from '@/types/product';
import { formatCount, formatUnitPrice } from '@/lib/format';

interface ProductCardProps {
  product: Product;
  seller: Seller;
  onOpen: (productId: string) => void;
}

export function ProductCard({ product, seller, onOpen }: ProductCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(product.id);
      }}
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/30"
    >
      <div className="aspect-[3/2] w-full bg-white p-3">
        <Image
          src={product.imageUrl}
          alt={product.name}
          preview={false}
          className="!h-full !w-full rounded-2xl object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3 pt-1.5">
        <h3 className="line-clamp-2 min-h-9 text-[13px] font-medium leading-snug text-stone-900">
          {product.name}
        </h3>

        <p className="flex items-center gap-1 text-[11px] text-stone-500">
          {seller.verified && <CheckCircleFilled className="text-[#2D6A4F]" />}
          <span className="truncate">{seller.farmName}</span>
        </p>

        <div className="mt-auto flex items-baseline justify-between gap-2 pt-1.5">
          <p className="text-sm font-bold tracking-tight text-stone-900">
            {formatUnitPrice(product.price, product.unit)}
          </p>
          <span className="text-[11px] text-stone-400">Sold {formatCount(product.soldCount)}</span>
        </div>
      </div>
    </div>
  );
}