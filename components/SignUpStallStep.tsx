'use client';

import React from 'react';
import { StallFormFields } from '@/components/seller/StallFormFields';
import type { StallFormDraft } from '@/hooks/useSellerOnboarding';
import type { useLocationCascade } from '@/hooks/useLocationCascade';

type LocationEditor = ReturnType<typeof useLocationCascade>;

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
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Set up your stall</h2>
        <p className="text-sm text-stone-500 mt-1">
          Tell buyers about your farm, where you&apos;re located, and how you deliver.
        </p>
      </div>
      <StallFormFields draft={stall} errors={errors} updateField={updateField} location={location} />
    </div>
  );
}