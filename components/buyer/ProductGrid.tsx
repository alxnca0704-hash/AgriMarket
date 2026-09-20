'use client';

import React from 'react';
import { Product, Seller } from '@/types/product';
import { ProductCard } from '@/components/buyer/ProductCard';

interface ProductGridProps {
  products: Product[];
  sellers: Map<string, Seller>;
  onOpen: (productId: string) => void;
}

export function ProductGrid({ products, sellers, onOpen }: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-4 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-5 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => {
        const seller = sellers.get(product.sellerId);
        if (!seller) return null;
        return <ProductCard key={product.id} product={product} seller={seller} onOpen={onOpen} />;
      })}
    </div>
  );
}