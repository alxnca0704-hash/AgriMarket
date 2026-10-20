'use client';

import React from 'react';
import { Badge, Button, Select } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { SORT_OPTIONS, SortOption } from '@/constants/sortOptions';
import { ProductCategory } from '@/constants/categories';
import { CategoryChips } from '@/components/buyer/CategoryChips';

interface SortFilterBarProps {
  sort: SortOption;
  category: 'all' | ProductCategory;
  filterCount: number;
  onSortChange: (sort: SortOption) => void;
  onCategoryChange: (key: 'all' | ProductCategory) => void;
  onOpenFilters: () => void;
}

export function SortFilterBar({
  sort,
  category,
  filterCount,
  onSortChange,
  onCategoryChange,
  onOpenFilters,
}: SortFilterBarProps) {
  return (
    <div className="sticky top-14 z-20 bg-stone-50/95 backdrop-blur py-2.5 space-y-2.5">
      <CategoryChips active={category} onChange={onCategoryChange} scrollable />
      <div className="flex items-center gap-2.5">
        <div className="flex-1 min-w-0">
          <Select
            size="middle"
            value={sort}
            onChange={onSortChange}
            options={SORT_OPTIONS.map((o) => ({ label: o.label, value: o.key }))}
            popupMatchSelectWidth={false}
            className="w-full"
          />
        </div>
        <Badge count={filterCount} color="#2D6A4F" overflowCount={99} offset={[4, -3]}>
          <Button
            icon={<FilterOutlined />}
            onClick={onOpenFilters}
            aria-label="Open filters"
            className="!bg-white !text-stone-600"
          >
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </Badge>
      </div>
    </div>
  );
}
