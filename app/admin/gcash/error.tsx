'use client';

import { Alert, Button } from 'antd';

export default function GcashError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
      <Alert
        type="error"
        showIcon
        title="Could not load GCash settings"
        description="Try loading the account settings again."
        action={<Button onClick={retry}>Retry</Button>}
      />
    </div>
  );
}
