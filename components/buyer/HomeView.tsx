'use client';

import React from 'react';
import { Alert, Button, Empty, Input, Skeleton } from 'antd';
import { EnvironmentOutlined, FilterOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useHome } from '@/hooks/useHome';
import { ProductGrid } from '@/components/buyer/ProductGrid';
import { SortFilterBar } from '@/components/buyer/SortFilterBar';
import { BrowseSidebar } from '@/components/buyer/BrowseSidebar';
import { FilterSheet } from '@/components/buyer/FilterSheet';

function HomeSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 pt-5 sm:pt-10">
      <Skeleton active paragraph={{ rows: 1 }} />
      <Skeleton.Input active block />
      <div className="space-y-3">
        <Skeleton.Input active className="!w-44" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-2 space-y-2">
              <Skeleton.Image active className="!aspect-[18/10] !w-full !rounded-xl" />
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
    totalProducts,
    sellers,
    activeCategory,
    setActiveCategory,
    sort,
    setSort,
    filterOpen,
    setFilterOpen,
    maxPrice,
    minRating,
    setMaxPrice,
    setMinRating,
    filterCount,
    hasFilters,
    clearFilters,
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-10 sm:pt-10 space-y-8 sm:space-y-10">
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
            <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
              <aside className="hidden lg:block">
                <BrowseSidebar
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  sort={sort}
                  onSortChange={setSort}
                  maxPrice={maxPrice}
                  onMaxPriceChange={setMaxPrice}
                  minRating={minRating}
                  onMinRatingChange={setMinRating}
                  filterCount={filterCount}
                  onReset={() => {
                    setMaxPrice(null);
                    setMinRating(null);
                  }}
                />
              </aside>

              <div className="min-w-0">
                <div className="lg:hidden">
                  <SortFilterBar
                    sort={sort}
                    category={activeCategory}
                    filterCount={filterCount}
                    onSortChange={setSort}
                    onCategoryChange={setActiveCategory}
                    onOpenFilters={() => setFilterOpen(true)}
                  />
                </div>

                <section>
                  <div className="mb-4 mt-7 lg:mt-0">
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900">
                      Available now
                    </h2>
                    {totalProducts > 0 && products.length > 0 && (
                      <p className="text-xs text-stone-400 mt-1">
                        {products.length} {products.length === 1 ? 'item' : 'items'} available
                      </p>
                    )}
                  </div>
                  <div>
                    {products.length === 0 ? (
                      totalProducts === 0 ? (
                        <div className="rounded-2xl bg-white shadow-sm px-6 py-12 sm:py-16 flex flex-col items-center text-center">
                          <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center mb-4">
                            <ShoppingOutlined className="text-xl text-stone-400" />
                          </div>
                          <h3 className="text-base font-semibold text-stone-900">
                            No fresh produce available yet
                          </h3>
                          <p className="text-sm text-stone-500 mt-1.5 max-w-sm leading-relaxed">
                            We&apos;re waiting for farms to list their harvest. Check back soon or try adjusting your location.
                          </p>
                          <p className="text-xs text-stone-400 mt-4">
                            New items appear here as soon as sellers publish them.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-white shadow-sm px-6 py-12 sm:py-16 flex flex-col items-center text-center">
                          <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center mb-4">
                            <FilterOutlined className="text-xl text-stone-400" />
                          </div>
                          <h3 className="text-base font-semibold text-stone-900">No matches for your filters</h3>
                          <p className="text-sm text-stone-500 mt-1.5 max-w-sm leading-relaxed">
                            Try clearing filters or switching categories to see more produce.
                          </p>
                          {hasFilters && (
                            <Button onClick={clearFilters} className="!rounded-xl !mt-5">
                              Clear all filters
                            </Button>
                          )}
                        </div>
                      )
                    ) : (
                      <ProductGrid
                        products={products}
                        sellers={sellers}
                        onOpen={handleOpenProduct}
                        gridClassName="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 xl:grid-cols-4 xl:gap-x-6"
                      />
                    )}
                  </div>
                </section>
              </div>
            </div>
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