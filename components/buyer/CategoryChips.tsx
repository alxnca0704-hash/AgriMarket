'use client';

import React from 'react';
import { ALL_CATEGORIES, ProductCategory } from '@/constants/categories';

interface CategoryChipsProps {
  active: 'all' | ProductCategory;
  onChange: (key: 'all' | ProductCategory) => void;
  scrollable?: boolean;
}

export function CategoryChips({ active, onChange, scrollable = false }: CategoryChipsProps) {
  return (
    <div
      className={
        scrollable
          ? 'flex gap-2 overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'flex flex-wrap gap-2.5'
      }
    >
      {ALL_CATEGORIES.map((category) => {
        const isActive = active === category.key;
        return (
          <button
            key={category.key}
            type="button"
            onClick={() => onChange(category.key)}
            className={`${
              scrollable ? 'shrink-0 whitespace-nowrap px-4 py-2' : 'px-4 py-2.5'
            } text-sm font-medium rounded-full transition-colors cursor-pointer ${
              isActive
                ? 'bg-sage text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100 active:bg-stone-100'
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}