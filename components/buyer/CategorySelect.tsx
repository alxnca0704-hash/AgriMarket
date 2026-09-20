'use client';

import React from 'react';
import { Select } from 'antd';
import { AppstoreOutlined, AppleOutlined, RiseOutlined, SunOutlined } from '@ant-design/icons';
import { ALL_CATEGORIES, ProductCategory } from '@/constants/categories';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <AppstoreOutlined />,
  fruits: <AppleOutlined />,
  vegetables: <RiseOutlined />,
  grains: <SunOutlined />,
};

interface CategorySelectProps {
  active: 'all' | ProductCategory;
  onChange: (key: 'all' | ProductCategory) => void;
}

export function CategorySelect({ active, onChange }: CategorySelectProps) {
  return (
    <Select
      size="middle"
      value={active}
      onChange={(key) => onChange(key)}
      options={ALL_CATEGORIES.map((category) => ({
        value: category.key,
        label: (
          <span className="flex items-center gap-2">
            <span className="text-[#2D6A4F]">{CATEGORY_ICONS[category.key]}</span>
            {category.label}
          </span>
        ),
      }))}
      popupMatchSelectWidth={false}
      className="min-w-[150px]"
    />
  );
}