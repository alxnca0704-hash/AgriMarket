'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Upload, UploadFile } from 'antd';
import { ProductCategory } from '@/constants/categories';
import { ProductUnit } from '@/constants/productUnits';
import { SellerListing } from '@/types/seller';
import { APP_ROUTES } from '@/constants/routes';
import {
  getListingsSnapshot,
  createListing,
  updateListing,
} from '@/lib/mockListings';

export const PRODUCT_IMAGE_PLACEHOLDER = '/products/vegetables.svg';
export const MAX_PRODUCT_PHOTOS = 6;

function toUploadFile(url: string, index: number): UploadFile {
  return {
    uid: `img-${url.startsWith('data:') ? index : url}`.slice(0, 40),
    name: url.startsWith('data:') ? `Photo ${index + 1}` : (url.split('/').pop() ?? `Photo ${index + 1}`),
    url,
    status: 'done',
  };
}

function toUploadFiles(urls: string[]): UploadFile[] {
  return urls.map(toUploadFile);
}

export interface ProductFormDraft {
  name: string;
  category: ProductCategory;
  price: string;
  unit: ProductUnit;
  stockQty: string;
  harvestDate: string;
  expiryDate: string;
  description: string;
  imageUrls: string[];
  isActive: boolean;
}

export function makeEmptyProductDraft(): ProductFormDraft {
  return {
    name: '',
    category: 'vegetables',
    price: '',
    unit: 'kg',
    stockQty: '',
    harvestDate: '',
    expiryDate: '',
    description: '',
    imageUrls: [],
    isActive: true,
  };
}

function toDraft(listing: SellerListing): ProductFormDraft {
  return {
    name: listing.name,
    category: listing.category,
    price: String(listing.price),
    unit: listing.unit,
    stockQty: String(listing.stockQty),
    harvestDate: listing.harvestDate,
    expiryDate: listing.expiryDate ?? '',
    description: listing.description,
    imageUrls:
      listing.imageUrls.length > 0
        ? listing.imageUrls
        : listing.imageUrl
          ? [listing.imageUrl]
          : [],
    isActive: listing.isActive,
  };
}

function validateProduct(draft: ProductFormDraft): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!draft.name.trim()) errs.name = 'Product name is required';
  if (!draft.category) errs.category = 'Pick a category';
  if (draft.imageUrls.length === 0) errs.imageUrls = 'Add at least one photo';

  const price = parseFloat(draft.price);
  if (draft.price.trim() === '' || Number.isNaN(price) || price <= 0) {
    errs.price = 'Enter a price greater than 0';
  }

  const stock = parseInt(draft.stockQty, 10);
  if (draft.stockQty.trim() === '' || Number.isNaN(stock) || stock < 0) {
    errs.stockQty = 'Enter a valid stock quantity';
  }

  if (!draft.harvestDate) errs.harvestDate = 'Pick a harvest date';
  return errs;
}

export function useSellerProductForm(listingId?: string) {
  const router = useRouter();
  const { message } = App.useApp();

  const [isLoading, setIsLoading] = useState(Boolean(listingId));
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [draft, setDraft] = useState<ProductFormDraft>(makeEmptyProductDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (!listingId) return;
    const timer = setTimeout(() => {
      const listing = getListingsSnapshot().find((l) => l.id === listingId);
      if (listing) {
        setDraft(toDraft(listing));
        const urls =
          listing.imageUrls.length > 0
            ? listing.imageUrls
            : listing.imageUrl
              ? [listing.imageUrl]
              : [];
        setFileList(toUploadFiles(urls));
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [listingId]);

  const updateField = <K extends keyof ProductFormDraft>(
    field: K,
    value: ProductFormDraft[K]
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

  const handleUploadChange = ({ fileList: next }: { fileList: UploadFile[] }) => {
    setFileList(next);
    const urls = next
      .map((f) => f.url)
      .filter((u): u is string => Boolean(u));
    setDraft((prev) => ({ ...prev, imageUrls: urls }));
    if (urls.length > 0) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.imageUrls;
        return copy;
      });
    }
  };

  const addUploadedImage = (url: string) => {
    setFileList((prev) => [...prev, toUploadFile(url, prev.length)]);
    setDraft((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.imageUrls;
      return copy;
    });
  };

  const handleAddUploadedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('Only image files are allowed');
      return Upload.LIST_IGNORE;
    }
    if (file.size > 2 * 1024 * 1024) {
      message.error('Photo must be under 2MB');
      return Upload.LIST_IGNORE;
    }
    const reader = new FileReader();
    reader.onload = () => {
      addUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    return Upload.LIST_IGNORE;
  };

  const removeUploadedImage = (url: string) => {
    setFileList((prev) => prev.filter((f) => f.url !== url));
    setDraft((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((u) => u !== url),
    }));
  };

  const save = async () => {
    const errs = validateProduct(draft);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      const imageUrls =
        draft.imageUrls.length > 0 ? draft.imageUrls : [PRODUCT_IMAGE_PLACEHOLDER];
      const data = {
        name: draft.name.trim(),
        category: draft.category,
        price: parseFloat(draft.price),
        unit: draft.unit,
        stockQty: parseInt(draft.stockQty, 10),
        harvestDate: draft.harvestDate,
        expiryDate: draft.expiryDate || undefined,
        description: draft.description.trim(),
        imageUrl: imageUrls[0],
        imageUrls,
        isActive: draft.isActive,
      };
      if (listingId) {
        updateListing(listingId, data);
        message.success('Listing updated');
      } else {
        createListing(data);
        message.success('Listing added');
      }
      router.push(APP_ROUTES.sellerProducts);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    error: null,
    notFound,
    isSaving,
    editing: Boolean(listingId),
    draft,
    errors,
    fileList,
    updateField,
    handleUploadChange,
    handleAddUploadedFile,
    removeUploadedImage,
    save,
  };
}