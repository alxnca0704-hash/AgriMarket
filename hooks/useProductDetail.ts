'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { MOCK_CATALOG } from '@/lib/mockCatalog';
import { APP_ROUTES } from '@/constants/routes';
import { Product, Review, Seller } from '@/types/product';
import { useCartContext } from '@/components/buyer/CartProvider';

export function useProductDetail(productId: string) {
  const router = useRouter();
  const { message } = App.useApp();
  const cart = useCartContext();

  const [isLoading, setIsLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const product: Product | undefined = useMemo(
    () => MOCK_CATALOG.products.find((p) => p.id === productId),
    [productId]
  );

  const seller: Seller | undefined = useMemo(
    () => MOCK_CATALOG.sellers.find((s) => s.id === product?.sellerId),
    [product]
  );

  const reviews: Review[] = useMemo(
    () => MOCK_CATALOG.reviews.filter((r) => r.productId === productId),
    [productId]
  );

  const cartQty =
    cart.items.find((i) => i.productId === productId)?.qty ?? 0;

  const hasStock = product ? product.stockQty > 0 : false;
  const lowStock = product ? product.stockQty > 0 && product.stockQty <= 20 : false;

  const handleQtyChange = (value: number | null) => {
    if (!product) return;
    setQty(Math.min(Math.max(1, value ?? 1), product.stockQty));
  };

  const handleAddToCart = () => {
    if (!product) return;
    cart.addItem(product.id, qty);
    message.success(`${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    cart.addItem(product.id, qty);
    router.push(APP_ROUTES.cart);
  };

  const notFound = !isLoading && !product;

  return {
    isLoading,
    error: null,
    notFound,
    product,
    seller,
    reviews,
    qty,
    cartQty,
    hasStock,
    lowStock,
    handleQtyChange,
    handleAddToCart,
    handleBuyNow,
  };
}