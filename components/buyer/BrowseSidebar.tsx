'use client';

import React from 'react';
import { Button, InputNumber, Radio, Select } from 'antd';
import { SORT_OPTIONS, SortOption } from '@/constants/sortOptions';
import { ProductCategory } from '@/constants/categories';
import { RATING_FILTER_OPTIONS } from '@/constants/filters';
import { CategoryChips } from '@/components/buyer/CategoryChips';

interface BrowseSidebarProps {
  activeCategory: 'all' | ProductCategory;
  onCategoryChange: (key: 'all' | ProductCategory) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  maxPrice: number | null;
  onMaxPriceChange: (value: number | null) => void;
  minRating: number | null;
  onMinRatingChange: (value: number | null) => void;
  filterCount: number;
  onReset: () => void;
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-4">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function BrowseSidebar({
  activeCategory,
  onCategoryChange,
  sort,
  onSortChange,
  maxPrice,
  onMaxPriceChange,
  minRating,
  onMinRatingChange,
  filterCount,
  onReset,
}: BrowseSidebarProps) {
  return (
    <div className="space-y-8 sticky top-8">
      <SidebarSection title="Categories">
        <CategoryChips active={activeCategory} onChange={onCategoryChange} />
      </SidebarSection>

      <SidebarSection title="Sort by">
        <Select
          size="middle"
          value={sort}
          onChange={onSortChange}
          options={SORT_OPTIONS.map((o) => ({ label: o.label, value: o.key }))}
          popupMatchSelectWidth={false}
          className="w-full"
        />
      </SidebarSection>

      <SidebarSection title="Filters">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-stone-600" htmlFor="sidebar-max-price">
              Maximum price per unit
            </label>
            <InputNumber
              id="sidebar-max-price"
              size="middle"
              min={1}
              max={1000}
              step={5}
              prefix="₱"
              placeholder="No limit"
              className="w-full !rounded-lg"
              value={maxPrice}
              onChange={(value) => onMaxPriceChange(value ?? null)}
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-sm text-stone-600">Minimum seller rating</label>
            <Radio.Group
              value={minRating}
              onChange={(e) => onMinRatingChange(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              className="w-full [&_.ant-radio-button-wrapper]:flex [&_.ant-radio-button-wrapper]:flex-1 [&_.ant-radio-button-wrapper]:justify-center"
            >
              {RATING_FILTER_OPTIONS.map((option) => (
                <Radio.Button key={option.label} value={option.value}>
                  {option.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>

          {filterCount > 0 && (
            <Button type="text" size="small" onClick={onReset} className="!px-0 !text-sage">
              Clear filters
            </Button>
          )}
        </div>
      </SidebarSection>
    </div>
  );
}