'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { APP_ROUTES } from '@/constants/routes';
import { StallProfile } from '@/types/seller';
import { Product, Seller } from '@/types/product';
import { Review } from '@/types/review';
import { toBuyerProduct, toBuyerSeller, toSellerListing, toStallProfile } from '@/lib/convexSync';

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

export function useShop(stallId: string) {
  const router = useRouter();
  const skip = !isValidConvexId(stallId);

  const raw = useQuery(
    api.market.getPublicStall,
    skip ? 'skip' : { stallId: stallId as Id<'stalls'> }
  );
  const rawReviews = useQuery(
    api.reviews.listReviewsForStall,
    skip ? 'skip' : { stallId: stallId as Id<'stalls'> }
  );

  const isLoading = !skip && raw === undefined;
  const isFailed = raw instanceof Error;
  const notFound = skip || raw === null || (!isLoading && !raw && !isFailed);

  const stall: StallProfile | undefined = useMemo(() => {
    if (raw == null || isFailed) return undefined;
    return toStallProfile(raw.stall);
  }, [raw, isFailed]);

  const seller: Seller | undefined = useMemo(() => {
    if (raw == null || isFailed) return undefined;
    return toBuyerSeller(raw.stall, raw.ownerName);
  }, [raw, isFailed]);

  const products: Product[] = useMemo(() => {
    if (raw == null || isFailed) return [];
    return raw.products.map((p) => toBuyerProduct(p, raw.stall));
  }, [raw, isFailed]);

  // Also keep SellerListing array for potential stall-like usage
  const listings = useMemo(() => {
    if (raw == null || isFailed) return [];
    return raw.products.map((p) => toSellerListing(p));
  }, [raw, isFailed]);

  const reviews: Review[] = useMemo(
    () => (Array.isArray(rawReviews) ? rawReviews.map(toReview) : []),
    [rawReviews]
  );
  const reviewsLoading = !skip && rawReviews === undefined;
  const reviewsError = rawReviews instanceof Error ? rawReviews.message : null;

  const handleOpenProduct = (productId: string) => {
    router.push(APP_ROUTES.productDetail(productId));
  };

  const handleBackToHome = () => {
    router.push(APP_ROUTES.home);
  };

  return {
    isLoading,
    isFailed: isFailed ? (raw as unknown as Error).message : null,
    error: isFailed && raw instanceof Error ? raw.message : null,
    notFound: Boolean(notFound),
    stall,
    seller,
    products,
    listings,
    reviews,
    reviewsLoading,
    reviewsError,
    handleOpenProduct,
    handleBackToHome,
  };
}

export type UseShopReturn = ReturnType<typeof useShop>;
