import { SellerOrderDetailView } from '@/components/seller/OrderDetailView';

export default async function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SellerOrderDetailView orderId={id} />;
}