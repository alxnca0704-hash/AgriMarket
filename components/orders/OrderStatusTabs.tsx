'use client';

import React from 'react';
import { ORDER_STATUS_TABS } from '@/constants/orders';

export type OrderStatusTabKey = (typeof ORDER_STATUS_TABS)[number]['key'] | 'all';

interface OrderStatusTabsProps {
  activeTab: OrderStatusTabKey;
  counts: Record<string, number>;
  onChange: (key: OrderStatusTabKey) => void;
}

export function OrderStatusTabs({ activeTab, counts, onChange }: OrderStatusTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
          activeTab === 'all'
            ? 'bg-[#2D6A4F] text-white'
            : 'bg-white text-stone-600 hover:bg-stone-100'
        }`}
      >
        All
        <span
          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
            activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
          }`}
        >
          {counts.all}
        </span>
      </button>

      {ORDER_STATUS_TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              isActive
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {tab.label}
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}