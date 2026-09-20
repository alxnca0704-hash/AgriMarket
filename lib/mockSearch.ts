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

const recentListeners = new Set<() => void>();
const EMPTY_RECENT: string[] = [];
let recentSnapshot: string[] | null = null;

export function getRecentSearchesSnapshot(): string[] {
  if (recentSnapshot === null) recentSnapshot = getRecentSearches();
  return recentSnapshot;
}

export function getEmptyRecentSearchesSnapshot(): string[] {
  return EMPTY_RECENT;
}

export function subscribeRecentSearches(listener: () => void): () => void {
  recentListeners.add(listener);
  return () => {
    recentListeners.delete(listener);
  };
}

function commitRecentSearches(next: string[]): void {
  recentSnapshot = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  recentListeners.forEach((listener) => listener());
}

export function saveRecentSearch(query: string): void {
  const clean = query.trim();
  if (!clean) return;
  const existing = (recentSnapshot ?? getRecentSearches()).filter(
    (q) => q.toLowerCase() !== clean.toLowerCase()
  );
  commitRecentSearches([clean, ...existing].slice(0, 5));
}

export function clearRecentSearches(): void {
  commitRecentSearches([]);
}