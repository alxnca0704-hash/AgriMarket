'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, InputNumber, Result, Skeleton, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CloudOutlined,
  EnvironmentOutlined,
  MinusOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useProductDetail } from '@/hooks/useProductDetail';
import { SellerCard } from '@/components/buyer/SellerCard';
import { ReviewsList } from '@/components/buyer/ReviewsList';
import { ProductGallery } from '@/components/buyer/ProductGallery';
import { APP_ROUTES } from '@/constants/routes';
import { CATEGORY_OPTIONS } from '@/constants/categories';
import { formatPrice } from '@/lib/format';

function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-10 pb-16 space-y-10 sm:space-y-14">
      <Skeleton.Button active className="!w-24 !h-8 !rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7">
          <Skeleton.Image active className="!w-full !aspect-square !rounded-3xl" />
        </div>
        <div className="lg:col-span-5 space-y-6 lg:pt-2">
          <Skeleton.Input active className="!w-24" />
          <Skeleton active paragraph={{ rows: 2 }} title={{ width: '70%' }} />
          <Skeleton.Input active className="!w-44 !h-10" />
          <Skeleton.Button active block className="!h-12 !rounded-xl" />
          <Skeleton.Button active block className="!h-12 !rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7 space-y-5">
          <Skeleton active paragraph={{ rows: 4 }} title={{ width: '40%' }} />
        </div>
        <div className="lg:col-span-5 space-y-5">
          <Skeleton active paragraph={{ rows: 3 }} title={{ width: '50%' }} />
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
    return <ProductDetailSkeleton />;
  }

  if (notFound || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <Result
          status="404"
          title="Product not found"
          subTitle="This item may have been removed or is temporarily unavailable."
          extra={
            <Button
              type="primary"
              onClick={() => router.push(APP_ROUTES.home)}
              className="!rounded-xl"
            >
              Back to home
            </Button>
          }
        />
      </div>
    );
  }

  const categoryLabel =
    CATEGORY_OPTIONS.find((c) => c.key === product.category)?.label ?? product.category;

  const actionButtons = (
    <>
      <Button
        type="primary"
        size="large"
        block
        icon={<ShoppingCartOutlined />}
        disabled={!hasStock}
        onClick={handleAddToCart}
        className="!rounded-xl !h-12 !font-semibold"
      >
        Add to cart
      </Button>
      <Button
        size="large"
        block
        icon={<ShoppingOutlined />}
        disabled={!hasStock}
        onClick={handleBuyNow}
        className="!rounded-xl !h-12 !font-semibold !border-stone-200 hover:!border-sage hover:!text-sage"
      >
        Buy now
      </Button>
    </>
  );

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-32 md:pb-12 sm:pt-8 space-y-10 sm:space-y-14">
        {error && <Alert type="error" title={error} showIcon />}

        {/* Back navigation */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeftOutlined className="text-xs transition-transform group-hover:-translate-x-0.5" />
            <span>Back to products</span>
          </button>
        </div>

        {/* Product Hero: Image + Purchase Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Product Image */}
          <div className="lg:col-span-7">
            <ProductGallery
              name={product.name}
              images={product.images}
            />
          </div>

          {/* Product Purchase Info */}
          <div className="lg:col-span-5 flex flex-col space-y-7 lg:pt-2">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="!m-0 !border-none !rounded-full !bg-sage-soft !px-3 !py-1 !text-sage !text-xs !font-semibold capitalize">
                  {categoryLabel}
                </Tag>
                {lowStock && (
                  <Tag color="warning" className="!m-0 !border-none !rounded-full !px-3 !py-1 !text-xs !font-medium">
                    Only {product.stockQty} left
                  </Tag>
                )}
                {!hasStock && (
                  <Tag color="error" className="!m-0 !border-none !rounded-full !px-3 !py-1 !text-xs !font-medium">
                    Sold out
                  </Tag>
                )}
              </div>

              <h1 className="text-[28px] sm:text-3xl lg:text-4xl font-semibold tracking-tight text-stone-900 leading-snug">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-stone-500">
                <div className="flex items-center gap-1">
                  <StarFilled className="!text-xs text-amber-500" />
                  <span className="font-semibold text-stone-800">{product.rating.toFixed(1)}</span>
                  <span className="text-stone-400">({product.ratingCount})</span>
                </div>
                {seller && (
                  <>
                    <span className="text-stone-300">·</span>
                    <span className="text-stone-600 truncate">{seller.farmName || seller.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Price & Stock */}
            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
                {formatPrice(product.price)}
                <span className="ml-1.5 text-sm font-normal text-stone-400">
                  / {product.unit}
                </span>
              </p>
              {cartQty > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage bg-sage-soft px-3 py-1 rounded-full">
                  <CheckCircleFilled /> {cartQty} in cart
                </span>
              ) : hasStock ? (
                <span className="text-xs text-stone-500 font-medium">
                  {product.stockQty} in stock
                </span>
              ) : null}
            </div>

            {/* Quantity Selector */}
            {hasStock && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-stone-700" htmlFor="qty">
                    Quantity
                  </label>
                  <span className="text-sm text-stone-500">
                    Subtotal:{' '}
                    <strong className="text-stone-900">{formatPrice(product.price * qty)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={qty <= 1}
                    onClick={() => handleQtyChange(qty - 1)}
                    className="w-10 h-10 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-stone-600 text-xs transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <MinusOutlined />
                  </button>
                  <InputNumber
                    id="qty"
                    size="large"
                    min={1}
                    max={product.stockQty}
                    value={qty}
                    onChange={handleQtyChange}
                    className="!w-24 !rounded-xl text-center"
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    disabled={qty >= product.stockQty}
                    onClick={() => handleQtyChange(qty + 1)}
                    className="w-10 h-10 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-stone-600 text-xs transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <PlusOutlined />
                  </button>
                  <span className="text-xs text-stone-400 ml-2">
                    {product.unit}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons (Desktop) */}
            <div className="hidden md:grid grid-cols-2 gap-3 pt-1">
              {actionButtons}
            </div>

            {/* Direct Farm Badges */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-stone-500 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircleFilled className="text-sage text-sm" />
                Harvested fresh
              </span>
              <span className="inline-flex items-center gap-1.5">
                <SafetyCertificateOutlined className="text-sage text-sm" />
                Verified farm origin
              </span>
            </div>
          </div>
        </div>

        {/* About & Farm Information */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* About & Details */}
          <section className="lg:col-span-7 space-y-9">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 mb-3.5">
                About this produce
              </h2>
              <p className="text-sm sm:text-[15px] text-stone-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-tight text-stone-900 mb-5">
                Farm to table details
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                <div>
                  <CalendarOutlined className="text-lg text-sage" />
                  <dt className="mt-2.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Harvested
                  </dt>
                  <dd className="mt-1 text-sm text-stone-700">
                    {new Date(product.harvestDate).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </dd>
                </div>

                <div>
                  <EnvironmentOutlined className="text-lg text-sage" />
                  <dt className="mt-2.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Origin
                  </dt>
                  <dd className="mt-1 text-sm text-stone-700">{product.origin}</dd>
                </div>

                <div>
                  <CloudOutlined className="text-lg text-sage" />
                  <dt className="mt-2.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Storage
                  </dt>
                  <dd className="mt-1 text-sm text-stone-700 leading-relaxed">
                    {product.storageTips}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* From the Farm */}
          {seller && (
            <section className="lg:col-span-5 space-y-5">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900">
                From the farm
              </h2>
              <SellerCard seller={seller} />
            </section>
          )}
        </div>

        {/* Reviews Section */}
        <section className="space-y-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900">
              Customer reviews
            </h2>
            <span className="text-xs sm:text-sm text-stone-400">
              {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </span>
          </div>
          <ReviewsList reviews={reviews} />
        </section>
      </div>

      {/* Mobile Sticky Action Bar */}
      {hasStock && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur-md shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="shrink-0">
              <p className="text-[11px] text-stone-400">Total ({qty} {product.unit})</p>
              <p className="text-lg font-bold text-stone-900">
                {formatPrice(product.price * qty)}
              </p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2.5">{actionButtons}</div>
          </div>
        </div>
      )}
    </div>
  );
}