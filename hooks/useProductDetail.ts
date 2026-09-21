'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { APP_ROUTES } from '@/constants/routes';
import { Product, Review, Seller } from '@/types/product';
import { toBuyerProduct, toBuyerSeller } from '@/lib/convexSync';
import { useCartContext } from '@/components/buyer/CartProvider';
import { MOCK_CATALOG } from '@/lib/mockCatalog';

export function useProductDetail(productId: string) {
  const router = useRouter();
  const { message } = App.useApp();
  const cart = useCartContext();

  const [qty, setQty] = useState(1);

  const raw = useQuery(api.market.getPublicProduct, { productId: productId as Id<'products'> });

  const isLoading = raw === undefined;
  const isFailed = raw instanceof Error;

  const product: Product | undefined = useMemo(
    () => (raw == null || isFailed ? undefined : toBuyerProduct(raw.product, raw.stall)),
    [raw, isFailed]
  );

  const seller: Seller | undefined = useMemo(
    () => (raw == null || isFailed ? undefined : toBuyerSeller(raw.stall, raw.ownerName)),
    [raw, isFailed]
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

  const handleBuyNow = async () => {
    if (!product) return;
    await cart.addItem(product.id, qty);
    router.push(APP_ROUTES.checkout);
  };

  const notFound = !isLoading && !product;

  return {
    isLoading,
    error: isFailed && raw instanceof Error ? raw.message : null,
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