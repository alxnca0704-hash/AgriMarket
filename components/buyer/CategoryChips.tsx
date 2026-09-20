'use client';

import React from 'react';
import { AppstoreOutlined, AppleOutlined, RiseOutlined, SunOutlined } from '@ant-design/icons';
import { ALL_CATEGORIES, ProductCategory } from '@/constants/categories';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <AppstoreOutlined />,
  fruits: <AppleOutlined />,
  vegetables: <RiseOutlined />,
  grains: <SunOutlined />,
};

interface CategoryChipsProps {
  active: 'all' | ProductCategory;
  onChange: (key: 'all' | ProductCategory) => void;
}

export function CategoryChips({ active, onChange }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
      {ALL_CATEGORIES.map((category) => {
        const isActive = active === category.key;
        return (
          <button
            key={category.key}
            type="button"
            onClick={() => onChange(category.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-[#2D6A4F] text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span className={isActive ? 'text-white' : 'text-[#2D6A4F]'}>
              {CATEGORY_ICONS[category.key]}
            </span>
            {category.label}
          </button>
        );
      })}
    </div>
  );
}