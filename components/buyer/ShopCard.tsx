'use client';

import React from 'react';
import { CheckCircleFilled, EnvironmentOutlined, ShopOutlined, StarFilled } from '@ant-design/icons';
import { Tag } from 'antd';
import { Seller } from '@/types/product';
import { formatPrice } from '@/lib/format';

interface ShopCardProps {
  seller: Seller;
  productCount: number;
  onOpen: (stallId: string) => void;
}

export function ShopCard({ seller, productCount, onOpen }: ShopCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(seller.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(seller.id);
      }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/30"
    >
      <div className="w-full bg-white p-1.5">
        <div className="w-full overflow-hidden rounded-xl bg-stone-50" style={{ aspectRatio: '16 / 10' }}>
          {seller.avatarUrl ? (
            <img
              src={seller.avatarUrl}
              alt={seller.farmName}
              className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.04]"
              loading="lazy"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-sage-soft text-sage">
              <ShopOutlined className="text-3xl" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-3.5 pb-3.5 pt-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[14px] font-semibold leading-snug text-stone-900 flex-1">
            {seller.farmName}
          </h3>
          {seller.verified && (
            <Tag
              icon={<CheckCircleFilled className="text-[10px]" />}
              className="!m-0 !border-none !rounded-full !bg-sage-soft !px-2 !py-0.5 !text-sage !text-[10px] !font-semibold shrink-0"
            >
              Verified
            </Tag>
          )}
        </div>

        <p className="flex items-center gap-1 text-[11px] text-stone-500 truncate">
          <EnvironmentOutlined className="text-sage text-[11px] shrink-0" />
          <span className="truncate">{seller.location || seller.province}</span>
        </p>

        <div className="flex items-center gap-1.5 text-[11px]">
          <StarFilled className="text-amber-500 text-[11px]" />
          <span className="font-semibold text-stone-800">{seller.rating.toFixed(1)}</span>
          <span className="text-stone-400">({seller.ratingCount})</span>
          <span className="text-stone-300">·</span>
          <span className="text-stone-500">{productCount} products</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-xs text-stone-500">
            Delivery <span className="font-semibold text-stone-800">{formatPrice(seller.deliveryFeePeso)}</span>
          </span>
          <span className="text-[11px] font-medium text-sage group-hover:text-[#1e4a38] transition-colors">
            Visit shop →
          </span>
        </div>
      </div>
    </div>
  );
}
