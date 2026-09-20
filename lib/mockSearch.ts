const STORAGE_KEY = 'agrimarket_recent_searches';

export const TRENDING_SEARCHES = [
  'strawberries',
  'Arabica coffee',
  'Dinorado rice',
  'hydroponic greens',
  'carrots',
  'papaya',
] as const;

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined') return;
  const clean = query.trim();
  if (!clean) return;
  const existing = getRecentSearches().filter((q) => q.toLowerCase() !== clean.toLowerCase());
  const next = [clean, ...existing].slice(0, 5);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}