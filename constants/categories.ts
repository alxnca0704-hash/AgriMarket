export const CATEGORY_OPTIONS = [
  { key: 'fruits', label: 'Fruits' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'grains', label: 'Grains' },
] as const;

export type ProductCategory = (typeof CATEGORY_OPTIONS)[number]['key'];

export const ALL_CATEGORIES = [
  { key: 'all', label: 'All' },
  ...CATEGORY_OPTIONS,
] as const;