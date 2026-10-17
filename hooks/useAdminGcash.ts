'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { API_ROUTES } from '@/constants/routes';
import { useCloudinaryImageUpload } from '@/hooks/useCloudinaryImageUpload';

export function useAdminGcash() {
  const settings = useQuery(api.admin.getGcashSettings);
  const saveSettings = useMutation(api.admin.updateGcashSettings);
  const imageUpload = useCloudinaryImageUpload(API_ROUTES.gcashQrUpload);
  const [numberDraft, setNumberDraft] = useState<string | null>(null);
  const [qrUrlDraft, setQrUrlDraft] = useState<string | null>(null);
  const number = numberDraft ?? settings?.number ?? '';
  const qrUrl = qrUrlDraft ?? settings?.qrUrl ?? '';
  const hasChanges = settings
    ? number !== settings.number || qrUrl !== settings.qrUrl
    : Boolean(number || qrUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadQr = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.');
      return;
    }
    setError(null);
    try {
      setQrUrlDraft(await imageUpload.upload(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload the QR image.');
    }
  };

  const save = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await saveSettings({ qrUrl, number });
      setNumberDraft(number);
      setQrUrlDraft(qrUrl);
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save GCash settings.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    isLoading: settings === undefined,
    number,
    setNumber: setNumberDraft,
    qrUrl,
    isUploading: imageUpload.isUploading,
    isSaving,
    error: error ?? imageUpload.error,
    uploadQr,
    save,
    hasChanges,
    canSave: Boolean(qrUrl && number.trim() && hasChanges) && !imageUpload.isUploading && !isSaving,
  };
}
