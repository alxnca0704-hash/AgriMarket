'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { App } from 'antd';
import { AuthenticatedUser } from '@/types/auth';
import { ProfileEditData } from '@/types/profile';
import { ROLE_DETAILS } from '@/constants/roles';
import {
  DEMO_BUYER,
  getSessionUserSnapshot,
  subscribeSessionUser,
  updateSessionUser,
} from '@/lib/mockSession';
import { useAddressBook } from '@/hooks/useAddressBook';

function toProfileDraft(user: AuthenticatedUser): ProfileEditData {
  return {
    fullName: user.fullName,
    mobileNumber: user.mobileNumber,
    email: user.email ?? '',
  };
}

function validateProfile(draft: ProfileEditData): Record<string, string> {
  const errs: Record<string, string> = {};

  if (!draft.fullName.trim()) {
    errs.fullName = 'Full name is required';
  }

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

export function useProfile() {
  const { message } = App.useApp();
  const user = useSyncExternalStore(
    subscribeSessionUser,
    getSessionUserSnapshot,
    () => DEMO_BUYER
  );
  const addressBook = useAddressBook();

  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [draft, setDraft] = useState<ProfileEditData>(() => toProfileDraft(DEMO_BUYER));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const openEditModal = () => {
    setDraft(toProfileDraft(user));
    setErrors({});
    setIsEditOpen(true);
  };

  const closeEditModal = () => setIsEditOpen(false);

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

    const updated: AuthenticatedUser = {
      ...user,
      fullName: draft.fullName.trim(),
      mobileNumber: draft.mobileNumber.trim(),
      email: draft.email.trim() || undefined,
    };
    updateSessionUser(updated);
    setIsEditOpen(false);
    message.success('Profile updated');
  };

  const roleLabel = ROLE_DETAILS[user.role]?.label ?? 'Member';

  return {
    isLoading,
    error: null,
    user,
    roleLabel,
    addressBook,
    isEditOpen,
    draft,
    errors,
    openEditModal,
    closeEditModal,
    updateField,
    saveProfile,
  };
}