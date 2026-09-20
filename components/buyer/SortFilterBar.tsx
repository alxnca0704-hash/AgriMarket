'use client';

import React from 'react';
import { Badge, Button, Select } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { SORT_OPTIONS, SortOption } from '@/constants/sortOptions';
import { ProductCategory } from '@/constants/categories';
import { CategorySelect } from '@/components/buyer/CategorySelect';

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
    <div className="sticky top-14 lg:top-0 z-20 bg-stone-50/95 backdrop-blur py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <CategorySelect active={category} onChange={onCategoryChange} />
          <Select
            size="middle"
            value={sort}
            onChange={onSortChange}
            options={SORT_OPTIONS.map((o) => ({ label: o.label, value: o.key }))}
            popupMatchSelectWidth={false}
            className="min-w-[130px] sm:min-w-[180px]"
          />
          <Badge count={filterCount} color="#2D6A4F" overflowCount={99} offset={[4, -3]}>
            <Button
              icon={<FilterOutlined />}
              onClick={onOpenFilters}
              className="!bg-white !text-stone-600"
            >
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </Badge>
        </div>
      </div>
    </div>
  );
}