'use client';

import { API_ROUTES } from '@/constants/routes';
import { useCloudinaryImageUpload } from '@/hooks/useCloudinaryImageUpload';

export function useStallImageUpload() {
  return useCloudinaryImageUpload(API_ROUTES.stallImageUpload);
}