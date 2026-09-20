'use client';

import React from 'react';
import { ALL_CATEGORIES, ProductCategory } from '@/constants/categories';

interface CategoryChipsProps {
  active: 'all' | ProductCategory;
  onChange: (key: 'all' | ProductCategory) => void;
}

export function CategoryChips({ active, onChange }: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {ALL_CATEGORIES.map((category) => {
        const isActive = active === category.key;
        return (
          <button
            key={category.key}
            type="button"
            onClick={() => onChange(category.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
              isActive
                ? 'bg-sage text-white'
                : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}