'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from 'antd';
import {
  ArrowLeftOutlined,
  HomeOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { APP_ROUTES } from '@/constants/routes';
import { BrandMark } from '@/components/BrandMark';
import { useCartContext } from '@/components/buyer/CartProvider';
import { getSessionUser } from '@/lib/mockSession';

const TABS = [
  { key: 'home', label: 'Home', href: APP_ROUTES.home, icon: <HomeOutlined /> },
  { key: 'search', label: 'Search', href: APP_ROUTES.search, icon: <SearchOutlined /> },
  { key: 'cart', label: 'Cart', href: APP_ROUTES.cart, icon: <ShoppingCartOutlined /> },
  { key: 'orders', label: 'Orders', href: APP_ROUTES.orders, icon: <UnorderedListOutlined /> },
  { key: 'profile', label: 'Profile', href: APP_ROUTES.profile, icon: <UserOutlined /> },
] as const;

export function BuyerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCartContext();
  const user = getSessionUser();

  const TAB_ROOTS = [
    APP_ROUTES.home,
    APP_ROUTES.search,
    APP_ROUTES.cart,
    APP_ROUTES.orders,
    APP_ROUTES.profile,
  ];

  const activeKey = pathname === APP_ROUTES.home || pathname.startsWith('/products')
    ? 'home'
    : pathname === APP_ROUTES.search
    ? 'search'
    : pathname === APP_ROUTES.cart
    ? 'cart'
    : pathname === APP_ROUTES.orders || pathname.startsWith('/orders')
    ? 'orders'
    : pathname === APP_ROUTES.profile || pathname.startsWith('/profile')
    ? 'profile'
    : null;

  const showBack = !TAB_ROOTS.includes(pathname as (typeof TAB_ROOTS)[number]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            {showBack && (
              <button
                type="button"
                aria-label="Go back"
                onClick={() => router.back()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:text-[#2D6A4F] cursor-pointer"
              >
                <ArrowLeftOutlined />
              </button>
            )}
            <Link href={APP_ROUTES.home} className="flex items-center no-underline">
              <BrandMark />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((tab) => {
              const active = activeKey === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium no-underline transition-colors ${
                    active
                      ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
                      : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                  }`}
                >
                  {tab.key === 'cart' ? (
                    <Badge count={itemCount} size="small" offset={[3, -2]}>
                      {tab.icon}
                    </Badge>
                  ) : (
                    tab.icon
                  )}
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          <Link href={APP_ROUTES.profile} aria-label="Open profile">
            <span className="w-8 h-8 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-sm font-semibold">
              {user.fullName.trim().charAt(0).toUpperCase()}
            </span>
          </Link>
        </div>

        <div className="md:hidden border-t border-stone-100">
          <div className="max-w-6xl mx-auto grid grid-cols-5">
            {TABS.map((tab) => {
              const active = activeKey === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium no-underline transition-colors ${
                    active ? 'text-[#2D6A4F]' : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <span className="text-lg leading-none">
                    {tab.key === 'cart' ? (
                      <Badge count={itemCount} size="small" offset={[4, -2]}>
                        {tab.icon}
                      </Badge>
                    ) : (
                      tab.icon
                    )}
                  </span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <div className="flex-1">
        <main>{children}</main>
      </div>
    </div>
  );
}