'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Image, InputNumber, Result, Skeleton, Tag } from 'antd';
import {
  CalendarOutlined,
  CheckCircleFilled,
  CloudOutlined,
  EnvironmentOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useProductDetail } from '@/hooks/useProductDetail';
import { SellerCard } from '@/components/buyer/SellerCard';
import { ReviewsList } from '@/components/buyer/ReviewsList';
import { APP_ROUTES } from '@/constants/routes';
import { CATEGORY_OPTIONS } from '@/constants/categories';
import { formatPrice, formatUnitPrice } from '@/lib/format';

function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 space-y-7 sm:space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 lg:gap-12 items-start">
        <Skeleton.Image active className="!w-full !rounded-2xl !aspect-square" />
        <div className="space-y-5">
          <Skeleton.Input active className="!w-24" />
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: '70%' }} />
          <Skeleton active paragraph={{ rows: 1 }} title={false} />
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
          <Skeleton.Button active block className="!h-14" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm p-5 sm:p-7">
          <Skeleton active paragraph={{ rows: 3 }} title={{ width: '40%' }} />
        </div>
        <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6">
          <Skeleton active paragraph={{ rows: 3 }} title={{ width: '60%' }} />
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
      <div className="max-w-6xl mx-auto px-4 py-16">
        <Result
          status="404"
          title="Product not found"
          subTitle="This item may have been removed or is temporarily unavailable."
          extra={<Button type="primary" onClick={() => router.push(APP_ROUTES.home)}>Back to home</Button>}
        />
      </div>
    );
  }

  const categoryLabel =
    CATEGORY_OPTIONS.find((c) => c.key === product.category)?.label ?? product.category;

  const actionButtons = (
    <>
      <Button
        size="large"
        block
        variant="solid"
        color="primary"
        icon={<ShoppingCartOutlined />}
        disabled={!hasStock}
        onClick={handleAddToCart}
      >
        Add to cart
      </Button>
      <Button
        size="large"
        block
        variant="outlined"
        color="primary"
        icon={<ShoppingOutlined />}
        disabled={!hasStock}
        onClick={handleBuyNow}
      >
        Buy now
      </Button>
    </>
  );

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-32 md:pb-10 pt-5 sm:pt-8 space-y-7 sm:space-y-10">
        {error && (
          <Alert type="error" title={error} showIcon />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 lg:gap-12 items-start">
          <div className="rounded-2xl overflow-hidden bg-[#F3EFE6] shadow-sm">
            <Image
              src={product.imageUrl}
              alt={product.name}
              className="!w-full aspect-square object-cover"
              height={600}
              preview={{ cover: <span className="text-sm">View</span> }}
            />
          </div>

          <div className="space-y-5 sm:space-y-6">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="!m-0 !border-none !rounded-full !bg-sage-soft !px-2.5 !py-0.5 !text-sage !text-xs !font-semibold capitalize">
                  {categoryLabel}
                </Tag>
                {lowStock && (
                  <Tag color="warning" className="!m-0 !rounded-full !text-xs !font-medium">
                    Only {product.stockQty} left
                  </Tag>
                )}
                {!hasStock && (
                  <Tag color="error" className="!m-0 !rounded-full !text-xs !font-medium">
                    Sold out
                  </Tag>
                )}
              </div>

              <h1 className="text-[26px] sm:text-3xl lg:text-[34px] font-semibold tracking-tight text-stone-900">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-500">
                <StarFilled className="!text-sm text-amber-500" />
                <span className="font-semibold text-stone-800">{product.rating.toFixed(1)}</span>
                <span>· {product.ratingCount} ratings</span>
                <span className="text-stone-300">·</span>
                <span>{product.tags.join(', ')}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3.5 sm:px-5">
              <p className="text-[26px] sm:text-3xl font-bold tracking-tight text-stone-900">
                {formatUnitPrice(product.price, product.unit)}
              </p>
              {cartQty > 0 ? (
                <span className="text-sm font-medium text-sage">
                  <CheckCircleFilled className="mr-1" />
                  {cartQty} in cart
                </span>
              ) : (
                <span className="text-sm text-stone-400">{product.stockQty} available</span>
              )}
            </div>

            {hasStock && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-stone-700">Quantity</span>
                <InputNumber
                  size="large"
                  min={1}
                  max={product.stockQty}
                  value={qty}
                  onChange={handleQtyChange}
                  className="!w-32 !rounded-xl"
                  aria-label="Quantity"
                />
              </div>
            )}

            <div className="hidden md:grid grid-cols-2 gap-3 pt-1">{actionButtons}</div>
          </div>
        </div>

        {seller && (
          <section>
            <SellerCard seller={seller} />
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-7 lg:col-span-2">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900 mb-2 sm:mb-3">
              About this product
            </h2>
            <p className="text-sm sm:text-[15px] text-stone-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-semibold tracking-tight text-stone-900 mb-4">
              Farm to table
            </h2>
            <dl className="divide-y divide-stone-100">
              <div className="flex items-start gap-3.5 pb-4">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center text-lg">
                  <CalendarOutlined />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm font-semibold text-stone-800">Harvest date</dt>
                  <dd className="text-sm text-stone-500 mt-0.5">
                    {new Date(product.harvestDate).toLocaleDateString('en-PH', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3.5 py-4">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center text-lg">
                  <EnvironmentOutlined />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm font-semibold text-stone-800">Origin</dt>
                  <dd className="text-sm text-stone-500 mt-0.5">{product.origin}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3.5 pt-4">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center text-lg">
                  <CloudOutlined />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm font-semibold text-stone-800">Storage tips</dt>
                  <dd className="text-sm text-stone-500 mt-0.5 leading-relaxed">
                    {product.storageTips}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </section>

        <section>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900 mb-3 sm:mb-4">
            Reviews <span className="text-stone-400 font-normal">({reviews.length})</span>
          </h2>
          <ReviewsList reviews={reviews} />
        </section>
      </div>

      {hasStock && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur shadow-[0_-8px_30px_-12px_rgba(28,25,23,0.15)] pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="shrink-0">
              <p className="text-[11px] text-stone-400">Total</p>
              <p className="text-lg font-bold text-stone-900">
                {formatPrice(product.price * qty)}
              </p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">{actionButtons}</div>
          </div>
        </div>
      )}
    </div>
  );
}