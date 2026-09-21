'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Input, Modal, Skeleton } from 'antd';
import {
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useSellerSettings } from '@/hooks/useSellerSettings';
import { APP_ROUTES } from '@/constants/routes';
import { formatPrice } from '@/lib/format';

function SettingsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-4">
      <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
      {[0, 1, 2].map((i) => (
        <Skeleton.Button key={i} active block className="!h-24 !rounded-2xl" />
      ))}
    </div>
  );
}

export function SettingsView() {
  const router = useRouter();
  const {
    isLoading,
    error,
    user,
    stall,
    payout,
    isEditOpen,
    draft,
    errors,
    openEdit,
    closeEdit,
    updateField,
    saveProfile,
    signOut,
  } = useSellerSettings();

  if (isLoading) return <SettingsSkeleton />;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <Alert type="error" title={error ?? 'Account information is unavailable.'} showIcon />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Account</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
          Settings
        </h1>
      </div>

      {error && <Alert type="error" title={error} showIcon />}

      <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-xl font-semibold shrink-0">
              {user.fullName.trim().charAt(0).toUpperCase() || 'U'}
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-stone-900 truncate">{user.fullName}</p>
              <p className="text-sm text-stone-400">{user.email || 'No email on file'}</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={openEdit}
          className="w-full text-left flex items-center gap-3 px-5 sm:px-6 py-4 border-t border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <span className="w-10 h-10 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center">
            <UserOutlined />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800">Edit profile</p>
            <p className="text-xs text-stone-400">Update your name, mobile number and email</p>
          </div>
          <span className="text-stone-300 text-sm">›</span>
        </button>
      </section>

      {stall && (
        <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-stone-900">Your business</h2>
          </div>
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center">
              <ShopOutlined />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800">{stall.stallName}</p>
              <p className="text-xs text-stone-400">
                Stall profile · {formatPrice(stall.deliveryFeePeso)} delivery
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(APP_ROUTES.sellerStall)}
              className="text-sm text-sage hover:underline font-medium cursor-pointer shrink-0"
            >
              Manage
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 pb-2">
          <h2 className="text-sm font-semibold text-stone-900">Payout</h2>
        </div>
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center">
            <WalletOutlined />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800">Bank transfer</p>
            <p className="text-xs text-stone-400">
              {payout.accountName} · {payout.accountNumber}
              {payout.bankName ? ` · ${payout.bankName}` : ''}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white shadow-sm p-5 sm:p-6 flex items-center justify-center">
        <Button danger icon={<LogoutOutlined />} onClick={signOut} className="!rounded-xl !w-full sm:!w-auto">
          Sign out
        </Button>
      </section>

      <Modal
        open={isEditOpen}
        onCancel={closeEdit}
        onOk={saveProfile}
        okText="Save changes"
        cancelText="Cancel"
        okButtonProps={{ className: '!rounded-lg' }}
        cancelButtonProps={{ className: '!rounded-lg' }}
        title="Edit profile"
        width="min(92%, 460px)"
        centered
      >
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Full name</label>
            <Input
              size="large"
              className="!rounded-lg"
              value={draft.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              status={errors.fullName ? 'error' : ''}
            />
            {errors.fullName && <p className="text-sm text-error mt-1">{errors.fullName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Mobile number</label>
            <Input
              size="large"
              className="!rounded-lg"
              value={draft.mobileNumber}
              onChange={(e) => updateField('mobileNumber', e.target.value)}
              status={errors.mobileNumber ? 'error' : ''}
              prefix={<PhoneOutlined />}
            />
            {errors.mobileNumber && (
              <p className="text-sm text-error mt-1">{errors.mobileNumber}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Email address</label>
            <Input
              size="large"
              className="!rounded-lg"
              value={draft.email}
              onChange={(e) => updateField('email', e.target.value)}
              status={errors.email ? 'error' : ''}
              prefix={<MailOutlined />}
            />
            {errors.email && <p className="text-sm text-error mt-1">{errors.email}</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}