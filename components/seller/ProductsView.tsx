'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Dropdown, Empty, Image, Skeleton, type MenuProps } from 'antd';
import {
  CheckCircleFilled,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useSellerProducts } from '@/hooks/useSellerProducts';
import { ALL_CATEGORIES, CATEGORY_OPTIONS } from '@/constants/categories';
import { APP_ROUTES } from '@/constants/routes';
import { formatUnitPrice, formatCount } from '@/lib/format';
import { SellerListing } from '@/types/seller';

export function ProductsView() {
  const router = useRouter();
  const {
    isLoading,
    error,
    stall,
    listings,
    filtered,
    query,
    setQuery,
    category,
    setCategory,
    handleDeleteOne,
  } = useSellerProducts();

  const sections = useMemo(
    () =>
      category === 'all'
        ? CATEGORY_OPTIONS.map((c) => ({
            label: c.label,
            items: filtered.filter((l) => l.category === c.key),
          })).filter((s) => s.items.length > 0)
        : [],
    [category, filtered]
  );

  const renderCard = (listing: SellerListing) => {
    const goEdit = () => router.push(APP_ROUTES.sellerProductEdit(listing.id));
    const actionItems: MenuProps['items'] = [
      { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
      { type: 'divider' },
      { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true },
    ];
    return (
      <div
        key={listing.id}
        className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm"
      >
        <div className="relative aspect-[18/10] w-full bg-white p-1.5">
          <Image
            src={listing.imageUrl}
            alt={listing.name}
            preview={false}
            className="!h-full !w-full rounded-xl object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1 px-2.5 pb-1 pt-1">
          <h3 className="line-clamp-2 min-h-8 text-[12px] font-medium leading-snug text-stone-900">
            {listing.name}
          </h3>
          <p className="flex items-center gap-1 text-[11px] text-stone-500">
            {stall?.verification.status === 'verified' && (
              <CheckCircleFilled className="text-[#2D6A4F] text-[10px]" />
            )}
            <span className="truncate">{stall?.stallName}</span>
          </p>
          <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
            <p className="text-[13px] font-bold tracking-tight text-stone-900">
              {formatUnitPrice(listing.price, listing.unit)}
            </p>
            <span className="text-[10px] text-stone-400">
              {listing.stockQty} {listing.unit} · {formatCount(listing.soldCount)} sold
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-2.5 py-2">
          <Dropdown
            trigger={['click']}
            menu={{
              items: actionItems,
              onClick: ({ key }) => {
                if (key === 'edit') goEdit();
                else if (key === 'delete') handleDeleteOne(listing);
              },
            }}
          >
            <Button
              size="small"
              type="text"
              icon={<MoreOutlined />}
              aria-label={`Actions for ${listing.name}`}
            />
          </Dropdown>
        </div>
      </div>
    );
  };

  if (!isLoading && !stall) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        <div className="rounded-2xl bg-white shadow-sm p-8 sm:p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center text-2xl">
            <ShopOutlined />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-stone-900">Set up your stall first</h2>
          <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">
            Your stall is where buyers discover you. Create it once, then add and manage your
            products here.
          </p>
          <Button
            type="primary"
            size="large"
            onClick={() => router.push(APP_ROUTES.sellerOnboarding)}
            className="!rounded-xl mt-6"
          >
            Create stall
          </Button>
        </div>
      </div>
    );
  }

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
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-3 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton.Button key={i} active block className="!h-40 !rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-2xl bg-white shadow-sm py-14">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="space-y-1.5">
                <p className="text-stone-800 font-medium">
                  {listings.length === 0 ? 'No products yet' : 'No products found'}
                </p>
                <p className="text-sm text-stone-400">
                  {listings.length === 0
                    ? 'Add your first product — it takes less than a minute.'
                    : 'Try a different filter, or add a new listing.'}
                </p>
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
      )}

      {!isLoading &&
        filtered.length > 0 &&
        (category === 'all' ? (
          <div className="space-y-8">
            {sections.map((s) => (
              <section key={s.label}>
                <div className="mb-3 flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                    {s.label}
                  </h2>
                  <span className="text-xs text-stone-400">{s.items.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-5">
                  {s.items.map(renderCard)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-5">
            {filtered.map(renderCard)}
          </div>
        ))}
    </div>
  );
}