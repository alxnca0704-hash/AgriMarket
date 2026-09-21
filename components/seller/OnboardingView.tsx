'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Skeleton } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  HeartOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useSellerOnboarding } from '@/hooks/useSellerOnboarding';
import { StallFormFields } from '@/components/seller/StallFormFields';
import { APP_ROUTES } from '@/constants/routes';

const PERKS = [
  {
    icon: <GlobalOutlined />,
    title: 'Sell to thousands',
    desc: 'Get your produce in front of AgriMarket shoppers nearby.',
  },
  {
    icon: <HeartOutlined />,
    title: 'Fair pricing',
    desc: 'No commission on first sales. You set your own prices.',
  },
  {
    icon: <ShopOutlined />,
    title: 'Own your storefront',
    desc: 'A dedicated public stall page where buyers can find and order from you.',
  },
];

export function OnboardingView() {
  const router = useRouter();
  const { isLoading, error, isSaving, draft, errors, updateField, submit, location } =
    useSellerOnboarding();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-4">
        <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
        <Skeleton.Button active block className="!h-64 !rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-6">
      <button
        type="button"
        onClick={() => router.push(APP_ROUTES.seller)}
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
      >
        <ArrowLeftOutlined /> <span>Back</span>
      </button>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Sell on AgriMarket</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
          Set up your stall
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Tell buyers about your farm, where you&apos;re located, and how you deliver.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PERKS.map((perk) => (
          <div key={perk.title} className="rounded-2xl bg-white shadow-sm p-4">
            <span className="w-9 h-9 rounded-xl bg-sage-soft text-sage flex items-center justify-center text-sm">
              {perk.icon}
            </span>
            <p className="text-sm font-semibold text-stone-900 mt-2.5">{perk.title}</p>
            <p className="text-xs text-stone-500 leading-relaxed mt-1">{perk.desc}</p>
          </div>
        ))}
      </div>

      {error && <Alert type="error" title={error} showIcon />}

      <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6">
        <StallFormFields draft={draft} errors={errors} updateField={updateField} location={location} />
      </div>

      <div className="rounded-2xl bg-sage-soft/60 p-4 sm:p-5 flex items-start gap-3">
        <CheckCircleOutlined className="text-sage mt-0.5 shrink-0" />
        <p className="text-sm text-stone-700 leading-relaxed">
          You can edit everything here later from your stall settings. Inactive listings are hidden
          from shoppers until you set stock.
        </p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button size="large" onClick={() => router.push(APP_ROUTES.seller)} className="!rounded-xl">
          Cancel
        </Button>
        <Button size="large" type="primary" loading={isSaving} onClick={submit} className="!rounded-xl">
          Create my stall
        </Button>
      </div>
    </div>
  );
}