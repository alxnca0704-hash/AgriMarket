'use client';

import React from 'react';
import { Button, Alert, Skeleton } from 'antd';
import { usePlaceholderHome } from '@/hooks/usePlaceholderHome';
import { ROLE_DETAILS } from '@/constants/roles';
import { BrandMark } from '@/components/BrandMark';

export function PlaceholderHomeView() {
  const { user, isLoading, error, handleLogOut } = usePlaceholderHome();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-stone-50 p-6 md:p-12">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton active avatar paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      </main>
    );
  }

  const roleInfo = user ? ROLE_DETAILS[user.role] : null;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-stone-50 text-stone-900">
      {/* Top Bar */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <BrandMark />

          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-500 hidden sm:inline">
              {user?.fullName} ({roleInfo?.label})
            </span>
            <Button
              type="text"
              size="small"
              onClick={handleLogOut}
              className="!text-sm !font-medium !text-[#2D6A4F] hover:!text-[#1B4332]"
            >
              Log out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-12 sm:py-16 w-full flex-1">
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} showIcon />
          </div>
        )}

        <div className="space-y-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400 block mb-2">
              Account Created
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
              Welcome, {user?.fullName}.
            </h1>
            <p className="text-sm text-stone-500 mt-1.5">
              Your registered details are recorded below.
            </p>
          </div>

          {/* Account Details Box */}
          {user && (
            <div className="p-5 rounded-xl bg-white border border-stone-200/80 space-y-3 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                <span className="text-stone-400">Account Type</span>
                <span className="font-semibold text-stone-800">
                  {roleInfo?.label}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                <span className="text-stone-400">Mobile Number</span>
                <span className="font-medium text-stone-800 font-mono">{user.mobileNumber}</span>
              </div>

              {user.email && (
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                  <span className="text-stone-400">Email</span>
                  <span className="font-medium text-stone-800">{user.email}</span>
                </div>
              )}

              <div>
                <span className="text-stone-400 block mb-1">Primary Routing Address</span>
                <span className="font-medium text-stone-800 leading-relaxed block">
                  {user.defaultAddressSummary}
                </span>
              </div>
            </div>
          )}

          {/* Honest Note per Brief */}
          <div className="p-5 rounded-xl bg-stone-50 border border-stone-200/70 text-sm space-y-1.5">
            <span className="font-semibold text-stone-800 block">
              Prototype preview complete
            </span>
            <p className="text-stone-500 leading-relaxed">
              This prototype covers the authentication and onboarding workflow. Marketplace ordering, real-time inventory, and transaction handling are currently under development.
            </p>
          </div>

          {/* Loop-back Action */}
          <div className="pt-1">
            <Button
              type="default"
              size="large"
              block
              onClick={handleLogOut}
              className="!h-11 !text-sm !font-medium !rounded-lg !bg-white !text-[#2D6A4F] !border-[#2D6A4F] hover:!bg-[#E9F0EB]"
            >
              Log out and test flow again
            </Button>
          </div>
        </div>
      </main>

      <footer className="text-center text-sm text-stone-400 py-4">
        Agrimarket Philippines
      </footer>
    </div>
  );
}