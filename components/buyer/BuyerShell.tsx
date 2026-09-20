'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Drawer, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  ArrowLeftOutlined,
  CloseOutlined,
  HomeOutlined,
  MenuOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { APP_ROUTES } from '@/constants/routes';
import { BrandMark } from '@/components/BrandMark';
import { useCartContext } from '@/components/buyer/CartProvider';
import { DEMO_BUYER, getSessionUserSnapshot, subscribeSessionUser } from '@/lib/mockSession';

const { Sider, Content } = Layout;

const TABS = [
  { key: 'home', label: 'Home', href: APP_ROUTES.home, icon: <HomeOutlined /> },
  { key: 'cart', label: 'Cart', href: APP_ROUTES.cart, icon: <ShoppingCartOutlined /> },
  { key: 'orders', label: 'Orders', href: APP_ROUTES.orders, icon: <UnorderedListOutlined /> },
  { key: 'profile', label: 'Profile', href: APP_ROUTES.profile, icon: <UserOutlined /> },
] as const;

export function BuyerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCartContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = useSyncExternalStore(
    subscribeSessionUser,
    getSessionUserSnapshot,
    () => DEMO_BUYER
  );

  const TAB_ROOTS = [
    APP_ROUTES.home,
    APP_ROUTES.cart,
    APP_ROUTES.orders,
    APP_ROUTES.profile,
  ];

  const activeKey = pathname === APP_ROUTES.home || pathname.startsWith('/products')
    ? 'home'
    : pathname === APP_ROUTES.cart
    ? 'cart'
    : pathname === APP_ROUTES.orders || pathname.startsWith('/orders')
    ? 'orders'
    : pathname === APP_ROUTES.profile || pathname.startsWith('/profile')
    ? 'profile'
    : null;

  const showBack = !TAB_ROOTS.includes(pathname as (typeof TAB_ROOTS)[number]);

  const navItems: MenuProps['items'] = useMemo(
    () =>
      TABS.map((tab) => ({
        key: tab.key,
        icon: tab.icon,
        label:
          tab.key === 'cart' && itemCount > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <span>{tab.label}</span>
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2D6A4F] px-1 text-[10px] font-semibold leading-none text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            </span>
          ) : (
            tab.label
          ),
      })),
    [itemCount]
  );

  const handleNavigate: MenuProps['onClick'] = ({ key }) => {
    const tab = TABS.find((t) => t.key === key);
    setDrawerOpen(false);
    if (tab) router.push(tab.href);
  };

  const initial = user.fullName.trim().charAt(0).toUpperCase();

  const renderSidebar = (closeButton?: React.ReactNode) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 pl-5 pr-4 pb-5 pt-7">
        <Link href={APP_ROUTES.home} className="flex items-center no-underline">
          <BrandMark size="md" />
        </Link>
        {closeButton ?? <span className="w-8 shrink-0" aria-hidden />}
      </div>

      <p className="px-6 pb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
        Browse
      </p>

      <Menu
        mode="inline"
        items={navItems}
        selectedKeys={activeKey ? [activeKey] : []}
        onClick={handleNavigate}
        className="flex-1 !border-none !bg-transparent !px-0 pb-6"
      />

      <div className="border-t border-stone-100 px-4 pt-3 pb-5">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">
          Account
        </p>
        <Link
          href={APP_ROUTES.profile}
          className="flex items-center gap-3 no-underline rounded-xl p-2 hover:bg-stone-50 transition-colors"
        >
          <span className="w-10 h-10 shrink-0 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-base font-semibold">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">{user.fullName}</p>
            <p className="text-xs text-stone-400 truncate">View profile</p>
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
              <Link href={APP_ROUTES.home} className="flex items-center no-underline">
                <BrandMark />
              </Link>
            </div>

            <Link href={APP_ROUTES.profile} aria-label="Open profile">
              <span className="w-8 h-8 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center text-sm font-semibold">
                {initial}
              </span>
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