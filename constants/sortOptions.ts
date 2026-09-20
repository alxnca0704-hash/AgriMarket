export const SORT_OPTIONS = [
  { key: 'featured', label: 'Featured' },
  { key: 'freshness', label: 'Freshness' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Top rated' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['key'];

export function getSortLabel(key: SortOption): string {
  const match = SORT_OPTIONS.find((o) => o.key === key);
  return match ? match.label : 'Featured';
}