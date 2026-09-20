'use client';

import React from 'react';
import { Badge, Button, Select } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { SORT_OPTIONS, SortOption } from '@/constants/sortOptions';

interface SortFilterBarProps {
  sort: SortOption;
  resultCount: number;
  filterCount: number;
  onSortChange: (sort: SortOption) => void;
  onOpenFilters: () => void;
}

export function SortFilterBar({
  sort,
  resultCount,
  filterCount,
  onSortChange,
  onOpenFilters,
}: SortFilterBarProps) {
  return (
    <div className="sticky top-[116px] md:top-14 z-20 bg-stone-50/95 backdrop-blur py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-stone-500">
          <span className="font-semibold text-stone-800">{resultCount}</span> products
        </span>
        <div className="flex items-center gap-2">
          <Select
            size="middle"
            value={sort}
            onChange={onSortChange}
            options={SORT_OPTIONS.map((o) => ({ label: o.label, value: o.key }))}
            popupMatchSelectWidth={false}
            className="min-w-[140px] sm:min-w-[180px]"
          />
          <Badge count={filterCount} size="small" offset={[3, -4]}>
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