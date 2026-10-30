'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, InputNumber, Modal, Result, Skeleton, Tag } from 'antd';
import {
  CheckCircleFilled,
  ShopOutlined,
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
    reviewsLoading,
    reviewsError,
    qty,
    cartQty,
    hasStock,
    lowStock,
    selectedVariantId, selectedVariant, handleVariantSelect, selectedHasStock,
    variantModalAction, closeVariantModal, handleConfirmVariant,
    handleQtyChange,
    handleAddToCart,
    handleBuyNow,
    handleVisitShop,
  } = useProductDetail(productId);

  const productRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : product?.rating ?? 0;
  const productRatingCount = reviews.length > 0 ? reviews.length : product?.ratingCount ?? 0;

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
  const variants = (product.variants ?? []).filter((variant) => !variant.archived);

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
                    Only {selectedVariant?.stock ?? 0} left
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
                  <span className="font-semibold text-stone-800">{productRating.toFixed(1)}</span>
                  <span className="text-stone-400">({productRatingCount})</span>
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
                {selectedVariant ? formatPrice(selectedVariant.price) : variants.length > 1 ? `${formatPrice(Math.min(...variants.map(v => v.price)))} - ${formatPrice(Math.max(...variants.map(v => v.price)))}` : formatPrice(product.price)}
              </p>
              {cartQty > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage bg-sage-soft px-3 py-1 rounded-full">
                  <CheckCircleFilled /> {cartQty} in cart
                </span>
              ) : selectedHasStock ? (
                <span className="text-xs text-stone-500 font-medium">
                  {selectedVariant?.stock} left
                </span>
              ) : null}
            </div>

            {/* Action Buttons (Desktop) */}
            <div className="hidden md:grid grid-cols-2 gap-3 pt-1">
              {actionButtons}
            </div>
          </div>
        </div>

        {/* About & Farm Information */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* About & Details */}
          <section className="lg:col-span-7 space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900">
                About this produce
              </h2>
              <p className="mt-1.5 text-sm sm:text-[15px] text-stone-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-tight text-stone-900">
                Farm to table details
              </h3>
              <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-stone-400">Origin</dt>
                  <dd className="mt-0.5 text-sm text-stone-700">{product.origin}</dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-stone-400">Storage</dt>
                  <dd className="mt-0.5 text-sm text-stone-700 leading-relaxed">
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
              <div className="rounded-2xl bg-white p-4 sm:p-5 space-y-4">
                <SellerCard seller={seller} />
                <Button
                  block
                  icon={<ShopOutlined />}
                  onClick={handleVisitShop}
                  className="!rounded-xl !h-11 !font-medium !border-stone-200 hover:!border-sage hover:!text-sage"
                >
                  Visit shop
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* Reviews Section — per product */}
        <section className="space-y-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900">
              Customer reviews
            </h2>
            <span className="text-xs sm:text-sm text-stone-400">
              {reviewsLoading ? 'loading…' : `${reviews.length} review${reviews.length === 1 ? '' : 's'} for this product`}
            </span>
          </div>
          <ReviewsList reviews={reviews} isLoading={reviewsLoading} error={reviewsError} />
        </section>
      </div>

      {/* Mobile Sticky Action Bar */}
      {hasStock && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur-md shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-6xl mx-auto px-4 pt-2.5 pb-3 flex flex-col gap-2">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="shrink-0 text-[11px] text-stone-400">Price</span>
              <p className="truncate text-lg font-bold text-stone-900">
                {selectedVariant ? formatPrice(selectedVariant.price) : `${formatPrice(Math.min(...variants.map(v => v.price)))} - ${formatPrice(Math.max(...variants.map(v => v.price)))}`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">{actionButtons}</div>
          </div>
        </div>
      )}

      <Modal
        title={variantModalAction === 'buy' ? 'Choose a type to buy' : 'Choose a type'}
        open={variantModalAction !== null}
        onCancel={closeVariantModal}
        onOk={() => void handleConfirmVariant()}
        okText={variantModalAction === 'buy' ? 'Buy now' : 'Add to cart'}
        okButtonProps={{ disabled: !selectedHasStock }}
        width="90%"
        style={{ maxWidth: 520 }}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                disabled={variant.stock <= 0}
                onClick={() => handleVariantSelect(variant.id)}
                className={`rounded-xl px-3 py-2 text-sm ${selectedVariantId === variant.id ? 'bg-sage text-white' : 'bg-stone-100 text-stone-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {variant.name}{variant.stock <= 0 ? ' · Sold out' : ''}
              </button>
            ))}
          </div>
          {selectedVariant ? (
            <div className="space-y-1">
              <p className="font-semibold text-stone-900">{formatPrice(selectedVariant.price)}</p>
              <p className="text-sm text-stone-500">{selectedVariant.stock} left</p>
              {selectedVariant.description && <p className="text-sm text-stone-600">{selectedVariant.description}</p>}
            </div>
          ) : (
            <p className="text-sm text-amber-700">Please select a type</p>
          )}
          {selectedHasStock && (
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-stone-700" htmlFor="variant-qty">Quantity</label>
              <InputNumber
                id="variant-qty"
                min={1}
                max={selectedVariant?.stock}
                value={qty}
                onChange={handleQtyChange}
                aria-label="Quantity"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
