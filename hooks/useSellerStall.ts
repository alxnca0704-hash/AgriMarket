'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { App } from 'antd';
import { StallProfile } from '@/types/seller';
import { getStallSnapshot, subscribeStall, saveStall } from '@/lib/mockStall';
import {
  StallFormDraft,
  validateStall,
} from '@/hooks/useSellerOnboarding';
import { useLocationCascade, LocationDraft } from '@/hooks/useLocationCascade';

export function toStallFormDraft(stall: StallProfile): StallFormDraft {
  return {
    stallName: stall.stallName,
    description: stall.description,
    photoUrl: stall.photoUrl,
    farmType: stall.farmType,
    region: stall.location.region,
    province: stall.location.province,
    cityMunicipality: stall.location.cityMunicipality,
    barangay: stall.location.barangay,
    streetBuilding: stall.location.streetBuilding,
    postalCode: stall.location.postalCode,
    deliveryFee: String(stall.deliveryFeePeso),
    pickupAvailable: stall.pickupAvailable,
    idType: stall.verification.idType,
    idNumber: stall.verification.idNumber,
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

export function useSellerStall() {
  const { message } = App.useApp();
  const stall = useSyncExternalStore(subscribeStall, getStallSnapshot, () => getStallSnapshot());

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<StallFormDraft>(() =>
    toStallFormDraft(getStallSnapshot())
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const location = useLocationCascade(toLocationDraft(draft), (patch) =>
    setDraft((prev) => ({ ...prev, ...patch }))
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isEditing && stall.location.region) {
      void location.loadInitial(toLocationDraft(draft));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const startEdit = () => {
    setDraft(toStallFormDraft(stall));
    setErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setErrors({});
  };

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

  const save = async () => {
    const errs = validateStall(draft);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      const next: StallProfile = {
        ...stall,
        stallName: draft.stallName.trim(),
        description: draft.description.trim(),
        photoUrl: draft.photoUrl || stall.photoUrl,
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
          ...stall.verification,
          idType: draft.idType.trim() || stall.verification.idType,
          idNumber: draft.idNumber.trim(),
        },
      };
      saveStall(next);
      setIsEditing(false);
      message.success('Stall profile updated');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    error: null,
    stall,
    isEditing,
    isSaving,
    draft,
    errors,
    location,
    startEdit,
    cancelEdit,
    updateField,
    save,
  };
}