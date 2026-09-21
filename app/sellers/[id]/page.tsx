import Link from 'next/link';
import { PublicStallView } from '@/components/seller/PublicStallView';
import { BrandMark } from '@/components/BrandMark';
import { APP_ROUTES } from '@/constants/routes';

export default async function PublicSellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href={APP_ROUTES.home} className="flex items-center no-underline shrink-0">
            <BrandMark />
          </Link>
          <Link
            href={APP_ROUTES.home}
            className="text-sm font-medium text-stone-500 hover:text-[#2D6A4F] no-underline transition-colors"
          >
            ← Back to store
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <PublicStallView stallId={id} />
      </main>
    </div>
  );
}