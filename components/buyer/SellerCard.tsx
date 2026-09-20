'use client';

import React from 'react';
import {
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  StarOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { Seller } from '@/types/product';
import { formatDistance, formatPrice } from '@/lib/format';

export function SellerCard({ seller }: { seller: Seller }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3.5">
        <span className="w-12 h-12 rounded-2xl bg-sage-soft text-sage flex items-center justify-center text-xl shrink-0">
          <ShopOutlined />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-semibold text-stone-900 truncate">
              {seller.farmName || seller.name}
            </h3>
            {seller.verified && (
              <SafetyCertificateOutlined className="text-sage text-sm" />
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Operated by {seller.name}
          </p>
          <div className="flex items-center gap-1 text-xs sm:text-sm text-stone-600 mt-1.5">
            <StarOutlined className="text-amber-500 !text-xs" />
            <span className="font-semibold text-stone-800">{seller.rating.toFixed(1)}</span>
            <span className="text-stone-400">({seller.ratingCount} reviews)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-stone-600">
        <span className="inline-flex items-center gap-2">
          <EnvironmentOutlined className="text-sage shrink-0" />
          <span className="truncate">
            {seller.location} · {formatDistance(seller.distanceKm)} away
          </span>
        </span>
        <span className="inline-flex items-center gap-2">
          <TruckOutlined className="text-sage shrink-0" />
          Delivery {formatPrice(seller.deliveryFeePeso)}
        </span>
      </div>
    </div>
  );
}