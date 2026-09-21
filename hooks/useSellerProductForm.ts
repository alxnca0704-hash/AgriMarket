'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Upload, UploadFile } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ProductCategory } from '@/constants/categories';
import { ProductUnit } from '@/constants/productUnits';
import { MAX_PRODUCT_IMAGE_BYTES, MAX_PRODUCT_PHOTOS } from '@/constants/products';
import { APP_ROUTES, API_ROUTES } from '@/constants/routes';
import { SellerListing } from '@/types/seller';
import { useCloudinaryImageUpload } from '@/hooks/useCloudinaryImageUpload';
import { toSellerListing } from '@/lib/convexSync';

export { MAX_PRODUCT_PHOTOS };

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

export function toProductFormDraft(listing: SellerListing): ProductFormDraft {
  return {
    name: listing.name,
    category: listing.category,
    price: String(listing.price),
    unit: listing.unit,
    stockQty: String(listing.stockQty),
    harvestDate: listing.harvestDate,
    expiryDate: listing.expiryDate ?? '',
    description: listing.description,
    imageUrls: listing.imageUrls.length > 0 ? listing.imageUrls : [listing.imageUrl],
    isActive: listing.isActive,
  };
}

function toUploadFile(url: string, index: number): UploadFile {
  return {
    uid: `img-${url.startsWith('data:') ? index : url}`.slice(0, 40),
    name: url.split('/').pop() ?? `Photo ${index + 1}`,
    url,
    status: 'done',
  };
}

function toUploadFiles(urls: string[]): UploadFile[] {
  return urls.map(toUploadFile);
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

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export function useSellerProductForm(listingId?: string) {
  const router = useRouter();
  const { message } = App.useApp();

  const mustLoad = Boolean(listingId);
  const product = useQuery(
    api.products.getMyProduct,
    mustLoad ? { productId: listingId as Id<'products'> } : 'skip'
  );
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const {
    isUploading,
    error: uploadError,
    upload,
  } = useCloudinaryImageUpload(API_ROUTES.productImageUpload);

  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<ProductFormDraft>(makeEmptyProductDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const editing = mustLoad;
  const isLoading = mustLoad && product === undefined;
  const notFound = mustLoad && product === null;
  const error = product instanceof Error ? product.message : null;

  const existing: SellerListing | null =
    product && !(product instanceof Error) ? toSellerListing(product) : null;
  const existingId = existing?.id ?? null;

  useEffect(() => {
    if (!existing) return;
    const loaded = existing;
    const task = setTimeout(() => {
      setDraft(toProductFormDraft(loaded));
      setFileList(toUploadFiles(loaded.imageUrls));
    }, 0);
    return () => clearTimeout(task);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingId]);

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

  const removeUploadedImage = (url: string) => {
    setFileList((prev) => prev.filter((f) => f.url !== url));
    setDraft((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((u) => u !== url),
    }));
  };

  const handleAddUploadedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('Only image files are allowed');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      message.error('Photo must be 5 MB or smaller');
      return Upload.LIST_IGNORE;
    }
    if (fileList.length >= MAX_PRODUCT_PHOTOS) {
      message.error(`You can add up to ${MAX_PRODUCT_PHOTOS} photos`);
      return Upload.LIST_IGNORE;
    }

    const uid = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const tempFile: UploadFile = { uid, name: file.name, status: 'uploading' };
    setFileList((prev) => [...prev, tempFile]);

    void (async () => {
      try {
        const url = await upload(file);
        setFileList((prev) =>
          prev.map((f) => (f.uid === uid ? { ...f, status: 'done', url } : f))
        );
        setDraft((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.imageUrls;
          return next;
        });
      } catch (err) {
        setFileList((prev) => prev.filter((f) => f.uid !== uid));
        message.error(errorMessage(err));
      }
    })();

    return Upload.LIST_IGNORE;
  };

  const save = async () => {
    const errs = validateProduct(draft);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      const imageUrls = draft.imageUrls;
      const input = {
        name: draft.name.trim(),
        category: draft.category,
        price: parseFloat(draft.price),
        unit: draft.unit,
        stockQty: parseInt(draft.stockQty, 10),
        harvestDate: draft.harvestDate,
        ...(draft.expiryDate ? { expiryDate: draft.expiryDate } : {}),
        description: draft.description.trim(),
        imageUrl: imageUrls[0],
        imageUrls,
        isActive: draft.isActive,
      };
      if (existing) {
        await updateProduct({
          productId: existing.id as Id<'products'>,
          patch: input,
        });
        message.success('Product updated');
      } else {
        await createProduct(input);
        message.success('Product added to your stall');
      }
      router.push(APP_ROUTES.sellerProducts);
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    error: error ?? uploadError,
    notFound,
    isSaving,
    isUploading,
    editing,
    draft,
    errors,
    fileList,
    updateField,
    handleAddUploadedFile,
    removeUploadedImage,
    save,
  };
}