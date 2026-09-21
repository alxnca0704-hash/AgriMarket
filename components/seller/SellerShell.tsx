'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Drawer, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  AccountBookOutlined,
  ArrowLeftOutlined,
  BellOutlined,
  CloseOutlined,
  HomeOutlined,
  MenuOutlined,
  SettingOutlined,
  ShopOutlined,
  StarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { APP_ROUTES } from '@/constants/routes';
import { BrandMark } from '@/components/BrandMark';
import { useSellerShell } from '@/hooks/useSellerShell';

const { Sider, Content } = Layout;

const TABS = [
  { key: 'dashboard', label: 'Dashboard', href: APP_ROUTES.sellerDashboard, icon: <HomeOutlined /> },
  { key: 'products', label: 'Products', href: APP_ROUTES.sellerProducts, icon: <ShopOutlined /> },
  { key: 'orders', label: 'Orders', href: APP_ROUTES.sellerOrders, icon: <UnorderedListOutlined /> },
  { key: 'stall', label: 'My stall', href: APP_ROUTES.sellerStall, icon: <ShopOutlined /> },
  { key: 'earnings', label: 'Earnings', href: APP_ROUTES.sellerEarnings, icon: <AccountBookOutlined /> },
  { key: 'reviews', label: 'Reviews', href: APP_ROUTES.sellerReviews, icon: <StarOutlined /> },
  { key: 'notifications', label: 'Notifications', href: APP_ROUTES.sellerNotifications, icon: <BellOutlined /> },
  { key: 'settings', label: 'Settings', href: APP_ROUTES.sellerSettings, icon: <SettingOutlined /> },
] as const;

function resolveActiveKey(pathname: string): string | null {
  if (
    pathname === APP_ROUTES.seller ||
    pathname === APP_ROUTES.sellerDashboard ||
    pathname === APP_ROUTES.sellerOnboarding ||
    pathname.startsWith('/seller/dashboard')
  )
    return 'dashboard';
  if (pathname.startsWith('/seller/products')) return 'products';
  if (pathname.startsWith('/seller/orders')) return 'orders';
  if (pathname === APP_ROUTES.sellerStall) return 'stall';
  if (pathname === APP_ROUTES.sellerEarnings) return 'earnings';
  if (pathname === APP_ROUTES.sellerReviews) return 'reviews';
  if (pathname === APP_ROUTES.sellerNotifications) return 'notifications';
  if (pathname === APP_ROUTES.sellerSettings) return 'settings';
  return null;
}

export function SellerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, stall, unreadCount } = useSellerShell();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const TAB_ROOTS = TABS.map((tab) => tab.href);
  const showBack = !TAB_ROOTS.includes(pathname as (typeof TAB_ROOTS)[number]);

  const navItems: MenuProps['items'] = useMemo(
    () =>
      TABS.map((tab) => ({
        key: tab.key,
        icon: tab.icon,
        label:
          tab.key === 'notifications' && unreadCount > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <span>{tab.label}</span>
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2D6A4F] px-1 text-[10px] font-semibold leading-none text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </span>
          ) : (
            tab.label
          ),
      })),
    [unreadCount]
  );

  const handleNavigate: MenuProps['onClick'] = ({ key }) => {
    const tab = TABS.find((t) => t.key === key);
    setDrawerOpen(false);
    if (tab) router.push(tab.href);
  };

  const initial =
    stall?.stallName.trim().charAt(0).toUpperCase() ||
    user?.fullName.trim().charAt(0).toUpperCase() ||
    'S';

  const renderSidebar = (closeButton?: React.ReactNode) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 pl-5 pr-4 pb-5 pt-7">
        <Link href={APP_ROUTES.sellerDashboard} className="flex items-center no-underline">
          <BrandMark size="md" />
        </Link>
        {closeButton ?? <span className="w-8 shrink-0" aria-hidden />}
      </div>

      <p className="px-6 pb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
        Seller
      </p>

      <Menu
        mode="inline"
        items={navItems}
        selectedKeys={resolveActiveKey(pathname) ? [resolveActiveKey(pathname) as string] : []}
        onClick={handleNavigate}
        className="flex-1 !border-none !bg-transparent !px-0 pb-6"
      />

      <div className="border-t border-stone-100 px-4 pt-3 pb-5 space-y-1">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
          Account
        </p>
        <Link
          href={APP_ROUTES.sellerStall}
          className="flex items-center gap-3 no-underline rounded-xl p-2 hover:bg-stone-50 transition-colors"
        >
          <span className="w-10 h-10 shrink-0 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-base font-semibold">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">
              {stall?.stallName ?? user?.fullName ?? 'My stall'}
            </p>
            <p className="text-xs text-stone-400 truncate">View stall profile</p>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <Layout>
      <Sider
        theme="light"
        width={248}
        className="hidden lg:block"
        style={{ position: 'sticky', top: 0, height: '100vh' }}
      >
        {renderSidebar()}
      </Sider>

      <Layout className="min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur">
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
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setDrawerOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-600 hover:text-[#2D6A4F] cursor-pointer"
              >
                <MenuOutlined />
              </button>
              <Link href={APP_ROUTES.sellerDashboard} className="flex items-center no-underline">
                <BrandMark />
              </Link>
            </div>

            <Link href={APP_ROUTES.sellerNotifications} aria-label="Open notifications" className="relative">
              <span className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center">
                <BellOutlined />
              </span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2D6A4F] px-1 text-[10px] font-semibold leading-none text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <Content>
          <main>{children}</main>
        </Content>
      </Layout>

      <Drawer
        placement="left"
        size={248}
        closable={false}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {renderSidebar(
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-stone-500 hover:text-[#2D6A4F] cursor-pointer"
          >
            <CloseOutlined />
          </button>
        )}
      </Drawer>
    </Layout>
  );
}