import { ShopView } from '@/components/buyer/ShopView';

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShopView stallId={id} />;
}
