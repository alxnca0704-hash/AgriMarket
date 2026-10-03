import { GcashReturnView } from '@/components/checkout/GcashReturnView';

interface PaymentReturnPageProps {
  searchParams: Promise<{ orders?: string | string[]; step?: string | string[] }>;
}

export default async function PaymentReturnPage({ searchParams }: PaymentReturnPageProps) {
  const params = await searchParams;
  const ordersParam = typeof params.orders === 'string' ? params.orders : '';
  const stepParam = typeof params.step === 'string' ? Number(params.step) : -1;

  return (
    <GcashReturnView
      orderIds={ordersParam ? ordersParam.split(',') : []}
      currentStep={stepParam}
    />
  );
}
