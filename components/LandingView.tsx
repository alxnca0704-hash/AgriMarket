'use client';

import React from 'react';
import { Button, Skeleton, Alert } from 'antd';
import { useLanding } from '@/hooks/useLanding';
import { APP_ROUTES } from '@/constants/routes';
import { BrandMark } from '@/components/BrandMark';

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
      <main className="min-h-screen bg-stone-50 p-6 md:p-16">
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
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Top Clean Header */}
      <header className="sticky top-0 z-30 bg-stone-50/90 backdrop-blur-md border-b border-stone-200/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href={APP_ROUTES.landing} className="flex items-center gap-2.5 no-underline">
            <BrandMark size="md" />
          </a>

          <nav className="hidden sm:flex items-center gap-7 text-sm font-medium text-stone-600">
            <a href="#harvests" className="hover:text-stone-900 transition-colors">
              Harvests
            </a>
            <a href="#how-it-works" className="hover:text-stone-900 transition-colors">
              How It Works
            </a>
            <a href="#roles" className="hover:text-stone-900 transition-colors">
              Roles
            </a>
            <a href="#regions" className="hover:text-stone-900 transition-colors">
              Regional Hubs
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Button
              type="text"
              onClick={handleLogIn}
              className="!text-sm !font-medium !text-[#2D6A4F] hover:!text-[#1B4332]"
            >
              Log in
            </Button>
            <Button
              type="primary"
              onClick={handleCreateAccount}
              className="!text-sm !font-medium !h-8 !px-3.5 !rounded-lg !bg-[#2D6A4F] hover:!bg-[#1B4332]"
            >
              Create account
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4 w-full">
          <Alert type="error" title={error} showIcon />
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 border-b border-stone-200/70 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[44rem] h-[44rem] rounded-full opacity-[0.06] bg-[radial-gradient(closest-side,#2D6A4F,transparent)]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-sage" />
            Direct Philippine Produce
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-stone-900 leading-[1.08] tracking-tight max-w-3xl">
            Connecting <em className="italic">local farmers</em> and buyers.
          </h1>

          <p className="text-base sm:text-lg text-stone-600 mt-6 leading-relaxed max-w-2xl font-normal">
            A simple marketplace for fresh Philippine produce. Sourced directly from regional growers, delivered through community consolidation hubs with zero intermediary markups.
          </p>

          {/* Action Row */}
          <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="primary"
              size="large"
              onClick={handleCreateAccount}
              className="!h-11 !px-7 !text-sm !font-medium !rounded-lg !bg-[#2D6A4F] hover:!bg-[#1B4332] w-full sm:w-auto"
            >
              Create account
            </Button>
            <Button
              type="default"
              size="large"
              onClick={handleLogIn}
              className="!h-11 !px-7 !text-sm !font-medium !rounded-lg !bg-white !text-[#2D6A4F] !border-[#2D6A4F] hover:!bg-[#E9F0EB] hover:!border-[#1B4332] hover:!text-[#1B4332] w-full sm:w-auto"
            >
              Log in
            </Button>
          </div>

          {/* Supporting Signals */}
          <div className="mt-16 pt-9 border-t border-stone-200/70 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">
                Verified regional growers
              </h2>
              <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                Produce is cataloged directly by registered smallholder farms and agricultural cooperatives.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">
                Direct farmgate pricing
              </h2>
              <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                Clear rates determined by farmers, without middleman deductions or distributor markups.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">
                Barangay consolidation
              </h2>
              <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                Aggregated drop-offs and scheduled pickups at municipal distribution centers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Directory Section */}
      <section id="harvests" className="py-16 md:py-24 border-b border-stone-200/70 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                Directory Preview
              </span>
              <h2 className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-2 tracking-tight">
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
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                    activeCategory === tab.key
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-[#E9F0EB] text-[#2D6A4F] hover:bg-[#DCEDE2]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Clean Harvest Table */}
          <div className="border border-stone-200/80 rounded-xl overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-12 bg-stone-50/80 px-4 py-3 text-xs font-semibold text-stone-500 border-b border-stone-200/80">
              <span className="col-span-4">Produce</span>
              <span className="col-span-3">Origin & Farm</span>
              <span className="col-span-3">Availability</span>
              <span className="col-span-2 text-right">Farmgate Rate</span>
            </div>

            <div className="divide-y divide-stone-200/70">
              {filteredProduce.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:py-3.5 sm:px-4 sm:grid sm:grid-cols-12 items-center text-sm hover:bg-stone-50/60 transition-colors"
                >
                  <div className="col-span-4 mb-2 sm:mb-0">
                    <span className="font-semibold text-stone-900 block">
                      {item.name}
                    </span>
                    <span className="text-stone-400 capitalize text-xs sm:hidden">
                      {item.category}
                    </span>
                  </div>

                  <div className="col-span-3 text-stone-600 mb-1 sm:mb-0">
                    <div>{item.origin}</div>
                    <div className="text-stone-400 text-xs">{item.farm}</div>
                  </div>

                  <div className="col-span-3 text-stone-500 mb-2 sm:mb-0 text-xs">
                    {item.harvestTiming}
                  </div>

                  <div className="col-span-2 sm:text-right flex sm:block items-center justify-between">
                    <span className="text-stone-400 sm:hidden">Rate:</span>
                    <span className="font-semibold text-stone-900 font-mono text-sm">
                      ₱{item.farmgatePrice} <span className="font-normal text-stone-400 text-xs">/ {item.unit}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dual Roles Section */}
      <section id="roles" className="py-16 md:py-24 border-b border-stone-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-12 text-left">
            <h2 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
              Designed for both sides of the exchange
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buyer Card */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-stone-200/80 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 inline-block mb-4">
                  Buyer Account
                </span>
                <h3 className="text-lg font-semibold text-stone-900">
                  For households, eateries & wholesalers
                </h3>
                <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                  Order fresh farm produce directly from verified growers at standard farmgate rates.
                </p>

                <ul className="mt-6 space-y-2.5 text-sm text-stone-600">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
                    <span>Direct farmgate rates with zero retailer markup</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
                    <span>Fresh harvests delivered or consolidated locally</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
                    <span>Clear origin tracking for every batch</span>
                  </li>
                </ul>
              </div>

              <div className="pt-7 mt-7 border-t border-stone-100">
                <Button
                  type="default"
                  block
                  onClick={handleJoinAsBuyer}
                  className="!text-sm !font-medium !h-11 !rounded-lg !bg-white !text-[#2D6A4F] !border-[#2D6A4F] hover:!bg-[#E9F0EB]"
                >
                  Join as a Buyer →
                </Button>
              </div>
            </div>

            {/* Farmer Card */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-stone-200/80 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-sage-soft text-sage inline-block mb-4">
                  Farmer Account
                </span>
                <h3 className="text-lg font-semibold text-stone-900">
                  For farmers & agricultural cooperatives
                </h3>
                <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                  List your upcoming harvests, set your prices, and connect with direct buyers without intermediaries.
                </p>

                <ul className="mt-6 space-y-2.5 text-sm text-stone-600">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
                    <span>Set your own farmgate prices</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
                    <span>No platform commission deductions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
                    <span>Drop off at your local municipal consolidation hub</span>
                  </li>
                </ul>
              </div>

              <div className="pt-7 mt-7 border-t border-stone-100">
                <Button
                  type="default"
                  block
                  onClick={handleJoinAsSeller}
                  className="!text-sm !font-medium !h-11 !rounded-lg !bg-white !text-[#2D6A4F] !border-[#2D6A4F] hover:!bg-[#E9F0EB]"
                >
                  Join as a Farmer →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 md:py-24 border-b border-stone-200/70 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-12 text-left">
            <h2 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
              How Agrimarket works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-stone-200/80 bg-stone-50/60">
              <span className="text-sm font-mono font-bold text-stone-400 block mb-3">01</span>
              <h3 className="text-base font-semibold text-stone-900">List upcoming harvests</h3>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                Growers post their harvest schedule, expected quantities, and farmgate pricing.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-stone-200/80 bg-stone-50/60">
              <span className="text-sm font-mono font-bold text-stone-400 block mb-3">02</span>
              <h3 className="text-base font-semibold text-stone-900">Reserve orders</h3>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                Buyers confirm orders at set farmgate rates ahead of harvest completion.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-stone-200/80 bg-stone-50/60">
              <span className="text-sm font-mono font-bold text-stone-400 block mb-3">03</span>
              <h3 className="text-base font-semibold text-stone-900">Consolidate & dispatch</h3>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                Crops are brought to the nearest municipal hub and dispatched for local pickup or delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Regional Hubs */}
      <section id="regions" className="py-16 md:py-20 border-b border-stone-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
              Locations
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 mt-1.5 tracking-tight">
              Active regional corridors
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {regionalHubs.map((hub) => (
              <div
                key={hub.region}
                className="p-4 rounded-lg border border-stone-200/70 bg-white flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-semibold text-stone-800 block">{hub.region}</span>
                  <span className="text-stone-500 text-xs">{hub.mainCrops}</span>
                </div>
                <span className="text-stone-400 font-mono text-xs shrink-0 ml-3">
                  {hub.activeFarms} farms
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="py-12 bg-white text-stone-500 text-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">Agrimarket Philippines</span>
            <span>•</span>
            <span>Prototype preview</span>
          </div>
          <div className="flex items-center gap-5 text-stone-500">
            <button type="button" onClick={handleLogIn} className="text-[#2D6A4F] hover:text-[#1B4332] cursor-pointer">
              Log in
            </button>
            <button type="button" onClick={handleCreateAccount} className="text-[#2D6A4F] hover:text-[#1B4332] cursor-pointer">
              Create account
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}