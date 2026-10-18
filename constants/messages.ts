export const MAX_MESSAGE_LENGTH = 2000;

export const MESSAGE_FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'orders', label: 'Orders' },
] as const;

export const BUYER_QUICK_REPLIES = [
  'Is this produce fresh today?',
  'When will my order be dispatched?',
  'Can I change my delivery address?',
  'Is pickup available today?',
  'Thank you so much!',
] as const;

export const SELLER_QUICK_REPLIES = [
  'Hello! Yes, harvested fresh today.',
  'We are preparing your order right now.',
  'Your order is packed and ready for delivery.',
  'Feel free to ask if you have special requests.',
  'Thank you for supporting local farmers!',
] as const;
