import { Suspense } from 'react';
import { Skeleton } from 'antd';
import { SignUpWizard } from '@/components/SignUpWizard';

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50">
          <div className="w-full max-w-lg bg-white p-8 rounded-xl border border-stone-200/80">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        </div>
      }
    >
      <SignUpWizard />
    </Suspense>
  );
}
