'use client';

import React from 'react';
import { Alert, Button, Image, Skeleton, App } from 'antd';
import { makeFunctionReference } from 'convex/server';
import { useQuery } from 'convex/react';
import { StallFormFields } from '@/components/seller/StallFormFields';
import type { StallFormDraft } from '@/hooks/useSellerOnboarding';
import type { useLocationCascade } from '@/hooks/useLocationCascade';
import { STALL_DEPOSIT_AMOUNT } from '@/constants/deposits';
import { formatPrice } from '@/lib/format';

type LocationEditor = ReturnType<typeof useLocationCascade>;

const gcashRef = makeFunctionReference<'query', Record<string, never>, { qrUrl: string; number: string } | null>('deposits:getPublicGcashSettings');

interface SignUpStallStepProps {
  stall: StallFormDraft;
  errors: Record<string, string>;
  updateField: <K extends keyof StallFormDraft>(
    field: K,
    value: StallFormDraft[K]
  ) => void;
  location: LocationEditor;
}

export function SignUpStallStep({
  stall,
  errors,
  updateField,
  location,
}: SignUpStallStepProps) {
  const { message } = App.useApp();
  const gcash = useQuery(gcashRef, {});

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Set up your stall</h2>
        <p className="text-sm text-stone-500 mt-1">
          Tell buyers about your farm, where you&apos;re located, and how you deliver.
        </p>
      </div>

      <div className="space-y-3">
        <Alert type="info" showIcon title={`Stall security deposit required: ${formatPrice(STALL_DEPOSIT_AMOUNT)}`} description="You&apos;ll need to send this via GCash during the deposit step." />
        {gcash === undefined ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : gcash ? (
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-stone-50 p-4">
            <Image src={gcash.qrUrl} alt="GCash QR code" className="!max-h-48 object-contain" />
            <div>
              <p className="text-sm text-stone-500">Platform GCash account</p>
              <p className="font-semibold">{gcash.number}</p>
              <p className="mt-1 text-xs text-stone-500">Send your deposit to this account when submitting.</p>
              <div className="mt-2 flex gap-2">
                <Button size="small" href={gcash.qrUrl} target="_blank">
                  Download QR
                </Button>
                <Button
                  size="small"
                  onClick={async () => {
                    await navigator.clipboard.writeText(gcash.number);
                    message.success('GCash number copied.');
                  }}
                >
                  Copy number
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Alert type="warning" title="GCash payment details are not configured." />
        )}
      </div>

      <StallFormFields draft={stall} errors={errors} updateField={updateField} location={location} />
    </div>
  );
}
