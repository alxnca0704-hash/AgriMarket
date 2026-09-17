'use client';

import React from 'react';
import { Button, Alert, Skeleton } from 'antd';
import { usePlaceholderHome } from '@/hooks/usePlaceholderHome';
import { ROLE_DETAILS } from '@/constants/roles';
import { APP_ROUTES } from '@/constants/routes';

export function PlaceholderHomeView() {
  const { user, isLoading, error, handleLogOut } = usePlaceholderHome();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FBFBFA] p-6 md:p-12">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton active avatar paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      </main>
    );
  }

  const roleInfo = user ? ROLE_DETAILS[user.role] : null;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBFBFA] text-[#1E293B]">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#2D6A4F] text-white flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" />
                <path d="M12 6v12" />
                <path d="M8 10l4-4 4 4" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-900">
              agrimarket
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">
              {user?.fullName} ({roleInfo?.label})
            </span>
            <Button
              type="text"
              size="small"
              onClick={handleLogOut}
              className="!text-xs !font-medium !text-slate-600 hover:!text-slate-900"
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

        <div className="bg-white p-7 sm:p-9 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Account Created
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Welcome, {user?.fullName}.
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your registered details are recorded below.
            </p>
          </div>

          {/* Account Details Box */}
          {user && (
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-400">Account Type</span>
                <span className="font-semibold text-slate-800">
                  {roleInfo?.label}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-400">Mobile Number</span>
                <span className="font-medium text-slate-800 font-mono">{user.mobileNumber}</span>
              </div>

              {user.email && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-400">Email</span>
                  <span className="font-medium text-slate-800">{user.email}</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block mb-0.5">Primary Routing Address</span>
                <span className="font-medium text-slate-800 leading-relaxed block">
                  {user.defaultAddressSummary}
                </span>
              </div>
            </div>
          )}

          {/* Honest Note per Brief */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
            <span className="font-semibold text-slate-800 block">
              Prototype preview complete
            </span>
            <p className="text-slate-500 leading-relaxed">
              This prototype covers the authentication and onboarding workflow. Marketplace ordering, real-time inventory, and transaction handling are currently under development.
            </p>
          </div>

          {/* Loop-back Action */}
          <div className="pt-2">
            <Button
              type="default"
              size="large"
              block
              onClick={handleLogOut}
              className="!h-10 !text-xs !font-medium !rounded-lg !bg-white !border-slate-300 hover:!border-slate-400"
            >
              Log out and test flow again
            </Button>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-4">
        Agrimarket Philippines
      </footer>
    </div>
  );
}
