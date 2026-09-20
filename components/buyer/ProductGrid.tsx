'use client';

import React from 'react';
import { Product, Seller } from '@/types/product';
import { ProductCard } from '@/components/buyer/ProductCard';

interface ProductGridProps {
  products: Product[];
  sellers: Map<string, Seller>;
  onOpen: (productId: string) => void;
  onQuickAdd: (productId: string) => void;
}

export function ProductGrid({
  products,
  sellers,
  onOpen,
  onQuickAdd,
}: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => {
        const seller = sellers.get(product.sellerId);
        if (!seller) return null;
        return (
          <ProductCard
            key={product.id}
            product={product}
            seller={seller}
            onOpen={onOpen}
            onQuickAdd={onQuickAdd}
          />
        );
      })}
    </div>
  );
}