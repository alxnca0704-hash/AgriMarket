import { ProductDetailView } from '@/components/buyer/ProductDetailView';
import { MOCK_CATALOG } from '@/lib/mockCatalog';

export function generateStaticParams(): { id: string }[] {
  return MOCK_CATALOG.products.map((product) => ({ id: product.id }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailView productId={id} />;
}