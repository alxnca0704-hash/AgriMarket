'use client';

import React from 'react';
import { Button, Skeleton, Alert } from 'antd';
import { useLanding } from '@/hooks/useLanding';
import { APP_ROUTES } from '@/constants/routes';

export function LandingView() {
  const {
    isLoading,
    error,
    activeCategory,
    setActiveCategory,
    filteredProduce,
    regionalHubs,
    handleCreateAccount,
    handleJoinAsBuyer,
    handleJoinAsSeller,
    handleLogIn,
  } = useLanding();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FBFBFA] p-6 md:p-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton active paragraph={{ rows: 2 }} />
          <Skeleton.Button active block style={{ height: 200 }} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton active paragraph={{ rows: 3 }} />
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] text-[#1E293B]">
      {/* Top Clean Header */}
      <header className="sticky top-0 z-30 bg-[#FBFBFA]/90 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href={APP_ROUTES.landing} className="flex items-center gap-2.5 group text-decoration-none">
            <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" />
                <path d="M12 6v12" />
                <path d="M8 10l4-4 4 4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base tracking-tight text-slate-900 leading-none">
                agrimarket
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">
                philippines
              </span>
            </div>
          </a>

          <nav className="hidden sm:flex items-center gap-6 text-xs font-medium text-slate-600">
            <a href="#harvests" className="hover:text-slate-900 transition-colors">
              Harvests
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How It Works
            </a>
            <a href="#roles" className="hover:text-slate-900 transition-colors">
              Roles
            </a>
            <a href="#regions" className="hover:text-slate-900 transition-colors">
              Regional Hubs
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Button
              type="text"
              onClick={handleLogIn}
              className="!text-xs !font-medium !text-slate-600 hover:!text-slate-900"
            >
              Log in
            </Button>
            <Button
              type="primary"
              onClick={handleCreateAccount}
              className="!text-xs !font-medium !h-8 !px-3.5 !rounded-lg !bg-[#2D6A4F] hover:!bg-[#1B4332]"
            >
              Create account
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4 w-full">
          <Alert type="error" message={error} showIcon />
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-16 pb-16 md:pt-24 md:pb-20 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-[#2D6A4F] text-xs font-medium mb-6">
            <span>Direct Philippine Produce</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.15] max-w-2xl">
            Connecting local farmers and buyers.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed max-w-2xl font-normal">
            A simple marketplace for fresh Philippine produce. Sourced directly from regional growers, delivered through community consolidation hubs with zero intermediary markups.
          </p>

          {/* Action Row */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="primary"
              size="large"
              onClick={handleCreateAccount}
              className="!h-11 !px-6 !text-sm !font-medium !rounded-lg !bg-[#2D6A4F] hover:!bg-[#1B4332] w-full sm:w-auto"
            >
              Create an account
            </Button>
            <Button
              type="default"
              size="large"
              onClick={handleLogIn}
              className="!h-11 !px-6 !text-sm !font-medium !rounded-lg !bg-white !text-slate-700 !border-slate-300 hover:!border-slate-400 w-full sm:w-auto"
            >
              Log in
            </Button>
          </div>

          {/* Supporting Signals */}
          <div className="mt-14 pt-8 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Verified regional growers
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Produce is cataloged directly by registered smallholder farms and agricultural cooperatives.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Direct farmgate pricing
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Clear rates determined by farmers, without middleman deductions or distributor markups.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Barangay consolidation
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Aggregated drop-offs and scheduled pickups at municipal distribution centers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Directory Section */}
      <section id="harvests" className="py-16 md:py-20 border-b border-slate-200/60 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Directory Preview
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1 tracking-tight">
                Current regional harvests
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'fruits', label: 'Fruits' },
                  { key: 'vegetables', label: 'Vegetables' },
                  { key: 'grains', label: 'Grains & Coffee' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    activeCategory === tab.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Clean Harvest Table */}
          <div className="border border-slate-200/80 rounded-xl overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-12 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-500 border-b border-slate-200/80">
              <span className="col-span-4">Produce</span>
              <span className="col-span-3">Origin & Farm</span>
              <span className="col-span-3">Availability</span>
              <span className="col-span-2 text-right">Farmgate Rate</span>
            </div>

            <div className="divide-y divide-slate-200/60">
              {filteredProduce.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:py-3 sm:px-4 sm:grid sm:grid-cols-12 items-center text-xs hover:bg-slate-50/50 transition-colors"
                >
                  <div className="col-span-4 mb-2 sm:mb-0">
                    <span className="font-semibold text-slate-900 text-sm sm:text-xs block">
                      {item.name}
                    </span>
                    <span className="text-slate-400 capitalize text-[11px] sm:hidden">
                      {item.category}
                    </span>
                  </div>

                  <div className="col-span-3 text-slate-600 mb-1 sm:mb-0">
                    <div>{item.origin}</div>
                    <div className="text-slate-400 text-[11px]">{item.farm}</div>
                  </div>

                  <div className="col-span-3 text-slate-500 mb-2 sm:mb-0 text-[11px]">
                    {item.harvestTiming}
                  </div>

                  <div className="col-span-2 sm:text-right flex sm:block items-center justify-between">
                    <span className="text-slate-400 sm:hidden">Rate:</span>
                    <span className="font-semibold text-slate-900 font-mono text-sm sm:text-xs">
                      ₱{item.farmgatePrice} <span className="font-normal text-slate-400 text-[11px]">/ {item.unit}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dual Roles Section */}
      <section id="roles" className="py-16 md:py-20 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-10 text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Account Types
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1 tracking-tight">
              Designed for both sides of the exchange
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buyer Card */}
            <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 inline-block mb-3">
                  Buyer Account
                </span>
                <h3 className="text-base font-semibold text-slate-900">
                  For households, eateries & wholesalers
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Order fresh farm produce directly from verified growers at standard farmgate rates.
                </p>

                <ul className="mt-5 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                    <span>Direct farmgate rates with zero retailer markup</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                    <span>Fresh harvests delivered or consolidated locally</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                    <span>Clear origin tracking for every batch</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100">
                <Button
                  type="default"
                  block
                  onClick={handleJoinAsBuyer}
                  className="!text-xs !font-medium !h-9 !rounded-lg !bg-slate-50 hover:!bg-slate-100"
                >
                  Join as a Buyer →
                </Button>
              </div>
            </div>

            {/* Farmer Card */}
            <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-[#2D6A4F] inline-block mb-3">
                  Farmer Account
                </span>
                <h3 className="text-base font-semibold text-slate-900">
                  For farmers & agricultural cooperatives
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  List your upcoming harvests, set your prices, and connect with direct buyers without intermediaries.
                </p>

                <ul className="mt-5 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                    <span>Set your own farmgate prices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                    <span>No platform commission deductions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                    <span>Drop off at your local municipal consolidation hub</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100">
                <Button
                  type="default"
                  block
                  onClick={handleJoinAsSeller}
                  className="!text-xs !font-medium !h-9 !rounded-lg !bg-slate-50 hover:!bg-slate-100"
                >
                  Join as a Farmer →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 md:py-20 border-b border-slate-200/60 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-10 text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Process
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1 tracking-tight">
              How Agrimarket works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <span className="text-xs font-mono font-bold text-slate-400 block mb-2">01</span>
              <h3 className="text-sm font-semibold text-slate-900">List upcoming harvests</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Growers post their harvest schedule, expected quantities, and farmgate pricing.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <span className="text-xs font-mono font-bold text-slate-400 block mb-2">02</span>
              <h3 className="text-sm font-semibold text-slate-900">Reserve orders</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Buyers confirm orders at set farmgate rates ahead of harvest completion.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/50">
              <span className="text-xs font-mono font-bold text-slate-400 block mb-2">03</span>
              <h3 className="text-sm font-semibold text-slate-900">Consolidate & dispatch</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Crops are brought to the nearest municipal hub and dispatched for local pickup or delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Regional Hubs */}
      <section id="regions" className="py-14 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Locations
            </span>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mt-0.5 tracking-tight">
              Active regional corridors
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {regionalHubs.map((hub) => (
              <div
                key={hub.region}
                className="p-3.5 rounded-lg border border-slate-200/70 bg-white flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">{hub.region}</span>
                  <span className="text-slate-500 text-[11px]">{hub.mainCrops}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-3">
                  {hub.activeFarms} farms
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="py-12 bg-white text-slate-500 text-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Agrimarket Philippines</span>
            <span>•</span>
            <span>Prototype preview</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <button type="button" onClick={handleLogIn} className="hover:text-slate-800 cursor-pointer">
              Log in
            </button>
            <button type="button" onClick={handleCreateAccount} className="hover:text-slate-800 cursor-pointer">
              Sign up
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
