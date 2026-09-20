'use client';

import React from 'react';
import { Alert, Button, Empty, Input, Skeleton, Tag } from 'antd';
import { ClockCircleOutlined, FireOutlined } from '@ant-design/icons';
import { useSearch } from '@/hooks/useSearch';
import { ProductGrid } from '@/components/buyer/ProductGrid';

function SearchSkeleton() {
  return (
    <div className="space-y-5 pt-4">
      <Skeleton.Input active block />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-3 space-y-3">
            <Skeleton.Image active />
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchView() {
  const {
    isLoading,
    error,
    query,
    results,
    sellers,
    recent,
    trending,
    handleQueryChange,
    handleSubmit,
    handleSelectTerm,
    handleClearRecent,
    handleQuickAdd,
    handleOpenProduct,
    clearSearch,
  } = useSearch();

  const showSuggestions = !query.trim();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 space-y-5">
      <Input.Search
        size="large"
        autoFocus
        placeholder="Search produce, farms, or categories…"
        value={query}
        allowClear
        onChange={(e) => handleQueryChange(e.target.value)}
        onSearch={handleSubmit}
        enterButton
        aria-label="Search products"
        className="!rounded-xl"
      />

      {error && <Alert type="error" message={error} showIcon />}

      {isLoading && <SearchSkeleton />}

      {!isLoading && showSuggestions && (
        <div className="space-y-6">
          {recent.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                  <ClockCircleOutlined className="text-stone-400" /> Recent searches
                </h2>
                <Button type="text" size="small" onClick={handleClearRecent} className="!text-xs">
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectTerm(term)}
                    className="px-3 py-1.5 text-sm rounded-full bg-white text-stone-700 shadow-sm cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-stone-800 flex items-center gap-2 mb-3">
              <FireOutlined className="text-amber-500" /> Trending now
            </h2>
            <div className="flex flex-wrap gap-2">
              {trending.map((term) => (
                <Tag
                  key={term}
                  className="!px-3 !py-1 !text-sm !rounded-full !bg-[#2D6A4F]/5 !border-none !text-[#2D6A4F] !cursor-pointer"
                  onClick={() => handleSelectTerm(term)}
                >
                  {term}
                </Tag>
              ))}
            </div>
          </section>
        </div>
      )}

      {!isLoading && !showSuggestions && results.length > 0 && (
        <section>
          <p className="text-sm text-stone-500 mb-3">
            <span className="font-semibold text-stone-800">{results.length}</span> result
            {results.length === 1 ? '' : 's'} for “{query}”
          </p>
          <ProductGrid
            products={results}
            sellers={sellers}
            onOpen={handleOpenProduct}
            onQuickAdd={handleQuickAdd}
          />
        </section>
      )}

      {!isLoading && !showSuggestions && results.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              No matches for “{query}”. Try a different keyword.
            </span>
          }
        >
          <Button type="primary" onClick={clearSearch} className="!bg-[#2D6A4F]">
            Back to trending searches
          </Button>
        </Empty>
      )}
    </div>
  );
}