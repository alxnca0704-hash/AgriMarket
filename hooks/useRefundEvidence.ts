'use client';

import { useState } from 'react';
import { API_ROUTES } from '@/constants/routes';

export function useRefundEvidence() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (): Promise<string[]> => {
    setIsUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const body = new FormData();
        body.append('file', file);
        const response = await fetch(API_ROUTES.refundEvidenceUpload, { method: 'POST', body });
        const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
        if (!response.ok || !data?.url) throw new Error(data?.error ?? 'Evidence upload failed.');
        return data.url;
      }));
      return urls;
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Evidence upload failed.';
      setError(message);
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  };

  return { files, setFiles, isUploading, error, upload };
}
