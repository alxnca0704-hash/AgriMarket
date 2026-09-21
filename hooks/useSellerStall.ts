'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { APP_ROUTES } from '@/constants/routes';
import { StallProfile } from '@/types/seller';
import { toStallProfile } from '@/lib/convexSync';
import { saveStall } from '@/lib/mockStall';
import { useConvexUserSync } from '@/hooks/useConvexUserSync';
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
  };
}

function toLocationDraft(draft: Partial<StallFormDraft>): LocationDraft {
  return {
    region: draft.region ?? '',
    province: draft.province ?? '',
    cityMunicipality: draft.cityMunicipality ?? '',
    barangay: draft.barangay ?? '',
  };
}

export function useSellerStall() {
  const router = useRouter();
  const { message } = App.useApp();
  const { current, isReady, isAuthedWithConvex } = useConvexUserSync();
  const updateStallConvex = useMutation(api.stalls.updateStall);

  const convexStall = current?.stall ?? null;
  const stall = convexStall ? toStallProfile(convexStall) : null;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<StallFormDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const location = useLocationCascade(
    toLocationDraft(
      draft ?? {
        region: '',
        province: '',
        cityMunicipality: '',
        barangay: '',
      }
    ),
    (patch) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isEditing && draft && stall?.location.region) {
      void location.loadInitial(toLocationDraft(draft));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const startEdit = () => {
    if (!stall) return;
    setDraft(toStallFormDraft(stall));
    setErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    setDraft(null);
  };

  const updateField = <K extends keyof StallFormDraft>(
    field: K,
    value: StallFormDraft[K]
  ) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const save = async () => {
    if (!draft || !stall) {
      router.push(APP_ROUTES.sellerOnboarding);
      return;
    }

    const errs = validateStall(draft);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      if (!isAuthedWithConvex || !convexStall) {
        throw new Error('Could not update your stall. Please sign in and try again.');
      }

      const updated = await updateStallConvex({
        stallId: convexStall._id,
        stall: {
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
          idType: stall.verification.idType,
          idNumber: stall.verification.idNumber,
        },
      });

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
        updatedAt: new Date().toISOString(),
      };

      if (updated) {
        saveStall(toStallProfile(updated));
      } else {
        saveStall(next);
      }

      setIsEditing(false);
      setDraft(null);
      message.success('Stall profile updated');
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Could not save your stall. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading: isLoading || !isReady,
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