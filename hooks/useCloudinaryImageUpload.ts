'use client';

import { useState } from 'react';

export function useCloudinaryImageUpload(uploadRoute: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string> => {
    setIsUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(uploadRoute, {
        method: 'POST',
        body,
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? 'Image upload failed. Please try again.');
      }
      return data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image upload failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, error, upload };
}