import { ProductFormView } from '@/components/seller/ProductFormView';

export default async function SellerProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductFormView listingId={id} />;
}