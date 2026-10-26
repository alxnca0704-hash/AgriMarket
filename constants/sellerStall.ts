export const SELLER_STALL_TABS = ['overview', 'sales', 'payouts', 'platform', 'deposit'] as const;

export type SellerStallTab = (typeof SELLER_STALL_TABS)[number];

export const SELLER_STALL_TAB_LABELS: Record<SellerStallTab, string> = {
  overview: 'Overview',
  sales: 'Sales',
  payouts: 'Payouts',
  platform: 'Platform',
  deposit: 'Deposit',
};

const LEGACY_SELLER_STALL_TABS: Record<string, SellerStallTab> = {
  commissions: 'platform',
};

export function isLegacySellerStallTab(value: string | null) {
  return value !== null && value in LEGACY_SELLER_STALL_TABS;
}

export function parseSellerStallTab(value: string | null): SellerStallTab {
  if (value !== null && value in LEGACY_SELLER_STALL_TABS) return LEGACY_SELLER_STALL_TABS[value];
  return SELLER_STALL_TABS.includes(value as SellerStallTab) ? (value as SellerStallTab) : 'overview';
}
