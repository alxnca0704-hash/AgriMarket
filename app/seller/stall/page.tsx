import { Suspense } from 'react';
import { SellerStallPage } from '@/components/seller/SellerStallPage';

function StallPageFallback() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-4 pb-16 pt-6 sm:px-6">
      <div className="h-48 animate-pulse rounded-3xl bg-white" />
      <div className="h-12 animate-pulse rounded-2xl bg-white" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-white" />)}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<StallPageFallback />}>
      <SellerStallPage />
    </Suspense>
  );
}
