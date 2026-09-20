'use client';

import React from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { DeliveryAddress } from '@/types/auth';
import { formatAddressSummary } from '@/lib/format';

interface AddressCardProps {
  address: DeliveryAddress;
  isDefault: boolean;
  onEdit: () => void;
  onSetDefault?: () => void;
  onRemove: () => void;
}

export function AddressCard({
  address,
  isDefault,
  onEdit,
  onSetDefault,
  onRemove,
}: AddressCardProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-900">
              <EnvironmentOutlined className="text-sage" />
              {address.label ?? 'Home'}
            </span>
            {isDefault && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sage bg-sage-soft px-2 py-0.5 rounded-full">
                <StarOutlined /> Default
              </span>
            )}
          </div>
          <p className="text-sm text-stone-500 mt-1.5 flex flex-wrap items-center gap-x-1.5">
            <span>{address.receiverName}</span>
            <span className="text-stone-300" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <PhoneOutlined className="text-stone-400 text-xs" />
              {address.receiverPhone}
            </span>
          </p>
          <p className="text-xs text-stone-400 mt-1.5 leading-relaxed line-clamp-2">
            {formatAddressSummary(address)}
          </p>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-x-2 gap-y-1">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-[#2D6A4F] px-2 py-1 rounded-lg hover:bg-stone-100/70 transition-colors cursor-pointer"
        >
          <EditOutlined /> Edit
        </button>
        {!isDefault && onSetDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-[#2D6A4F] px-2 py-1 rounded-lg hover:bg-stone-100/70 transition-colors cursor-pointer"
          >
            <StarOutlined /> Set as default
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-[#A64D42] hover:bg-red-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
        >
          <DeleteOutlined /> Remove
        </button>
      </div>
    </div>
  );
}