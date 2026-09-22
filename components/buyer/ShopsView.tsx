'use client';

import React from 'react';
import { Alert, Button, Empty, Input, Select, Skeleton, Tag } from 'antd';
import { EnvironmentOutlined, SearchOutlined, ShopOutlined } from '@ant-design/icons';
import { useShops, ShopSort } from '@/hooks/useShops';
import { ShopCard } from '@/components/buyer/ShopCard';

function ShopsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 pt-5 sm:pt-10">
      <Skeleton active paragraph={{ rows: 1 }} />
      <Skeleton.Input active block />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-1.5 space-y-3">
            <div className="w-full overflow-hidden rounded-xl bg-stone-50" style={{ aspectRatio: '16 / 10' }}>
              <Skeleton.Image active className="!h-full !w-full !rounded-xl" style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="px-2 pb-2 space-y-2">
              <Skeleton.Input active size="small" className="!w-32" />
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SORT_OPTIONS: { value: ShopSort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'products', label: 'Most products' },
  { value: 'name', label: 'Name A–Z' },
];

export function ShopsView() {
  const {
    isLoading,
    error,
    shops,
    totalShops,
    query,
    verifiedOnly,
    setVerifiedOnly,
    sort,
    setSort,
    handleOpenShop,
    handleQueryChange,
    clearSearch,
  } = useShops();

  if (isLoading) return <ShopsSkeleton />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-10 sm:pt-10 space-y-6 sm:space-y-8">
      {error && <Alert type="error" title={error} showIcon />}

      <div>
        <h1 className="text-[26px] sm:text-3xl font-semibold tracking-tight text-stone-900">Shops</h1>
        <p className="text-sm text-stone-500 mt-2 flex items-center gap-1.5">
          <ShopOutlined className="text-sage" />
          <span>{totalShops === 0 ? 'No shops yet' : `${totalShops} ${totalShops === 1 ? 'shop' : 'shops'} available`}</span>
          <span className="hidden sm:inline text-stone-300">·</span>
          <span className="hidden sm:inline">Discover farms near you</span>
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input.Search
          size="large"
          allowClear
          placeholder="Search shops, farms, location…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onSearch={handleQueryChange}
          aria-label="Search shops"
          className="flex-1 !rounded-xl !bg-white"
          prefix={<SearchOutlined className="text-stone-400" />}
        />
        <div className="flex items-center gap-2 sm:shrink-0">
          <Select
            size="large"
            value={sort}
            onChange={(v) => setSort(v)}
            options={SORT_OPTIONS}
            className="flex-1 sm:w-40 !rounded-xl"
            aria-label="Sort shops"
          />
          <Tag.CheckableTag
            checked={verifiedOnly}
            onChange={setVerifiedOnly}
            className={`!m-0 !rounded-full !px-4 !py-1.5 !text-xs !font-medium !border cursor-pointer select-none transition-colors ${verifiedOnly ? '!bg-sage !text-white !border-sage' : '!bg-white !text-stone-600 !border-stone-200 hover:!border-sage hover:!text-sage'}`}
          >
            Verified only
          </Tag.CheckableTag>
        </div>
      </div>

      {shops.length === 0 ? (
        totalShops === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm px-6 py-12 sm:py-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center mb-4">
              <ShopOutlined className="text-xl text-stone-400" />
            </div>
            <h3 className="text-base font-semibold text-stone-900">No shops available yet</h3>
            <p className="text-sm text-stone-500 mt-1.5 max-w-sm leading-relaxed">
              Farms will appear here as soon as sellers create their stalls. Check back soon.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-sm px-6 py-12 sm:py-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center mb-4">
              <EnvironmentOutlined className="text-xl text-stone-400" />
            </div>
            <h3 className="text-base font-semibold text-stone-900">No matches</h3>
            <p className="text-sm text-stone-500 mt-1.5 max-w-sm leading-relaxed">
              No shops match “{query.trim()}”{verifiedOnly ? ' with verified filter' : ''}. Try a different keyword or clear filters.
            </p>
            <Button onClick={clearSearch} className="!rounded-xl !mt-5">
              Clear search
            </Button>
          </div>
        )
      ) : (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-stone-600">
              {shops.length} {shops.length === 1 ? 'shop' : 'shops'} found
              {query.trim() ? (
                <span className="font-normal text-stone-400"> for “{query.trim()}”</span>
              ) : null}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
            {shops.map(({ seller, productCount, stallId }) => (
              <ShopCard key={stallId} seller={seller} productCount={productCount} onOpen={handleOpenShop} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
