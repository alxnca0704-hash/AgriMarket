'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Upload, UploadFile } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ProductCategory } from '@/constants/categories';
import { MAX_PRODUCT_IMAGE_BYTES, MAX_PRODUCT_PHOTOS } from '@/constants/products';
import { APP_ROUTES, API_ROUTES } from '@/constants/routes';
import { SellerListing } from '@/types/seller';
import { useCloudinaryImageUpload } from '@/hooks/useCloudinaryImageUpload';
import { toSellerListing } from '@/lib/convexSync';
import { ProductVariant } from '@/types/product';
import { PRODUCT_ACTION_KEYS } from '@/constants/products';
import { usePendingAction } from '@/hooks/usePendingAction';

export { MAX_PRODUCT_PHOTOS };

export interface ProductFormDraft {
  name: string;
  category: ProductCategory;
  variants: Array<{ id: string; name: string; description: string; price: string; stock: string }>;
  description: string;
  imageUrls: string[];
  isActive: boolean;
}

export function makeEmptyProductDraft(): ProductFormDraft {
  return {
    name: '',
    category: 'vegetables',
    variants: [{ id: crypto.randomUUID(), name: '', description: '', price: '', stock: '' }],
    description: '',
    imageUrls: [],
    isActive: true,
  };
}

export function toProductFormDraft(listing: SellerListing): ProductFormDraft {
  return {
    name: listing.name,
    category: listing.category,
    variants: (listing.variants ?? [{ id: `legacy-${listing.id}`, name: listing.unit, price: listing.price, stock: listing.stockQty, sortOrder: 0 }]).filter((variant) => !variant.archived).map((variant) => ({ id: variant.id, name: variant.name, description: variant.description ?? '', price: String(variant.price), stock: String(variant.stock) })),
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

  if (draft.variants.length < 1 || draft.variants.length > 20) errs.variants = 'Add between 1 and 20 types';
  const names = new Set<string>();
  draft.variants.forEach((variant, index) => {
    const name = variant.name.trim();
    if (!name) errs[`variant-${index}-name`] = 'Type name is required';
    else if (name.length > 60) errs[`variant-${index}-name`] = 'Type name must be 60 characters or fewer';
    else if (names.has(name.toLocaleLowerCase())) errs[`variant-${index}-name`] = 'Type names must be unique';
    names.add(name.toLocaleLowerCase());
    const price = Number(variant.price);
    if (!variant.price.trim() || !Number.isFinite(price) || price <= 0 || Math.round(price * 100) !== price * 100) errs[`variant-${index}-price`] = 'Enter a price greater than 0 (up to 2 decimals)';
    if (!/^\d+$/.test(variant.stock)) errs[`variant-${index}-stock`] = 'Enter a whole stock quantity of 0 or more';
    if (variant.description.length > 200) errs[`variant-${index}-description`] = 'Description must be 200 characters or fewer';
  });
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

  const saveAction = usePendingAction();
  const isSaving = saveAction.isPending(PRODUCT_ACTION_KEYS.save);
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

  const updateVariant = (index: number, field: 'name' | 'description' | 'price' | 'stock', value: string) => setDraft((prev) => ({ ...prev, variants: prev.variants.map((variant, i) => i === index ? { ...variant, [field]: value } : variant) }));
  const addVariant = () => setDraft((prev) => prev.variants.length >= 20 ? prev : ({ ...prev, variants: [...prev.variants, { id: crypto.randomUUID(), name: '', description: '', price: '', stock: '' }] }));
  const removeVariant = (index: number) => setDraft((prev) => prev.variants.length <= 1 ? prev : ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
  const moveVariant = (index: number, direction: -1 | 1) => setDraft((prev) => { const target = index + direction; if (target < 0 || target >= prev.variants.length) return prev; const variants = [...prev.variants]; [variants[index], variants[target]] = [variants[target], variants[index]]; return { ...prev, variants }; });

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

    await saveAction.run(PRODUCT_ACTION_KEYS.save, async () => {
      const imageUrls = draft.imageUrls;
      const variants: ProductVariant[] = draft.variants.map((variant, sortOrder) => ({ id: variant.id, name: variant.name.trim(), ...(variant.description.trim() ? { description: variant.description.trim() } : {}), price: Number(variant.price), stock: Number(variant.stock), sortOrder }));
      const input = {
        name: draft.name.trim(),
        category: draft.category,
        price: Math.min(...variants.map((variant) => variant.price)),
        unit: 'piece' as const,
        stockQty: variants.reduce((sum, variant) => sum + variant.stock, 0),
        variants,
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
      } else {
        await createProduct(input);
      }
      router.push(APP_ROUTES.sellerProducts);
    }, { success: 'Product saved', error: 'Could not save product' });
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
    updateVariant, addVariant, removeVariant, moveVariant,
    handleAddUploadedFile,
    removeUploadedImage,
    save,
  };
}
