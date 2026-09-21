'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, DatePicker, Input, InputNumber, Result, Select, Skeleton, Switch, Upload } from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined } from '@ant-design/icons';
import {
  useSellerProductForm,
  MAX_PRODUCT_PHOTOS,
} from '@/hooks/useSellerProductForm';
import { CATEGORY_OPTIONS } from '@/constants/categories';
import { PRODUCT_UNITS } from '@/constants/productUnits';
import { APP_ROUTES } from '@/constants/routes';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-error mt-1">{message}</p>;
}

export function ProductFormView({ listingId }: { listingId?: string }) {
  const router = useRouter();
  const {
    isLoading,
    error,
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
  } = useSellerProductForm(listingId);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-4">
        <Skeleton active paragraph={{ rows: 1 }} title={{ width: '40%' }} />
        <Skeleton.Button active block className="!h-64 !rounded-2xl" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <Result
          status="404"
          title="Listing not found"
          subTitle="This product may have been deleted."
          extra={
            <Button
              type="primary"
              onClick={() => router.push(APP_ROUTES.sellerProducts)}
              className="!rounded-xl"
            >
              Back to products
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Listings</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
          {editing ? 'Edit product' : 'Add a product'}
        </h1>
      </div>

      {error && <Alert type="error" title={error} showIcon />}

      <div className="rounded-2xl bg-white shadow-sm p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1.5">
              Product name <span className="text-error">*</span>
            </label>
            <Input
              id="name"
              size="large"
              placeholder="e.g. Highland Strawberries"
              value={draft.name}
              onChange={(e) => updateField('name', e.target.value)}
              status={errors.name ? 'error' : ''}
              className="!rounded-lg"
            />
            <FieldError message={errors.name} />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Category <span className="text-error">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              options={CATEGORY_OPTIONS.map((o) => ({ label: o.label, value: o.key }))}
              value={draft.category}
              onChange={(value) => updateField('category', value)}
              status={errors.category ? 'error' : ''}
            />
            <FieldError message={errors.category} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Photos <span className="text-error">*</span>
            </label>
            <Upload
              listType="picture-card"
              accept="image/*"
              multiple
              maxCount={MAX_PRODUCT_PHOTOS}
              fileList={fileList}
              beforeUpload={(file) => handleAddUploadedFile(file)}
              onRemove={(file) => {
                removeUploadedImage(file.url ?? '');
                return true;
              }}
            >
              {fileList.length < MAX_PRODUCT_PHOTOS && (
                <div className="flex flex-col items-center gap-1 text-xs text-stone-400">
                  <PlusOutlined className="text-base" />
                  Add photo
                </div>
              )}
            </Upload>
            <FieldError message={errors.imageUrls} />
            <p className="text-xs text-stone-400 mt-2">
              Up to {MAX_PRODUCT_PHOTOS} photos — the first one is the cover buyers see. JPG/PNG up
              to 5 MB. Photos upload securely to the cloud as you pick them.
            </p>
            {isUploading && (
              <p className="text-xs font-medium text-[#2D6A4F] mt-1.5">Uploading photos…</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Price (₱) <span className="text-error">*</span>
            </label>
            <InputNumber
              size="large"
              min={1}
              className="w-full !rounded-lg"
              value={parseFloat(draft.price) || undefined}
              onChange={(value) => updateField('price', String(value ?? ''))}
              status={errors.price ? 'error' : ''}
            />
            <FieldError message={errors.price} />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Unit <span className="text-error">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              options={PRODUCT_UNITS.map((u) => ({ label: u.label, value: u.key }))}
              value={draft.unit}
              onChange={(value) => updateField('unit', value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Stock quantity <span className="text-error">*</span>
            </label>
            <InputNumber
              size="large"
              min={0}
              className="w-full !rounded-lg"
              value={draft.stockQty === '' ? undefined : parseInt(draft.stockQty, 10)}
              onChange={(value) => updateField('stockQty', String(value ?? ''))}
              status={errors.stockQty ? 'error' : ''}
            />
            <FieldError message={errors.stockQty} />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Harvest date <span className="text-error">*</span>
            </label>
            <DatePicker
              size="large"
              className="w-full !rounded-lg"
              value={draft.harvestDate ? dayjs(draft.harvestDate) : null}
              onChange={(_, dateString) =>
                updateField('harvestDate', typeof dateString === 'string' ? dateString : '')
              }
              status={errors.harvestDate ? 'error' : ''}
            />
            <FieldError message={errors.harvestDate} />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Expiry date
            </label>
            <DatePicker
              size="large"
              className="w-full !rounded-lg"
              value={draft.expiryDate ? dayjs(draft.expiryDate) : null}
              onChange={(_, dateString) =>
                updateField('expiryDate', typeof dateString === 'string' ? dateString : '')
              }
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-1.5">
              Description
            </label>
            <Input.TextArea
              id="description"
              rows={3}
              maxLength={320}
              showCount
              placeholder="Origin, taste, harvest info…"
              value={draft.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="!rounded-xl"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between rounded-xl bg-stone-50/80 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-stone-800">Listing is active</p>
              <p className="text-xs text-stone-400">
                Inactive listings are hidden from buyers.
              </p>
            </div>
            <Switch
              checked={draft.isActive}
              onChange={(checked) => updateField('isActive', checked)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
        <Button size="large" onClick={() => router.push(APP_ROUTES.sellerProducts)} className="!rounded-xl">
          Cancel
        </Button>
        <Button size="large" type="primary" loading={isSaving} onClick={save} className="!rounded-xl">
          {editing ? 'Save changes' : 'Add product'}
        </Button>
      </div>
    </div>
  );
}