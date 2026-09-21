'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Checkbox, Empty, Image, Skeleton, Tag } from 'antd';
import { CheckCircleFilled, PlusOutlined } from '@ant-design/icons';
import { useSellerProducts, getListingStockStatus } from '@/hooks/useSellerProducts';
import { ALL_CATEGORIES } from '@/constants/categories';
import { APP_ROUTES } from '@/constants/routes';
import { formatUnitPrice, formatCount } from '@/lib/format';

const STATUS_OPTIONS = [
  { key: 'all', label: 'All statuses' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive (sold out)' },
  { key: 'low', label: 'Low stock' },
] as const;

function statusTag(status: 'active' | 'inactive' | 'low') {
  if (status === 'active') return <Tag color="success" className="!m-0 !border-none !rounded-full !text-xs">Active</Tag>;
  if (status === 'low') return <Tag color="warning" className="!m-0 !border-none !rounded-full !text-xs">Low stock</Tag>;
  return <Tag className="!m-0 !border-none !rounded-full !text-xs">Inactive</Tag>;
}

export function ProductsView() {
  const router = useRouter();
  const {
    isLoading,
    error,
    stall,
    filtered,
    counts,
    query,
    setQuery,
    category,
    setCategory,
    status,
    setStatus,
    selectedIds,
    allVisibleSelected,
    toggleSelection,
    toggleSelectVisible,
    clearSelection,
    handleToggle,
    handleBulkMarkOutOfStock,
    handleBulkDelete,
    handleDeleteOne,
  } = useSellerProducts();

  const shownCount = useMemo(() => filtered.length, [filtered]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Listings</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            My products
          </h1>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push(APP_ROUTES.sellerProductNew)}
          className="!rounded-xl"
        >
          Add product
        </Button>
      </div>

      {error && <Alert type="error" title={error} showIcon />}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          placeholder="Search your products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm outline-none placeholder:text-stone-400"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof category)}
          className="rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm outline-none cursor-pointer"
        >
          {ALL_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm outline-none cursor-pointer"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#2D6A4F]/5 px-4 py-3">
          <span className="text-sm font-medium text-stone-700">
            {selectedIds.size} selected
          </span>
          <Button size="small" onClick={handleBulkMarkOutOfStock} className="!rounded-lg">
            Mark out of stock
          </Button>
          <Button size="small" danger onClick={handleBulkDelete} className="!rounded-lg">
            Delete
          </Button>
          <Button size="small" type="link" onClick={clearSelection} className="!px-2">
            Clear
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton.Button key={i} active block className="!h-56 !rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm py-14">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="space-y-1.5">
                <p className="text-stone-800 font-medium">No products found</p>
                <p className="text-sm text-stone-400">Try a different filter, or add a new listing.</p>
              </div>
            }
          >
            <Button
              type="primary"
              onClick={() => router.push(APP_ROUTES.sellerProductNew)}
              className="!rounded-xl"
            >
              Add product
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-1">
          <Checkbox checked={allVisibleSelected} onChange={toggleSelectVisible}>
            <span className="text-sm text-stone-500">
              Select visible ({shownCount})
            </span>
          </Checkbox>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-5">
          {filtered.map((listing) => {
            const stockStatus = getListingStockStatus(listing);
            const selected = selectedIds.has(listing.id);
            const goEdit = () => router.push(APP_ROUTES.sellerProductEdit(listing.id));
            return (
              <div
                key={listing.id}
                className={`flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ${
                  selected ? 'ring-2 ring-[#2D6A4F]/40' : ''
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={goEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goEdit();
                    }
                  }}
                  className="relative aspect-[3/2] w-full cursor-pointer bg-white p-3"
                >
                  <span
                    className="absolute left-5 top-5 z-10"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selected}
                      onChange={() => toggleSelection(listing.id)}
                      className="!rounded-full bg-white/90 !p-0.5 shadow-sm"
                    />
                  </span>
                  <span className="absolute right-5 top-5 z-10">{statusTag(stockStatus)}</span>
                  <Image
                    src={listing.imageUrl}
                    alt={listing.name}
                    preview={false}
                    className="!h-full !w-full rounded-2xl object-cover"
                  />
                </div>

                <button
                  type="button"
                  onClick={goEdit}
                  className="flex flex-1 cursor-pointer flex-col gap-1.5 px-3 pb-1 pt-1.5 text-left outline-none"
                >
                  <h3 className="line-clamp-2 min-h-9 text-[13px] font-medium leading-snug text-stone-900">
                    {listing.name}
                  </h3>
                  <p className="flex items-center gap-1 text-[11px] text-stone-500">
                    {stall.verification.status === 'verified' && (
                      <CheckCircleFilled className="text-[#2D6A4F]" />
                    )}
                    <span className="truncate">{stall.stallName}</span>
                  </p>
                  <div className="mt-auto flex items-baseline justify-between gap-2 pt-1.5">
                    <p className="text-sm font-bold tracking-tight text-stone-900">
                      {formatUnitPrice(listing.price, listing.unit)}
                    </p>
                    <span className="text-[11px] text-stone-400">
                      {listing.stockQty} {listing.unit} · {formatCount(listing.soldCount)} sold
                    </span>
                  </div>
                </button>

                <div className="mt-2 flex items-center justify-between gap-1 px-3 pb-3 pt-2">
                  <span className="text-[10px] text-stone-400">
                    {listing.isActive ? 'Listed & visible' : 'Hidden from buyers'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="small"
                      type="text"
                      onClick={goEdit}
                      className="!text-[#2D6A4F] !px-2"
                    >
                      Edit
                    </Button>
                    <Button size="small" type="text" danger onClick={() => handleDeleteOne(listing)} className="!px-2">
                      Delete
                    </Button>
                    <Button size="small" onClick={() => handleToggle(listing.id)} className="!rounded-lg !px-2">
                      {listing.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-stone-400">
        {counts.active} active · {counts.low} low stock · {counts.inactive} inactive
      </p>
    </div>
  );
}