'use client';

import React, { useState } from 'react';
import { Button, Drawer, InputNumber, Radio } from 'antd';

const RATING_OPTIONS = [
  { label: 'Any rating', value: null },
  { label: '4.0 & above', value: 4 },
  { label: '4.5 & above', value: 4.5 },
] as const;

interface FilterSheetProps {
  open: boolean;
  maxPrice: number | null;
  minRating: number | null;
  onApply: (maxPrice: number | null, minRating: number | null) => void;
  onClose: () => void;
}

export function FilterSheet({
  open,
  maxPrice,
  minRating,
  onApply,
  onClose,
}: FilterSheetProps) {
  const [price, setPrice] = useState<number | null>(maxPrice);
  const [rating, setRating] = useState<number | null>(minRating);

  const handleApply = () => {
    onApply(price, rating);
  };

  const handleReset = () => {
    setPrice(null);
    setRating(null);
    onApply(null, null);
  };

  return (
    <Drawer
      title="Filter products"
      placement="bottom"
      size="auto"
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{ body: { padding: '20px 24px 8px' } }}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">Maximum price per unit</p>
          <InputNumber
            size="large"
            min={1}
            max={1000}
            step={5}
            prefix="₱"
            placeholder="No limit"
            className="w-full !rounded-lg"
            value={price}
            onChange={(value) => setPrice(value ?? null)}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">Minimum seller rating</p>
          <Radio.Group
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            className="w-full [&_.ant-radio-button-wrapper]:flex [&_.ant-radio-button-wrapper]:flex-1 [&_.ant-radio-button-wrapper]:justify-center"
          >
            {RATING_OPTIONS.map((option) => (
              <Radio.Button key={option.label} value={option.value}>
                {option.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>

        <div className="flex gap-3 pt-2">
          <Button size="large" block onClick={handleReset} className="!rounded-lg">
            Reset
          </Button>
          <Button type="primary" size="large" block onClick={handleApply} className="!rounded-lg">
            Apply
          </Button>
        </div>
      </div>
    </Drawer>
  );
}