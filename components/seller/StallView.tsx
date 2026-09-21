'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Button, Image, Rate, Skeleton } from 'antd';
import { EditOutlined, EnvironmentOutlined, ShopOutlined } from '@ant-design/icons';
import { useSellerStall } from '@/hooks/useSellerStall';
import { StallFormFields } from '@/components/seller/StallFormFields';
import { FARM_TYPE_LABELS } from '@/constants/stall';
import { APP_ROUTES } from '@/constants/routes';
import { formatPrice } from '@/lib/format';

function StallSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-4">
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
      <Skeleton.Button active block className="!h-40 !rounded-2xl" />
    </div>
  );
}

function NoStallEmptyState() {
  const router = useRouter();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-16">
      <div className="rounded-2xl bg-white shadow-sm p-8 sm:p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-sage-soft text-sage flex items-center justify-center text-2xl">
          <ShopOutlined />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-stone-900">No stall yet</h2>
        <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">
          Create your stall profile with your farm details, location, and photo so buyers can find
          you.
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

export function StallView() {
  const {
    isLoading,
    error,
    stall,
    isEditing,
    isSaving,
    draft,
    errors,
    location,
    startEdit,
    cancelEdit,
    updateField,
    save,
  } = useSellerStall();

  if (isLoading) return <StallSkeleton />;

  if (!stall) return <NoStallEmptyState />;

  if (isEditing) {
    if (!draft) return <StallSkeleton />;
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Stall profile</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            Edit stall
          </h1>
        </div>

        {error && <Alert type="error" title={error} showIcon />}

        <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6">
          <StallFormFields draft={draft} errors={errors} updateField={updateField} location={location} />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button size="large" onClick={cancelEdit} className="!rounded-xl">
            Cancel
          </Button>
          <Button size="large" type="primary" loading={isSaving} onClick={save} className="!rounded-xl">
            Save changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Stall profile</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            {stall.stallName}
          </h1>
        </div>
        <Button
          type="primary"
          ghost
          icon={<EditOutlined />}
          onClick={startEdit}
          className="!rounded-xl"
        >
          Edit stall
        </Button>
      </div>

      {error && <Alert type="error" title={error} showIcon />}

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
          <Image
            src={stall.photoUrl}
            alt={stall.stallName}
            preview={false}
            className="!w-20 !h-20 !rounded-2xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
<div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-stone-900">{stall.stallName}</h2>
          </div>
            <div className="flex items-center gap-2 mt-1">
              <Rate disabled allowHalf value={stall.rating} className="!text-sm" />
              <span className="text-sm text-stone-500">
                {stall.rating.toFixed(1)} ({stall.ratingCount})
              </span>
            </div>
            <p className="text-sm text-stone-600 mt-3 leading-relaxed">{stall.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white shadow-sm p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Farm type</p>
          <p className="text-sm font-semibold text-stone-800 mt-1">
            {FARM_TYPE_LABELS[stall.farmType as keyof typeof FARM_TYPE_LABELS] ?? stall.farmType}
          </p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Delivery fee</p>
          <p className="text-sm font-semibold text-stone-800 mt-1">{formatPrice(stall.deliveryFeePeso)}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Pickup</p>
          <p className="text-sm font-semibold text-stone-800 mt-1">
            {stall.pickupAvailable ? 'Allowed' : 'Not offered'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-9 h-9 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center">
            <EnvironmentOutlined />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800">
              {stall.location.streetBuilding}, {stall.location.barangay},
            </p>
            <p className="text-sm text-stone-500">
              {stall.location.cityMunicipality}, {stall.location.province} {stall.location.postalCode}
            </p>
          </div>
        </div>
        <Link
          href={APP_ROUTES.publicSellerProfile('sell-celso')}
          className="text-sm font-medium text-[#2D6A4F] hover:text-[#1B4332] no-underline shrink-0"
        >
          View as buyers see it →
        </Link>
      </div>
    </div>
  );
}