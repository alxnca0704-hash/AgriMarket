'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Drawer, Image, Rate, Result, Skeleton, Tabs, Tag } from 'antd';
import { DownOutlined, EditOutlined, EnvironmentOutlined, EyeOutlined, ShopOutlined } from '@ant-design/icons';
import { APP_ROUTES, ASSET_ROUTES } from '@/constants/routes';
import { FARM_TYPE_LABELS } from '@/constants/stall';
import { SELLER_STALL_TABS, SELLER_STALL_TAB_LABELS, type SellerStallTab } from '@/constants/sellerStall';
import { formatDate, formatPrice } from '@/lib/format';
import type { SellerStallPageResult } from '@/hooks/useSellerStallPage';
import { StallFormFields } from '@/components/seller/StallFormFields';
import { StallOverviewTab } from '@/components/seller/StallOverviewTab';
import { StallSalesTab } from '@/components/seller/StallSalesTab';
import { StallPayoutsTab } from '@/components/seller/StallPayoutsTab';
import { StallPlatformTab } from '@/components/seller/StallPlatformTab';
import { StallDepositTab } from '@/components/seller/StallDepositTab';

const verificationMeta = {
  verified: { label: 'Verified', color: 'green' },
  pending: { label: 'Verification pending', color: 'gold' },
  unverified: { label: 'Unverified', color: 'default' },
} as const;

function StallPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-4 pb-16 pt-6 sm:px-6">
      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <Skeleton active avatar paragraph={{ rows: 2 }} />
      </div>
      <Skeleton.Button active block className="!h-12 !rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <Skeleton.Button key={item} active block className="!h-32 !rounded-2xl" />)}
      </div>
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );
}

function NoStallState() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-12 sm:px-6">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-sage-soft)] text-2xl text-[var(--color-sage)]">
          <ShopOutlined />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-stone-900">No stall yet</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">
          Create your stall profile with your farm details, location, and photo so buyers can find you.
        </p>
        <Button type="primary" size="large" onClick={() => router.push(APP_ROUTES.sellerOnboarding)} className="mt-6 !rounded-xl">
          Create stall
        </Button>
      </div>
    </div>
  );
}

function TabLabel({ tab, page }: { tab: SellerStallTab; page: SellerStallPageResult }) {
  const count = tab === 'platform' ? page.counts.platform : 0;
  const dot = (tab === 'payouts' && page.counts.payouts > 0) || (tab === 'deposit' && page.counts.deposit > 0);
  const dotClass = tab === 'payouts' ? 'bg-[var(--color-sage)]' : 'bg-amber-500';

  return (
    <span className="flex items-center gap-1.5">
      {SELLER_STALL_TAB_LABELS[tab]}
      {count > 0 ? (
        <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${page.finance.finance?.cod.overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
          {count}
        </span>
      ) : null}
      {dot ? <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} /> : null}
    </span>
  );
}

export interface SellerStallViewProps {
  page: SellerStallPageResult;
}

export function SellerStallView({ page }: SellerStallViewProps) {
  const router = useRouter();
  const { stall } = page;
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (stall.isLoading) return <StallPageSkeleton />;
  if (!stall.stall) return <NoStallState />;
  if (page.error) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6">
        <Result
          status="error"
          title="Could not load your stall"
          subTitle={page.error}
          extra={<Button onClick={() => window.location.reload()}>Try again</Button>}
        />
      </div>
    );
  }

  const profile = stall.stall;
  const verification = verificationMeta[profile.verification.status];
  const farmType = FARM_TYPE_LABELS[profile.farmType as keyof typeof FARM_TYPE_LABELS] ?? profile.farmType;
  const publicHref = stall.stallId ? APP_ROUTES.publicSellerProfile(stall.stallId) : null;

  const tabBarItems = SELLER_STALL_TABS.map((tab) => ({
    key: tab,
    label: <TabLabel tab={tab} page={page} />,
  }));
  const activeTab = page.tab === 'overview'
    ? <StallOverviewTab page={page} />
    : page.tab === 'sales'
      ? <StallSalesTab page={page} />
      : page.tab === 'payouts'
        ? <StallPayoutsTab page={page} />
        : page.tab === 'platform'
          ? <StallPlatformTab page={page} />
          : <StallDepositTab page={page} />;

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 sm:px-6">
      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Image
            src={profile.photoUrl || ASSET_ROUTES.logo}
            alt={profile.stallName}
            preview={false}
            className="!h-20 !w-20 shrink-0 !rounded-2xl object-cover"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                    {profile.stallName}
                  </h1>
                  <Tag color={verification.color}>{verification.label}</Tag>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Rate disabled allowHalf value={profile.rating} className="!text-sm" />
                  <span className="text-sm text-stone-500">
                    {profile.rating.toFixed(1)} ({profile.ratingCount})
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button icon={<EditOutlined />} onClick={stall.startEdit} className="!rounded-xl">
                  Edit stall
                </Button>
                {publicHref ? (
                  <Button icon={<EyeOutlined />} onClick={() => router.push(publicHref)} className="w-full !rounded-xl sm:w-auto">
                    View as buyers see it
                  </Button>
                ) : null}
              </div>
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{profile.description}</p>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <EnvironmentOutlined />
                {profile.location.cityMunicipality}, {profile.location.province}
              </span>
              <span>{farmType}</span>
              <span>Delivery {formatPrice(profile.deliveryFeePeso)}</span>
              <span>{profile.pickupAvailable ? 'Pickup available' : 'Pickup not offered'}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="text-sm font-medium text-stone-700">Stall details</span>
            <DownOutlined className={`text-xs text-stone-400 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
          </button>
          {detailsOpen ? (
            <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-stone-500">Full address</p>
                <p className="mt-1 text-sm text-stone-800">
                  {profile.location.streetBuilding}, {profile.location.barangay}, {profile.location.cityMunicipality}, {profile.location.province} {profile.location.postalCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Farm type</p>
                <p className="mt-1 text-sm text-stone-800">{farmType}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Delivery fee</p>
                <p className="mt-1 text-sm text-stone-800">{formatPrice(profile.deliveryFeePeso)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Seller since</p>
                <p className="mt-1 text-sm text-stone-800">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {stall.error ? <Alert type="error" title={stall.error} showIcon className="mt-4" /> : null}

      <div className="sticky top-14 z-20 -mx-4 mt-4 bg-stone-50/95 px-4 py-2 backdrop-blur md:top-0 md:-mx-6 md:px-6">
        <Tabs
          activeKey={page.tab}
          onChange={(key) => page.setTab(key as SellerStallTab)}
          items={tabBarItems}
          tabBarGutter={20}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>

      <div className="mt-3">{activeTab}</div>

      <Drawer
        title="Edit stall"
        open={stall.isEditing}
        onClose={stall.cancelEdit}
        size="min(92vw, 720px)"
        footer={(
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button size="large" onClick={stall.cancelEdit} className="!rounded-xl">Cancel</Button>
            <Button size="large" type="primary" loading={stall.isSaving} onClick={() => void stall.save()} className="!rounded-xl">
              Save changes
            </Button>
          </div>
        )}
      >
        {stall.draft ? (
          <StallFormFields draft={stall.draft} errors={stall.errors} updateField={stall.updateField} location={stall.location} />
        ) : null}
      </Drawer>
    </div>
  );
}
