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
    <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="w-12 h-12 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-xl shrink-0">
          <ShopOutlined />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-semibold text-stone-900 truncate">{seller.name}</h3>
            {seller.verified && (
              <SafetyCertificateOutlined className="text-[#2D6A4F] !text-sm" />
            )}
          </div>
          {seller.verified && (
            <p className="text-xs text-stone-400">Verified farm</p>
          )}
          <div className="flex items-center gap-1 text-sm text-stone-600 mt-1">
            <StarOutlined className="text-amber-500 !text-xs" />
            <span className="font-semibold text-stone-800">{seller.rating.toFixed(1)}</span>
            <span className="text-stone-400">({seller.ratingCount})</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-600">
        <div className="flex items-center gap-2">
          <EnvironmentOutlined className="text-[#2D6A4F]" />
          <span>
            {seller.location} · {formatDistance(seller.distanceKm)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TruckOutlined className="text-[#2D6A4F]" />
          <span>Delivery {formatPrice(seller.deliveryFeePeso)}</span>
        </div>
      </div>
    </div>
  );
}