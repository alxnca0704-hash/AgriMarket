import { AdminStallDetailView } from '@/components/admin/AdminStallDetailView';

export default async function AdminStallDetailPage({ params }: { params: Promise<{ stallId: string }> }) {
  const { stallId } = await params;
  return <AdminStallDetailView stallId={stallId} />;
}
