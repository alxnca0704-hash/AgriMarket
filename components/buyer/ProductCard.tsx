'use client';

import React from 'react';
import { Image } from 'antd';
import { PlusOutlined, StarOutlined } from '@ant-design/icons';
import { Product, Seller } from '@/types/product';
import { formatUnitPrice } from '@/lib/format';

interface ProductCardProps {
  product: Product;
  seller: Seller;
  onOpen: (productId: string) => void;
  onQuickAdd: (productId: string) => void;
}

export function ProductCard({ product, seller, onOpen, onQuickAdd }: ProductCardProps) {

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(product.id);
      }}
      className="rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
    >
      <div className="relative">
        <Image
          src={product.imageUrl}
          alt={product.name}
          preview={false}
          className="!w-full aspect-square object-cover"
        />
        <button
          type="button"
          aria-label={`Add ${product.name} to cart`}
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(product.id);
          }}
          className="absolute right-2 bottom-2 w-9 h-9 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center shadow-sm hover:bg-[#1B4332] cursor-pointer transition-colors"
        >
          <PlusOutlined />
        </button>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-[#2D6A4F]/70">
          {seller.farmName}
        </span>
        <h3 className="text-sm font-semibold text-stone-900 leading-snug line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-stone-500">
          <StarOutlined className="text-amber-500 !text-xs" />
          <span className="font-medium text-stone-700">{product.rating.toFixed(1)}</span>
          <span>({product.ratingCount})</span>
        </div>
        <p className="text-sm font-semibold text-stone-900 mt-1">
          {formatUnitPrice(product.price, product.unit)}
        </p>
      </div>
    </div>
  );
}