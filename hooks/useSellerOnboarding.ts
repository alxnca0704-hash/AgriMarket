'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { APP_ROUTES } from '@/constants/routes';
import { StallProfile } from '@/types/seller';
import { createStall } from '@/lib/mockStall';
import { setActiveView } from '@/lib/mockSession';
import { useLocationCascade, LocationDraft } from '@/hooks/useLocationCascade';

export interface StallFormDraft {
  stallName: string;
  description: string;
  photoUrl: string;
  farmType: string;
  region: string;
  province: string;
  cityMunicipality: string;
  barangay: string;
  streetBuilding: string;
  postalCode: string;
  deliveryFee: string;
  pickupAvailable: boolean;
  idType: string;
  idNumber: string;
}

export function makeEmptyStallDraft(): StallFormDraft {
  return {
    stallName: '',
    description: '',
    photoUrl: '',
    farmType: '',
    region: '',
    province: '',
    cityMunicipality: '',
    barangay: '',
    streetBuilding: '',
    postalCode: '',
    deliveryFee: '49',
    pickupAvailable: true,
    idType: '',
    idNumber: '',
  };
}

function toLocationDraft(draft: StallFormDraft): LocationDraft {
  return {
    region: draft.region,
    province: draft.province,
    cityMunicipality: draft.cityMunicipality,
    barangay: draft.barangay,
  };
}

export function validateStall(draft: StallFormDraft): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!draft.stallName.trim()) errs.stallName = 'Stall name is required';
  if (!draft.description.trim()) errs.description = 'Add a short description of your farm';
  if (!draft.farmType) errs.farmType = 'Select a farm type';
  const fee = parseFloat(draft.deliveryFee);
  if (draft.deliveryFee.trim() === '' || Number.isNaN(fee) || fee < 0) {
    errs.deliveryFee = 'Enter a valid delivery fee';
  }
  if (!draft.region) errs.region = 'Select a region';
  if (!draft.province) errs.province = 'Select a province';
  if (!draft.cityMunicipality) errs.cityMunicipality = 'Select a city or municipality';
  if (!draft.barangay) errs.barangay = 'Select a barangay';
  if (!draft.streetBuilding.trim()) errs.streetBuilding = 'Street address is required';
  if (!draft.postalCode.trim()) {
    errs.postalCode = 'Postal code is required';
  } else if (!/^\d{4}$/.test(draft.postalCode.trim())) {
    errs.postalCode = 'Enter a 4-digit postal code';
  }
  return errs;
}

export function useSellerOnboarding() {
  const router = useRouter();
  const { message } = App.useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<StallFormDraft>(makeEmptyStallDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  const location = useLocationCascade(toLocationDraft(draft), (patch) =>
    setDraft((prev) => ({ ...prev, ...patch }))
  );

  const updateField = <K extends keyof StallFormDraft>(
    field: K,
    value: StallFormDraft[K]
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const submit = async () => {
    const errs = validateStall(draft);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const stall: StallProfile = {
        stallName: draft.stallName.trim(),
        description: draft.description.trim(),
        photoUrl: draft.photoUrl || '/AgriMarketLogo.png',
        farmType: draft.farmType,
        location: {
          region: draft.region,
          province: draft.province,
          cityMunicipality: draft.cityMunicipality,
          barangay: draft.barangay,
          streetBuilding: draft.streetBuilding.trim(),
          postalCode: draft.postalCode.trim(),
        },
        deliveryFeePeso: parseFloat(draft.deliveryFee),
        pickupAvailable: draft.pickupAvailable,
        verification: {
          status: 'pending',
          idType: draft.idType.trim() || 'Barangay Clearance',
          idNumber: draft.idNumber.trim(),
        },
        rating: 0,
        ratingCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      createStall(stall);
      setActiveView('seller');
      message.success('Stall created — welcome to the seller side');
      router.push(APP_ROUTES.sellerDashboard);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    error: null,
    isSaving,
    draft,
    errors,
    updateField,
    submit,
    location,
  };
}