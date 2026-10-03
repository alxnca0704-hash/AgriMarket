'use client';

import React from 'react';
import Link from 'next/link';
import { Alert, Button, Empty, Skeleton } from 'antd';
import {
  CreditCardOutlined,
  EditOutlined,
  EnvironmentOutlined,
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useProfile } from '@/hooks/useProfile';
import { APP_ROUTES } from '@/constants/routes';
import { formatAddressSummary } from '@/lib/format';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { AddressFormModal } from '@/components/profile/AddressFormModal';
import { AddressCard } from '@/components/profile/AddressCard';

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton.Avatar active size={64} shape="circle" />
          <Skeleton active title={{ width: '50%' }} paragraph={{ rows: 1 }} className="flex-1" />
        </div>
      </div>
      <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6">
        <Skeleton active paragraph={{ rows: 3 }} title={{ width: '30%' }} />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <span className="w-9 h-9 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center mt-0.5 text-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</p>
        <p className="text-sm text-stone-800 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export function ProfileView() {
  const {
    isLoading,
    error,
    user,
    roleLabel,
    addressBook,
    isEditOpen,
    draft,
    errors,
    openEditModal,
    closeEditModal,
    updateField,
    saveProfile,
    signOut,
    isSigningOut,
  } = useProfile();

  const initial = user.fullName.trim().charAt(0).toUpperCase() || 'U';
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
  });
  const defaultAddress = addressBook.addresses[addressBook.defaultIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-10 pb-16 space-y-5 sm:space-y-6">
      <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-stone-900">
        My profile
      </h1>

      {error && <Alert type="error" title={error} showIcon />}

      {isLoading ? (
        <ProfileSkeleton />
      ) : (
        <>
          <section className="rounded-2xl bg-white shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-2xl sm:text-3xl font-semibold">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-stone-900 truncate">
                  {user.fullName}
                </h2>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-sage bg-sage-soft px-2.5 py-1 rounded-full">
                  {roleLabel}
                </span>
              </div>
              <p className="text-sm text-stone-400 mt-1">Member since {memberSince}</p>
            </div>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={openEditModal}
              className="!rounded-xl self-start sm:self-auto"
            >
              Edit profile
            </Button>
          </section>

          <section className="rounded-2xl bg-white shadow-sm p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-stone-900 mb-4">
              Contact information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <InfoRow icon={<MailOutlined />} label="Email address" value={user.email || 'No email on file'} />
              <InfoRow icon={<PhoneOutlined />} label="Mobile number" value={user.mobileNumber} />
              <InfoRow
                icon={<EnvironmentOutlined />}
                label="Default address"
                value={
                  defaultAddress
                    ? formatAddressSummary(defaultAddress)
                    : 'No saved address yet'
                }
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-stone-900">
                  Delivery addresses
                </h3>
                <p className="text-sm text-stone-400">
                  {addressBook.addresses.length}{' '}
                  {addressBook.addresses.length === 1 ? 'address' : 'addresses'} saved
                </p>
              </div>
              <Button
                type="primary"
                ghost
                icon={<PlusOutlined />}
                onClick={addressBook.openAdd}
                className="!rounded-xl"
              >
                Add
              </Button>
            </div>

            {addressBook.addresses.length === 0 ? (
              <div className="rounded-2xl bg-white shadow-sm py-10">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="space-y-1.5">
                      <p className="text-stone-800 font-medium">No saved addresses yet</p>
                      <p className="text-sm text-stone-400">
                        Add a delivery address so checkout is faster next time.
                      </p>
                    </div>
                  }
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={addressBook.openAdd}
                    className="!rounded-xl"
                  >
                    Add your first address
                  </Button>
                </Empty>
              </div>
            ) : (
              <div className="space-y-3">
                {addressBook.addresses.map((address, index) => (
                  <AddressCard
                    key={`${index}-${address.region}-${address.streetBuilding}`}
                    address={address}
                    isDefault={index === addressBook.defaultIndex}
                    onEdit={() => addressBook.openEdit(index)}
                    onSetDefault={() => addressBook.setDefaultAddress(index)}
                    onRemove={() => addressBook.removeAddress(index)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
              <h3 className="text-sm font-semibold text-stone-900">Account</h3>
            </div>
            <Link
              href={APP_ROUTES.profileAddresses}
              className="flex items-center gap-3 px-5 sm:px-6 py-4 hover:bg-stone-50 transition-colors"
            >
              <span className="w-10 h-10 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center">
                <EnvironmentOutlined />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800">My addresses</p>
                <p className="text-xs text-stone-400">
                  Manage all saved delivery addresses
                </p>
              </div>
              <RightOutlined className="text-stone-300" />
            </Link>
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 cursor-not-allowed opacity-60">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center">
                <CreditCardOutlined />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800">Payment methods</p>
                <p className="text-xs text-stone-400">Coming soon</p>
              </div>
            </div>
            <Link
              href={APP_ROUTES.sellerOnboarding}
              className="flex items-center gap-3 px-5 sm:px-6 py-4 border-t border-stone-100 hover:bg-stone-50 transition-colors"
            >
              <span className="w-10 h-10 shrink-0 rounded-xl bg-sage-soft text-sage flex items-center justify-center">
                <RightOutlined />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800">Become a seller</p>
                <p className="text-xs text-stone-400">
                  Set up your stall and list your produce
                </p>
              </div>
              <RightOutlined className="text-stone-300" />
            </Link>
            <div className="border-t border-stone-100 px-5 py-4 sm:px-6">
              <Button
                danger
                block
                icon={<LogoutOutlined />}
                loading={isSigningOut}
                onClick={signOut}
                className="!rounded-xl"
              >
                Sign out
              </Button>
            </div>
          </section>

          <EditProfileModal
            open={isEditOpen}
            draft={draft}
            errors={errors}
            onUpdate={updateField}
            onSave={saveProfile}
            onCancel={closeEditModal}
          />
          <AddressFormModal
            open={addressBook.editorOpen}
            title={addressBook.editorTitle}
            submitLabel={addressBook.submitLabel}
            editor={addressBook.editor}
            onSave={addressBook.saveAddress}
            onCancel={addressBook.closeEditor}
          />
        </>
      )}
    </div>
  );
}
