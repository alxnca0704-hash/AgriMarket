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
  const [selectedVariantId, setSelectedVariantId] = useState<string>();
  const [variantModalAction, setVariantModalAction] = useState<'cart' | 'buy' | null>(null);

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
  const variants = product?.variants?.filter((variant) => !variant.archived) ?? [];
  const activeVariantId = selectedVariantId ?? (variants.length === 1 ? variants[0].id : undefined);
  const selectedVariant = variants.find((variant) => variant.id === activeVariantId);

  const reviews: Review[] = useMemo(
    () => (Array.isArray(rawReviews) ? rawReviews.map(toReview) : []),
    [rawReviews]
  );
  const reviewsLoading = !skip && rawReviews === undefined;
  const reviewsError = rawReviews instanceof Error ? rawReviews.message : null;

  const cartQty = cart.items.find((i) => i.productId === productId && i.variantId === activeVariantId)?.qty ?? 0;

  const hasStock = variants.some((variant) => variant.stock > 0);
  const selectedHasStock = Boolean(selectedVariant && selectedVariant.stock > 0);
  const lowStock = Boolean(selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 20);

  const handleQtyChange = (value: number | null) => {
    if (!selectedVariant) return;
    setQty(Math.min(Math.max(1, value ?? 1), selectedVariant.stock));
  };
  const handleVariantSelect = (variantId: string) => { setSelectedVariantId(variantId); setQty(1); };

  const handleAddToCart = () => setVariantModalAction('cart');
  const handleBuyNow = () => setVariantModalAction('buy');

  const closeVariantModal = () => setVariantModalAction(null);

  const handleConfirmVariant = async () => {
    if (!product || !selectedVariant || !selectedHasStock) return;
    if (variantModalAction === 'cart') {
      void cart.addItem(product.id, selectedVariant.id, qty);
      message.success(`${product.name} added to cart`);
      closeVariantModal();
    } else if (variantModalAction === 'buy') {
      await cart.addItem(product.id, selectedVariant.id, qty);
      closeVariantModal();
      router.push(APP_ROUTES.checkout);
    }
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
    selectedVariantId: activeVariantId, selectedVariant, setSelectedVariantId,
    handleVariantSelect,
    selectedHasStock,
    variantModalAction,
    closeVariantModal,
    handleConfirmVariant,
    handleQtyChange,
    handleAddToCart,
    handleBuyNow,
    handleVisitShop,
  };
}
