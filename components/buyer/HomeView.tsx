'use client';

import React from 'react';
import { Alert, Input, Skeleton } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { useHome } from '@/hooks/useHome';
import { CategoryChips } from '@/components/buyer/CategoryChips';
import { PromoCarousel } from '@/components/buyer/PromoCarousel';
import { ProductCard } from '@/components/buyer/ProductCard';
import { ProductGrid } from '@/components/buyer/ProductGrid';
import { SortFilterBar } from '@/components/buyer/SortFilterBar';
import { FilterSheet } from '@/components/buyer/FilterSheet';

function HomeSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-5 pt-4">
      <Skeleton active paragraph={{ rows: 1 }} />
      <Skeleton.Input active block />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-3 space-y-3">
            <Skeleton.Image active />
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeView() {
  const {
    isLoading,
    error,
    greeting,
    firstName,
    deliveryAddress,
    products,
    nearYou,
    sellers,
    activeCategory,
    setActiveCategory,
    sort,
    setSort,
    filterOpen,
    setFilterOpen,
    maxPrice,
    minRating,
    filterCount,
    handleQuickAdd,
    handleOpenProduct,
    handleApplyFilters,
    goToSearch,
  } = useHome();

  if (isLoading) {
    return (
      <div>
        <HomeSkeleton />
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 space-y-5">
        {error && <Alert type="error" message={error} showIcon />}

        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            {greeting}, {firstName}.
          </h1>
          <p className="text-sm text-stone-500 mt-1 flex items-center gap-1.5">
            <EnvironmentOutlined className="text-[#2D6A4F]" />
            <span className="truncate">Delivering to {deliveryAddress}</span>
          </p>
        </div>

        <Input
          size="large"
          readOnly
          placeholder="Search fresh produce, farms…"
          prefix={<SearchOutlined className="text-stone-400" />}
          onClick={goToSearch}
          aria-label="Search products"
          className="!rounded-xl !bg-white cursor-pointer"
        />

        <CategoryChips active={activeCategory} onChange={setActiveCategory} />

        <PromoCarousel />

        {nearYou.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-lg font-semibold text-stone-900">Near you</h2>
              <span className="text-xs text-stone-400">Growing closest to your address</span>
            </div>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
              {nearYou.map((product) => {
                const seller = sellers.get(product.sellerId);
                if (!seller) return null;
                return (
                  <div key={product.id} className="w-[168px] shrink-0">
                    <ProductCard
                      product={product}
                      seller={seller}
                      onOpen={handleOpenProduct}
                      onQuickAdd={handleQuickAdd}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-stone-900">Available now</h2>
          </div>
          <SortFilterBar
            sort={sort}
            resultCount={products.length}
            filterCount={filterCount}
            onSortChange={setSort}
            onOpenFilters={() => setFilterOpen(true)}
          />
          <div className="pt-3">
            <ProductGrid
              products={products}
              sellers={sellers}
              onOpen={handleOpenProduct}
              onQuickAdd={handleQuickAdd}
            />
          </div>
        </section>
      </div>

      <FilterSheet
        open={filterOpen}
        maxPrice={maxPrice}
        minRating={minRating}
        onApply={handleApplyFilters}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}