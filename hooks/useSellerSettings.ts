'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { AuthenticatedUser } from '@/types/auth';
import { ProfileEditData } from '@/types/profile';
import {
  DEMO_BUYER,
  getSessionUserSnapshot,
  subscribeSessionUser,
  updateSessionUser,
  clearMockUser,
  ActiveView,
  getActiveViewSnapshot,
  getBuyerViewSnapshot,
  subscribeActiveView,
  setActiveView,
} from '@/lib/mockSession';
import { getStallSnapshot, subscribeStall } from '@/lib/mockStall';
import { getPayoutMethodSnapshot, subscribePayout } from '@/lib/mockEarnings';
import { APP_ROUTES } from '@/constants/routes';

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

  const user = useSyncExternalStore(
    subscribeSessionUser,
    getSessionUserSnapshot,
    () => DEMO_BUYER
  );
  const activeView = useSyncExternalStore(
    subscribeActiveView,
    getActiveViewSnapshot,
    getBuyerViewSnapshot
  );
  const stall = useSyncExternalStore(subscribeStall, getStallSnapshot, () => getStallSnapshot());
  const payout = useSyncExternalStore(
    subscribePayout,
    getPayoutMethodSnapshot,
    () => getPayoutMethodSnapshot()
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [draft, setDraft] = useState<ProfileEditData>(() => toProfileDraft(DEMO_BUYER));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  const openEdit = () => {
    setDraft(toProfileDraft(user));
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

  const saveProfile = () => {
    const errs = validateProfile(draft);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    updateSessionUser({
      ...user,
      fullName: draft.fullName.trim(),
      mobileNumber: draft.mobileNumber.trim(),
      email: draft.email.trim() || undefined,
    });
    setIsEditOpen(false);
    message.success('Account details updated');
  };

  const switchView = (view: ActiveView) => {
    setActiveView(view);
    message.success(view === 'seller' ? 'Switched to seller view' : 'Switched to buyer view');
  };

  const signOut = () => {
    clearMockUser();
    setActiveView('buyer');
    message.success('Signed out');
    router.push(APP_ROUTES.landing);
  };

  return {
    isLoading,
    error: null,
    user,
    activeView,
    switchView,
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