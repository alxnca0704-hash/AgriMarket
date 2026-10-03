'use client';

import { Button, Result, Skeleton, Spin } from 'antd';
import { useGcashReturn } from '@/hooks/useGcashReturn';
import { formatPrice } from '@/lib/format';

interface GcashReturnViewProps {
  orderIds: string[];
  currentStep: number;
}

export function GcashReturnView({ orderIds, currentStep }: GcashReturnViewProps) {
  const payment = useGcashReturn(orderIds, currentStep);

  if (payment.state === 'loading') {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      </div>
    );
  }

  if (payment.state === 'error') {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <Result
          status="error"
          title="We could not verify this payment"
          subTitle="Open your orders to check the payment status."
          extra={<Button type="primary" onClick={payment.goHome}>Go to home</Button>}
        />
      </div>
    );
  }

  if (payment.state === 'failed') {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <Result
          status="error"
          title="Payment was not completed"
          subTitle="Your order is still unpaid. You can check its status from your orders."
          extra={<Button type="primary" onClick={payment.goHome}>Go to home</Button>}
        />
      </div>
    );
  }

  if (payment.state === 'checking') {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <Result
          status="info"
          icon={<Spin size="large" />}
          title="Checking your GCash payment"
          subTitle={`We are waiting for PayMongo to confirm ${formatPrice(payment.total)}. This usually takes a moment.`}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <Result
        status="success"
        title="Payment successful"
        subTitle={payment.continuing
          ? `${formatPrice(payment.total)} received. Opening the next seller’s GCash payment…`
          : `${formatPrice(payment.total)} received. Taking you back to the homepage…`}
        extra={<Button onClick={payment.goHome}>Go to home now</Button>}
      />
    </div>
  );
}
