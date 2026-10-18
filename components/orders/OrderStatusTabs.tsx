'use client';

import React from 'react';
import { ORDER_LIST_FILTERS, OrderListFilter } from '@/constants/orders';

interface OrderStatusTabsProps {
  activeTab: OrderListFilter;
  counts: Record<OrderListFilter, number>;
  onChange: (key: OrderListFilter) => void;
}

export function OrderStatusTabs({ activeTab, counts, onChange }: OrderStatusTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter orders">
      {ORDER_LIST_FILTERS.map((filter) => {
        const isActive = activeTab === filter.key;
        return (
          <button
            key={filter.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(filter.key)}
            className={`shrink-0 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors ${
              isActive ? 'bg-sage text-white' : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {filter.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
              {counts[filter.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
