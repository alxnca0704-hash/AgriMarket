'use client';

import { Alert, Button } from 'antd';

export default function AdminPaymentsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Alert
        type="error"
        showIcon
        message="Could not load payment submissions"
        description={<Button className="mt-3" onClick={reset}>Retry</Button>}
      />
    </div>
  );
}
