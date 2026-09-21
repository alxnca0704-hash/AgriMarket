'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { APP_ROUTES, API_ROUTES, ASSET_ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { StallProfile } from '@/types/seller';
import { createStall } from '@/lib/mockStall';
import { getSessionUserSnapshot, setActiveView, updateSessionUser } from '@/lib/mockSession';
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
  };
}

export function toLocationDraft(draft: StallFormDraft): LocationDraft {
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

export interface StallDraftPayload {
  profile: StallProfile;
  mutationInput: {
    stallName: string;
    description: string;
    photoUrl: string;
    farmType: string;
    location: StallProfile['location'];
    deliveryFeePeso: number;
    pickupAvailable: boolean;
    idType: string;
    idNumber: string;
  };
}

export function buildStallPayload(draft: StallFormDraft): StallDraftPayload {
  const now = new Date().toISOString();
  const profile: StallProfile = {
    stallName: draft.stallName.trim(),
    description: draft.description.trim(),
    photoUrl: draft.photoUrl || ASSET_ROUTES.logo,
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
      idType: 'Barangay Clearance',
      idNumber: '',
    },
    rating: 0,
    ratingCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  return {
    profile,
    mutationInput: {
      stallName: profile.stallName,
      description: profile.description,
      photoUrl: profile.photoUrl,
      farmType: profile.farmType,
      location: profile.location,
      deliveryFeePeso: profile.deliveryFeePeso,
      pickupAvailable: profile.pickupAvailable,
      idType: profile.verification.idType,
      idNumber: profile.verification.idNumber,
    },
  };
}

export function useSellerOnboarding() {
  const router = useRouter();
  const { message } = App.useApp();
  const createStallConvex = useMutation(api.stalls.createStall);

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
      const { profile: stall, mutationInput } = buildStallPayload(draft);

      await createStallConvex({
        stall: mutationInput,
      });

      createStall(stall);
      setActiveView('seller');

      const sessionUser = getSessionUserSnapshot();
      updateSessionUser({ ...sessionUser, role: ROLES.SELLER });
      void fetch(API_ROUTES.clerkRole, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: ROLES.SELLER }),
      }).catch(() => undefined);

      message.success('Stall created — welcome to the seller side');
      router.push(APP_ROUTES.sellerDashboard);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Could not create your stall. Please try again.'
      );
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