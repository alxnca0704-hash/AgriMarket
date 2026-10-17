'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Alert, Button, Input, Skeleton, App, Tag } from 'antd';
import { CheckCircleOutlined, CloudUploadOutlined, MobileOutlined } from '@ant-design/icons';
import { useAdminGcash } from '@/hooks/useAdminGcash';
import { GCASH_QR_IMAGE } from '@/constants/admin';

export function GcashSettingsForm() {
  const { message } = App.useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const gcash = useAdminGcash();

  const handleSave = async () => {
    if (await gcash.save()) message.success('GCash account details saved.');
  };

  if (gcash.isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        <Skeleton active paragraph={{ rows: 2 }} />
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-400">Platform payments</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-5xl">GCash account</h1>
          <p className="max-w-xl text-sm leading-6 text-stone-500 sm:text-base">Set the number and QR image buyers use when paying the marketplace.</p>
        </div>
        {gcash.hasChanges ? (
          <Tag color="warning" className="mr-0 w-fit rounded-md px-2.5 py-1 text-xs">Unsaved changes</Tag>
        ) : gcash.settings ? (
          <Tag icon={<CheckCircleOutlined />} color="success" className="mr-0 w-fit rounded-md px-2.5 py-1 text-xs">
            Account details saved
          </Tag>
        ) : (
          <Tag color="warning" className="mr-0 w-fit rounded-md px-2.5 py-1 text-xs">Setup needed</Tag>
        )}
      </header>

      {gcash.error && <Alert type="error" showIcon message={gcash.error} className="max-w-3xl" />}

      <section className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="space-y-6 rounded-2xl bg-white p-5 sm:p-7 lg:col-span-5 lg:p-8">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400">Account details</p>
            <h2 className="text-lg font-semibold text-stone-900">Where payments go</h2>
            <p className="text-sm leading-6 text-stone-500">Use the marketplace GCash number that should receive buyer payments.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="gcash-number" className="text-sm font-medium text-stone-800">Mobile number</label>
            <Input
              id="gcash-number"
              size="large"
              prefix={<MobileOutlined className="text-stone-400" />}
              autoComplete="tel"
              inputMode="tel"
              placeholder="09XXXXXXXXX or +639XXXXXXXXX"
              value={gcash.number}
              onChange={(event) => gcash.setNumber(event.target.value)}
            />
            <p className="text-xs leading-5 text-stone-500">Philippine mobile number, with or without the country code.</p>
          </div>

          <div className="rounded-xl bg-stone-50 p-4">
            <p className="text-xs font-medium text-stone-700">Before saving</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">Check that the number matches the account shown in the QR image.</p>
          </div>

          <div className="space-y-3 border-t border-stone-100 pt-5">
            <Button type="primary" size="large" block loading={gcash.isSaving} disabled={!gcash.canSave} onClick={() => void handleSave()}>
              {gcash.hasChanges ? 'Save changes' : 'Saved'}
            </Button>
            {gcash.settings && (
              <p className="text-center text-xs text-stone-400">Last saved {new Date(gcash.settings.updatedAt).toLocaleString()}</p>
            )}
          </div>
        </div>

        <div className="space-y-5 rounded-2xl bg-white p-5 sm:p-7 lg:col-span-7 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400">Payment QR</p>
              <h2 className="text-lg font-semibold text-stone-900">Scan to pay</h2>
              <p className="text-sm leading-6 text-stone-500">Portrait image · 720 × 1256 px · up to 5 MB</p>
            </div>
            <Button icon={<CloudUploadOutlined />} loading={gcash.isUploading} onClick={() => inputRef.current?.click()}>
              {gcash.qrUrl ? 'Replace image' : 'Upload image'}
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void gcash.uploadQr(event.currentTarget.files?.[0] ?? null);
              event.currentTarget.value = '';
            }}
          />

          {gcash.qrUrl ? (
            <div className="flex min-h-80 justify-center rounded-xl bg-stone-50 p-4 sm:p-6">
              <div className="w-full max-w-64 rounded-lg bg-white p-2 shadow-sm">
                <Image src={gcash.qrUrl} alt="GCash payment QR code" width={GCASH_QR_IMAGE.width} height={GCASH_QR_IMAGE.height} unoptimized className="h-auto w-full" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="group flex min-h-72 w-full flex-col items-center justify-center gap-4 rounded-xl bg-stone-50 px-5 py-10 text-center transition-colors hover:bg-sage-soft/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-sage shadow-sm transition-transform group-hover:-translate-y-0.5">
                <CloudUploadOutlined className="text-xl" />
              </span>
              <span className="space-y-1">
                <span className="block text-sm font-medium text-stone-800">Add the marketplace QR image</span>
                <span className="block text-xs leading-5 text-stone-500">We’ll resize it to 720 × 1256 px and preserve the full image.</span>
              </span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
