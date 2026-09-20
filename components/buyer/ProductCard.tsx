'use client';

import React from 'react';
import { Button, Image } from 'antd';
import { EnvironmentOutlined, ShoppingCartOutlined, StarFilled } from '@ant-design/icons';
import { Product, Seller } from '@/types/product';
import { formatDistance, formatUnitPrice } from '@/lib/format';
import { CATEGORY_OPTIONS } from '@/constants/categories';

interface ProductCardProps {
  product: Product;
  seller: Seller;
  onOpen: (productId: string) => void;
  onQuickAdd: (productId: string) => void;
}

export function ProductCard({ product, seller, onOpen, onQuickAdd }: ProductCardProps) {
  const categoryLabel =
    CATEGORY_OPTIONS.find((c) => c.key === product.category)?.label ?? product.category;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(product.id);
      }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/30"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          preview={false}
          className="!w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-600 backdrop-blur">
          {categoryLabel}
        </span>
        <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-stone-600 backdrop-blur">
          <EnvironmentOutlined className="!text-[10px] text-sage" />
          {formatDistance(seller.distanceKm)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="truncate text-[11px] font-medium text-stone-400">{seller.farmName}</span>

        <h3 className="line-clamp-1 text-[15px] font-semibold leading-snug text-stone-900">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 text-xs text-stone-500">
          <StarFilled className="!text-[11px] text-amber-500" />
          <span className="font-semibold text-stone-700">{product.rating.toFixed(1)}</span>
          <span className="text-stone-400">({product.ratingCount})</span>
        </div>

        <div className="mt-auto flex flex-col gap-2.5 pt-3">
          <p className="text-lg font-bold tracking-tight text-stone-900">
            {formatUnitPrice(product.price, product.unit)}
          </p>
          <Button
            block
            size="medium"
            shape="round"
            variant="solid"
            color="primary"
            icon={<ShoppingCartOutlined />}
            aria-label={`Add ${product.name} to cart`}
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product.id);
            }}
          >
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}