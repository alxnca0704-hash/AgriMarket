'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Empty, Image, Rate, Skeleton, Tag } from 'antd';
import {
  EnvironmentOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { usePublicStall } from '@/hooks/usePublicStall';
import { FARM_TYPE_LABELS } from '@/constants/stall';
import { APP_ROUTES } from '@/constants/routes';
import { formatPrice } from '@/lib/format';

function PublicStallSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-4">
      <Skeleton.Button active block className="!h-52 !rounded-3xl" />
      <Skeleton active paragraph={{ rows: 4 }} title={{ width: '40%' }} />
    </div>
  );
}

export function PublicStallView({ stallId }: { stallId: string }) {
  const router = useRouter();
  const { isLoading, notFound, stall, activeListings, reviews, activeView } =
    usePublicStall(stallId);

  if (isLoading) return <PublicStallSkeleton />;

  if (notFound) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-stone-500">This farm could not be found.</span>}
        >
          <Button
            type="primary"
            onClick={() => router.push(APP_ROUTES.home)}
            className="!rounded-xl"
          >
            Back to store
          </Button>
        </Empty>
      </div>
    );
  }

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : stall.rating;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-6">
      <div className="rounded-3xl bg-white shadow-sm p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Image
            src={stall.photoUrl}
            alt={stall.stallName}
            preview={false}
            className="!w-24 !h-24 !rounded-3xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
                {stall.stallName}
              </h1>
              {stall.verification.status === 'verified' && (
                <Tag
                  icon={<SafetyCertificateOutlined />}
                  color="success"
                  className="!m-0 !border-none !rounded-full"
                >
                  Verified
                </Tag>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <Rate disabled allowHalf value={averageRating} className="!text-sm" />
                <strong className="text-stone-800">{averageRating.toFixed(1)}</strong>
                <span>({stall.ratingCount})</span>
              </span>
              <span>{activeListings.length} products</span>
              {stall.pickupAvailable && <span>Pickup available</span>}
            </div>
            <p className="text-sm text-stone-600 mt-3 leading-relaxed">{stall.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-stone-900">
                <ShoppingOutlined className="mr-2 text-sage" />
                Products from {stall.stallName}
              </h2>
            </div>
            {activeListings.length === 0 ? (
              <div className="rounded-2xl bg-white shadow-sm py-10">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span className="text-stone-500">No active products right now.</span>}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                {activeListings.map((listing) => (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => router.push(APP_ROUTES.productDetail(listing.id))}
                    className="rounded-2xl bg-white shadow-sm overflow-hidden text-left cursor-pointer transition-shadow hover:shadow-md group"
                  >
                    <Image
                      src={listing.imageUrl}
                      alt={listing.name}
                      preview={false}
                      className="!w-full !aspect-[18/10] object-cover"
                    />
                    <div className="p-2.5">
                      <p className="text-[13px] font-medium text-stone-800 truncate group-hover:text-[#2D6A4F]">
                        {listing.name}
                      </p>
                      <p className="text-[13px] font-semibold text-stone-900 mt-0.5">
                        {formatPrice(listing.price)}
                        <span className="text-[11px] font-normal text-stone-400"> / {listing.unit}</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-3">Reviews</h2>
            {reviews.length === 0 ? (
              <div className="rounded-2xl bg-white shadow-sm py-8">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No reviews yet." />
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl bg-white shadow-sm p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900">{review.author}</p>
                        <p className="text-xs text-stone-400">
                          {review.productName} · {new Date(review.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Rate disabled allowHalf value={review.rating} className="!text-xs shrink-0" />
                    </div>
                    <p className="text-sm text-stone-600 mt-2 leading-relaxed">{review.comment}</p>
                    {review.reply && (
                      <div className="mt-3 rounded-xl bg-sage-soft/60 px-3.5 py-2.5 text-sm text-stone-700">
                        <p className="font-semibold text-[#2D6A4F] text-xs mb-1">Reply from {stall.stallName}</p>
                        {review.reply.reply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-4 space-y-5">
          <section className="rounded-2xl bg-white shadow-sm p-5">
            <h2 className="text-sm font-semibold text-stone-900 mb-1">Farm type</h2>
            <p className="text-sm text-stone-600">
              {FARM_TYPE_LABELS[stall.farmType as keyof typeof FARM_TYPE_LABELS] ?? stall.farmType}
            </p>
          </section>
          <section className="rounded-2xl bg-white shadow-sm p-5">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Shipping</h2>
            <div className="space-y-3 text-sm text-stone-600">
              <p className="flex items-center justify-between">
                <span>Delivery fee</span>
                <span className="font-semibold text-stone-900">{formatPrice(stall.deliveryFeePeso)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Pickup</span>
                <span className="font-semibold text-stone-900">
                  {stall.pickupAvailable ? 'Available' : 'Not offered'}
                </span>
              </p>
            </div>
          </section>
          <section className="rounded-2xl bg-white shadow-sm p-5">
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center">
                <EnvironmentOutlined />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                  <HomeOutlined className="!text-sage" /> {stall.location.cityMunicipality}
                </h2>
                <p className="text-sm text-stone-500 mt-1 leading-relaxed">
                  {stall.location.streetBuilding}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {stall.location.barangay}, {stall.location.province} {stall.location.postalCode}
                </p>
              </div>
            </div>
          </section>
          {activeView === 'seller' && (
            <Button
              block
              size="large"
              onClick={() => router.push(APP_ROUTES.sellerStall)}
              className="!rounded-xl"
            >
              Edit this stall
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}