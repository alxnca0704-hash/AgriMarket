'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { APP_ROUTES } from '@/constants/routes';
import { Product, Seller } from '@/types/product';
import { Review } from '@/types/review';
import { toBuyerProduct, toBuyerSeller } from '@/lib/convexSync';
import { useCartContext } from '@/components/buyer/CartProvider';

function isValidConvexId(value: string): boolean {
  return /^[a-z0-9]{32}$/.test(value);
}

function toReview(raw: {
  _id: string;
  orderId: string;
  productId?: string;
  productName?: string;
  buyerId: string;
  sellerId: string;
  stallId: string;
  buyerName: string;
  rating: number;
  comment: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}): Review {
  return {
    id: raw._id,
    orderId: raw.orderId,
    productId: raw.productId,
    productName: raw.productName,
    buyerId: raw.buyerId,
    sellerId: raw.sellerId,
    stallId: raw.stallId,
    buyerName: raw.buyerName,
    rating: raw.rating,
    comment: raw.comment,
    reply: raw.reply,
    repliedAt: raw.repliedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function useProductDetail(productId: string) {
  const router = useRouter();
  const { message } = App.useApp();
  const cart = useCartContext();

  const [qty, setQty] = useState(1);

  const skip = !isValidConvexId(productId);
  const raw = useQuery(
    api.market.getPublicProduct,
    skip ? 'skip' : { productId: productId as Id<'products'> }
  );
  const rawReviews = useQuery(
    api.reviews.listReviewsForProduct,
    skip ? 'skip' : { productId: productId as Id<'products'> }
  );

  const isLoading = !skip && raw === undefined;
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
    () => (Array.isArray(rawReviews) ? rawReviews.map(toReview) : []),
    [rawReviews]
  );
  const reviewsLoading = !skip && rawReviews === undefined;
  const reviewsError = rawReviews instanceof Error ? rawReviews.message : null;

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

  const handleVisitShop = () => {
    if (!seller) return;
    router.push(APP_ROUTES.shop(seller.id));
  };

  const notFound = skip || (!isLoading && !product);

  return {
    isLoading,
    error: isFailed && raw instanceof Error ? raw.message : null,
    notFound,
    product,
    seller,
    reviews,
    reviewsLoading,
    reviewsError,
    qty,
    cartQty,
    hasStock,
    lowStock,
    handleQtyChange,
    handleAddToCart,
    handleBuyNow,
    handleVisitShop,
  };
}