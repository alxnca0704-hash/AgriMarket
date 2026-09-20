'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Image, InputNumber, Result, Skeleton, Tag } from 'antd';
import {
  CheckCircleFilled,
  EnvironmentOutlined,
  ShoppingOutlined,
  StarOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { useProductDetail } from '@/hooks/useProductDetail';
import { SellerCard } from '@/components/buyer/SellerCard';
import { ReviewsList } from '@/components/buyer/ReviewsList';
import { APP_ROUTES } from '@/constants/routes';
import { formatPrice, formatUnitPrice } from '@/lib/format';

function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Skeleton.Image active className="!w-full !aspect-square" />
        <div className="space-y-4">
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailView({ productId }: { productId: string }) {
  const router = useRouter();
  const {
    isLoading,
    error,
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
  } = useProductDetail(productId);

  if (isLoading) {
    return (
      <div>
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Result
          status="404"
          title="Product not found"
          subTitle="This item may have been removed or is temporarily unavailable."
          extra={<Button type="primary" onClick={() => router.push(APP_ROUTES.home)} className="!bg-[#2D6A4F]">Back to home</Button>}
        />
      </div>
    );
  }

  const actionButtons = (
    <>
      <Button
        size="large"
        block
        icon={<ShoppingOutlined />}
        disabled={!hasStock}
        onClick={handleAddToCart}
        className="!h-11 !rounded-xl !bg-white !text-[#2D6A4F] !border-[#2D6A4F] hover:!bg-[#E9F0EB]"
      >
        Add to cart
      </Button>
      <Button
        size="large"
        block
        type="primary"
        disabled={!hasStock}
        onClick={handleBuyNow}
        className="!h-11 !rounded-xl !bg-[#2D6A4F] hover:!bg-[#1B4332]"
      >
        Buy now
      </Button>
    </>
  );

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} showIcon />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
            <Image
              src={product.imageUrl}
              alt={product.name}
              className="!w-full aspect-square object-cover"
              height={600}
              preview={{ cover: <span className="text-sm">View</span> }}
            />
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="!rounded-full !bg-[#2D6A4F]/5 !border-none !text-[#2D6A4F]">
                  {product.category}
                </Tag>
                {lowStock && (
                  <Tag color="warning" className="!rounded-full">
                    Low stock — {product.stockQty} left
                  </Tag>
                )}
                {!hasStock && (
                  <Tag color="error" className="!rounded-full">
                    Sold out
                  </Tag>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
                {product.name}
              </h1>
              <div className="flex items-center gap-1.5 text-sm text-stone-500 mt-1.5">
                <StarOutlined className="text-amber-500" />
                <span className="font-semibold text-stone-800">{product.rating.toFixed(1)}</span>
                <span>· {product.ratingCount} ratings</span>
                <span className="text-stone-300">·</span>
                <span>{product.tags.join(', ')}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-stone-900">
                {formatUnitPrice(product.price, product.unit)}
              </span>
              {cartQty > 0 && (
                <span className="text-xs text-[#2D6A4F] font-medium">
                  <CheckCircleFilled /> {cartQty} in cart
                </span>
              )}
            </div>

            {hasStock && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-stone-500">Quantity</span>
                <InputNumber
                  min={1}
                  max={product.stockQty}
                  value={qty}
                  onChange={handleQtyChange}
                  size="large"
                  className="!rounded-lg"
                  aria-label="Quantity"
                />
                <span className="text-sm text-stone-400">
                  {product.stockQty} available
                </span>
              </div>
            )}

            <div className="hidden md:flex gap-3 pt-1">{actionButtons}</div>
          </div>
        </div>

        {seller && (
          <div className="mt-6">
            <SellerCard seller={seller} />
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white shadow-sm p-4 flex items-start gap-3">
            <TagOutlined className="text-[#2D6A4F] text-lg mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-stone-800">Harvest date</p>
              <p className="text-sm text-stone-500 mt-0.5">
                {new Date(product.harvestDate).toLocaleDateString('en-PH', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white shadow-sm p-4 flex items-start gap-3">
            <EnvironmentOutlined className="text-[#2D6A4F] text-lg mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-stone-800">Origin</p>
              <p className="text-sm text-stone-500 mt-0.5">{product.origin}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white shadow-sm p-4 flex items-start gap-3">
            <CheckCircleFilled className="text-[#2D6A4F] text-lg mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-stone-800">Storage tips</p>
              <p className="text-sm text-stone-500 mt-0.5 leading-relaxed">
                {product.storageTips}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white shadow-sm p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-stone-900 mb-2">About this product</h2>
          <p className="text-sm text-stone-600 leading-relaxed">{product.description}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-3">
            Reviews <span className="text-stone-400 font-normal">({reviews.length})</span>
          </h2>
          <ReviewsList reviews={reviews} />
        </div>
      </div>

      {hasStock && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-stone-100 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="shrink-0">
              <p className="text-[11px] text-stone-400">Total</p>
              <p className="text-lg font-bold text-stone-900">
                {formatPrice(product.price * qty)}
              </p>
            </div>
            <div className="flex-1 flex gap-3">{actionButtons}</div>
          </div>
        </div>
      )}
    </div>
  );
}