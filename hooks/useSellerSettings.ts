'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AuthenticatedUser } from '@/types/auth';
import { ProfileEditData } from '@/types/profile';
import { toSessionUser, toStallProfile } from '@/lib/convexSync';
import { useConvexUserSync } from '@/hooks/useConvexUserSync';
import { clearMockUser, setActiveView, updateSessionUser } from '@/lib/mockSession';
import { getPayoutMethodSnapshot, subscribePayout } from '@/lib/mockEarnings';
import { APP_ROUTES } from '@/constants/routes';

const EMPTY_USER: AuthenticatedUser = {
  id: '',
  role: 'buyer',
  fullName: '',
  mobileNumber: '',
  email: '',
  defaultAddressSummary: '',
  createdAt: new Date().toISOString(),
};

function toProfileDraft(user: AuthenticatedUser): ProfileEditData {
  return {
    fullName: user.fullName,
    mobileNumber: user.mobileNumber,
    email: user.email ?? '',
  };
}

function validateProfile(draft: ProfileEditData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!draft.fullName.trim()) errs.fullName = 'Full name is required';

  const cleanPhone = draft.mobileNumber.replace(/\s|-/g, '');
  if (!cleanPhone) {
    errs.mobileNumber = 'Mobile number is required';
  } else if (!/^(\+?63|0)?9\d{9}$/.test(cleanPhone)) {
    errs.mobileNumber = 'Enter a valid 11-digit mobile number';
  }

  if (!draft.email.trim()) {
    errs.email = 'Email address is required';
  } else if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) {
    errs.email = 'Enter a valid email address';
  }
  return errs;
}

export function useSellerSettings() {
  const router = useRouter();
  const { message } = App.useApp();
  const { current, isReady, isAuthedWithConvex } = useConvexUserSync();
  const updateProfileConvex = useMutation(api.users.updateProfile);

  const user =
    isAuthedWithConvex && current ? toSessionUser(current.user, current.addresses, current.email) : null;
  const stall = current?.stall ? toStallProfile(current.stall) : null;
  const payout = useSyncExternalStore(
    subscribePayout,
    getPayoutMethodSnapshot,
    () => getPayoutMethodSnapshot()
  );

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [draft, setDraft] = useState<ProfileEditData>(() => toProfileDraft(EMPTY_USER));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openEdit = () => {
    setDraft(toProfileDraft(user ?? EMPTY_USER));
    setErrors({});
    setIsEditOpen(true);
  };

  const closeEdit = () => setIsEditOpen(false);

  const updateField = <K extends keyof ProfileEditData>(
    field: K,
    value: ProfileEditData[K]
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

  const saveProfile = async () => {
    if (!user) return;
    const errs = validateProfile(draft);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await updateProfileConvex({
        fullName: draft.fullName.trim(),
        mobileNumber: draft.mobileNumber.trim(),
      });
      updateSessionUser({
        ...user,
        fullName: draft.fullName.trim(),
        mobileNumber: draft.mobileNumber.trim(),
        email: draft.email.trim() || undefined,
      });
      setIsEditOpen(false);
      message.success('Account details updated');
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : 'Could not save your profile. Please try again.'
      );
    }
  };

  const signOut = () => {
    clearMockUser();
    setActiveView('buyer');
    message.success('Signed out');
    router.push(APP_ROUTES.landing);
  };

  return {
    isLoading: !isReady,
    error: null,
    user,
    stall,
    payout,
    isEditOpen,
    draft,
    errors,
    openEdit,
    closeEdit,
    updateField,
    saveProfile,
    signOut,
  };
}