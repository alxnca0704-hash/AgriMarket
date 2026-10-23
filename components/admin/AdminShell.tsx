'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge, Drawer, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  AccountBookOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  CreditCardOutlined,
  DollarOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { BrandMark } from '@/components/BrandMark';
import { APP_ROUTES } from '@/constants/routes';
import { useAdminShell } from '@/hooks/useAdminShell';

const { Sider, Content } = Layout;

const TABS = [
  { key: 'gcash', label: 'GCash account', href: APP_ROUTES.adminGcash, icon: <SettingOutlined /> },
  { key: 'payments', label: 'Verify payments', href: APP_ROUTES.adminPayments, icon: <CreditCardOutlined /> },
  { key: 'payouts', label: 'Approve payouts', href: APP_ROUTES.adminPayouts, icon: <AccountBookOutlined /> },
  { key: 'refunds', label: 'Review refunds', href: APP_ROUTES.adminRefunds, icon: <CheckCircleOutlined /> },
  { key: 'deposits', label: 'Deposits', href: APP_ROUTES.adminDeposits, icon: <WalletOutlined /> },
  { key: 'commissions', label: 'Commissions', href: APP_ROUTES.adminCommissions, icon: <DollarOutlined /> },
  { key: 'receivables', label: 'Commission receivables', href: APP_ROUTES.adminReceivables, icon: <AccountBookOutlined /> },
  { key: 'sales', label: 'Sales', href: APP_ROUTES.adminSales, icon: <DollarOutlined /> },
  { key: 'sellerVerification', label: 'Seller verification', href: APP_ROUTES.adminSellerVerification, icon: <SafetyCertificateOutlined /> },
] as const;

function resolveActiveKey(pathname: string): string | null {
  const tab = TABS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return tab?.key ?? null;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { pendingGcashCount, pendingRefundCount, pendingDepositCount, pendingCommissionCount } = useAdminShell();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navItems: MenuProps['items'] = useMemo(
    () => TABS.map((tab) => ({
      key: tab.key,
      label: tab.key === 'payments'
        ? <span className="flex items-center gap-3">{tab.label}<Badge count={pendingGcashCount} size="small" /></span>
        : tab.key === 'deposits'
          ? <span className="flex items-center gap-3">{tab.label}<Badge count={pendingDepositCount} size="small" /></span>
          : tab.key === 'commissions'
            ? <span className="flex items-center gap-3">{tab.label}<Badge count={pendingCommissionCount} size="small" /></span>
          : tab.key === 'refunds'
          ? <span className="flex items-center gap-3">{tab.label}<Badge count={pendingRefundCount} size="small" /></span>
          : tab.label,
      icon: tab.icon,
    })),
    [pendingGcashCount, pendingRefundCount, pendingDepositCount, pendingCommissionCount]
  );
  const handleNavigate: MenuProps['onClick'] = ({ key }) => {
    const tab = TABS.find((item) => item.key === key);
    setDrawerOpen(false);
    if (tab) router.push(tab.href);
  };
  const activeKey = resolveActiveKey(pathname);

  const renderSidebar = (closeButton?: React.ReactNode) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 pl-5 pr-4 pb-5 pt-7">
        <Link href={APP_ROUTES.admin} className="flex items-center no-underline"><BrandMark size="md" /></Link>
        {closeButton ?? <span className="w-8 shrink-0" aria-hidden />}
      </div>
      <p className="px-6 pb-2 text-[11px] font-medium uppercase tracking-wide text-stone-400">Admin</p>
      <Menu mode="inline" items={navItems} selectedKeys={activeKey ? [activeKey] : []} onClick={handleNavigate} className="flex-1 !border-none !bg-transparent !px-0 pb-6" />
    </div>
  );

  return (
    <Layout>
      <Sider theme="light" width={248} className="hidden lg:block" style={{ position: 'sticky', top: 0, height: '100vh' }}>
        {renderSidebar()}
      </Sider>
      <Layout className="min-w-0">
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-1.5 px-4 sm:px-6">
            <button type="button" aria-label="Go back" onClick={() => router.back()} className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:text-[#2D6A4F]">
              <ArrowLeftOutlined />
            </button>
            <button type="button" aria-label="Open menu" onClick={() => setDrawerOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-600 hover:text-[#2D6A4F]">
              <MenuOutlined />
            </button>
            <Link href={APP_ROUTES.admin} className="flex items-center no-underline"><BrandMark /></Link>
          </div>
        </div>
        <Content><main>{children}</main></Content>
      </Layout>
      <Drawer placement="left" size={248} closable={false} open={drawerOpen} onClose={() => setDrawerOpen(false)} styles={{ body: { padding: 0 } }}>
        {renderSidebar(<button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:text-[#2D6A4F]"><CloseOutlined /></button>)}
      </Drawer>
    </Layout>
  );
}
