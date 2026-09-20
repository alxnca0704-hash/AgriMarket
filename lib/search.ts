import { MOCK_CATALOG } from '@/lib/mockCatalog';
import { Product } from '@/types/product';

export function searchCatalog(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_CATALOG.products.filter((product) => {
    const seller = MOCK_CATALOG.sellers.find((s) => s.id === product.sellerId);
    const haystack = [
      product.name,
      product.category,
      product.origin,
      product.tags.join(' '),
      seller?.farmName ?? '',
      seller?.location ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}