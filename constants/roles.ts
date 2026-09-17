export const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_DETAILS = {
  [ROLES.BUYER]: {
    label: 'Buyer',
    tagline: 'Buy fresh produce',
    description: 'Order directly from local farmers and pick up or receive fresh farm goods at fair prices.',
  },
  [ROLES.SELLER]: {
    label: 'Farmer / Seller',
    tagline: 'Sell your harvests',
    description: 'List your crops, connect with local buyers, and manage orders with zero middlemen.',
  },
} as const;
