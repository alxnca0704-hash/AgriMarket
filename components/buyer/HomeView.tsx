'use client';

import React from 'react';
import { Alert, Button, Empty, Input, Skeleton } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { useHome } from '@/hooks/useHome';
import { CategoryChips } from '@/components/buyer/CategoryChips';
import { PromoCarousel } from '@/components/buyer/PromoCarousel';
import { ProductCard } from '@/components/buyer/ProductCard';
import { ProductGrid } from '@/components/buyer/ProductGrid';
import { SortFilterBar } from '@/components/buyer/SortFilterBar';
import { FilterSheet } from '@/components/buyer/FilterSheet';

function HomeSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 pt-5 sm:pt-10">
      <Skeleton active paragraph={{ rows: 1 }} />
      <Skeleton.Input active block />
      <Skeleton.Button active block className="!h-52 sm:!h-60" />
      <div className="space-y-3">
        <Skeleton.Input active className="!w-32" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <Skeleton.Image active className="!aspect-[4/3] !w-full" />
              <Skeleton active paragraph={{ rows: 2 }} title={false} />
            </div>
          ))}
        </div>
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
    query,
    searchResults,
    isSearching,
    handleQueryChange,
    handleSubmitSearch,
    clearSearch,
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-8 sm:pt-10 space-y-7 sm:space-y-9">
        {error && <Alert type="error" title={error} showIcon />}

        <div>
          <h1 className="text-[26px] sm:text-3xl font-semibold tracking-tight text-stone-900">
            {greeting}, {firstName}.
          </h1>
          <p className="text-sm text-stone-500 mt-2 flex items-center gap-1.5">
            <EnvironmentOutlined className="text-sage" />
            <span className="truncate">Delivering to {deliveryAddress}</span>
          </p>
        </div>

        <Input.Search
          size="large"
          allowClear
          placeholder="Search fresh produce, farms…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onSearch={handleSubmitSearch}
          aria-label="Search products"
          className="!rounded-xl !bg-white"
        />

        {isSearching ? (
          <section className="space-y-5 sm:space-y-6">
            {searchResults.length > 0 ? (
              <>
                <p className="text-sm sm:text-base text-stone-500">
                  <span className="font-semibold text-stone-800">{searchResults.length}</span>{' '}
                  result{searchResults.length === 1 ? '' : 's'} for “{query.trim()}”
                </p>
                <ProductGrid
                  products={searchResults}
                  sellers={sellers}
                  onOpen={handleOpenProduct}
                  onQuickAdd={handleQuickAdd}
                />
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    No matches for “{query.trim()}”. Try a different keyword.
                  </span>
                }
              >
                <Button type="primary" onClick={clearSearch} className="!rounded-xl">
                  Back to home
                </Button>
              </Empty>
            )}
          </section>
        ) : (
          <>
            <CategoryChips active={activeCategory} onChange={setActiveCategory} />

            <PromoCarousel />

            {nearYou.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-3.5">
                  <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900">
                    Near you
                  </h2>
                  <span className="text-xs text-stone-400">Growing closest to your address</span>
                </div>
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 no-scrollbar">
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
              <div className="mb-3.5">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900">
                  Available now
                </h2>
              </div>
              <SortFilterBar
                sort={sort}
                resultCount={products.length}
                filterCount={filterCount}
                onSortChange={setSort}
                onOpenFilters={() => setFilterOpen(true)}
              />
              <div className="pt-4">
                <ProductGrid
                  products={products}
                  sellers={sellers}
                  onOpen={handleOpenProduct}
                  onQuickAdd={handleQuickAdd}
                />
              </div>
            </section>
          </>
        )}
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