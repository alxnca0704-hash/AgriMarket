'use client';

import React from 'react';
import {
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  StarFilled,
  TruckOutlined,
} from '@ant-design/icons';
import { Seller } from '@/types/product';
import { formatDistance, formatPrice } from '@/lib/format';

export function SellerCard({ seller }: { seller: Seller }) {
  const showOperator = seller.name.trim() && seller.name.trim() !== seller.farmName.trim();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {seller.avatarUrl ? (
          <img
            src={seller.avatarUrl}
            alt={seller.farmName}
            className="w-11 h-11 rounded-2xl object-cover shrink-0"
          />
        ) : (
          <span className="w-11 h-11 rounded-2xl bg-sage-soft text-sage flex items-center justify-center text-lg shrink-0">
            <ShopOutlined />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-stone-900">
              {seller.farmName || seller.name}
            </h3>
            {seller.verified && (
              <SafetyCertificateOutlined className="text-sage text-sm shrink-0" />
            )}
          </div>
          {showOperator && (
            <p className="mt-0.5 truncate text-xs text-stone-500">
              Operated by {seller.name}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-sm">
          <StarFilled className="!text-xs text-amber-500" />
          <span className="font-semibold text-stone-800">{seller.rating.toFixed(1)}</span>
          <span className="text-xs text-stone-400">({seller.ratingCount})</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <EnvironmentOutlined className="text-sage shrink-0" />
          <span className="truncate">
            {seller.location} · {formatDistance(seller.distanceKm)} away
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TruckOutlined className="text-sage shrink-0" />
          Delivery {formatPrice(seller.deliveryFeePeso)}
        </span>
      </div>
    </div>
  );
}
