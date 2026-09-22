'use client';

import React from 'react';
import { CheckCircleFilled } from '@ant-design/icons';
import { Product, Seller } from '@/types/product';
import { formatCount, formatUnitPrice, getProductImageUrl } from '@/lib/format';

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
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/30"
    >
      <div className="w-full bg-white p-1.5">
        <div className="w-full overflow-hidden rounded-xl bg-stone-50" style={{ aspectRatio: '735 / 919' }}>
          <img
            src={getProductImageUrl(product.imageUrl)}
            alt={product.name}
            width={735}
            height={919}
            className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            draggable={false}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-2.5 pb-2.5 pt-1">
        <h3 className="line-clamp-2 min-h-8 text-[12px] font-medium leading-snug text-stone-900">
          {product.name}
        </h3>

        <p className="flex items-center gap-1 text-[11px] text-stone-500">
          {seller.verified && <CheckCircleFilled className="text-[#2D6A4F] text-[10px]" />}
          <span className="truncate">{seller.farmName}</span>
        </p>

        <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
          <p className="text-[13px] font-bold tracking-tight text-stone-900">
            {formatUnitPrice(product.price, product.unit)}
          </p>
          <span className="text-[10px] text-stone-400">Sold {formatCount(product.soldCount)}</span>
        </div>
      </div>
    </div>
  );
}