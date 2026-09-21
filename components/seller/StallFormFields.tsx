'use client';

import React from 'react';
import { Input, InputNumber, Select, Switch } from 'antd';
import { FARM_TYPE_OPTIONS } from '@/constants/stall';
import { StallFormDraft } from '@/hooks/useSellerOnboarding';
import { useLocationCascade } from '@/hooks/useLocationCascade';
import { ASSET_ROUTES } from '@/constants/routes';

const STALL_PHOTO_OPTIONS = [
  { label: 'Farm logo', value: ASSET_ROUTES.logo },
  { label: 'Fruit basket (stock)', value: '/products/fruits.svg' },
  { label: 'Vegetables (stock)', value: '/products/vegetables.svg' },
  { label: 'Grains (stock)', value: '/products/grains.svg' },
];

type LocationEditor = ReturnType<typeof useLocationCascade>;

interface StallFormFieldsProps {
  draft: StallFormDraft;
  errors: Record<string, string>;
  updateField: <K extends keyof StallFormDraft>(
    field: K,
    value: StallFormDraft[K]
  ) => void;
  location: LocationEditor;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-error mt-1">{message}</p>;
}

export function StallFormFields({
  draft,
  errors,
  updateField,
  location,
}: StallFormFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="stallName" className="block text-sm font-medium text-stone-700 mb-1.5">
            Stall name <span className="text-error">*</span>
          </label>
          <Input
            id="stallName"
            size="large"
            placeholder="e.g. Green Valley Farm"
            value={draft.stallName}
            onChange={(e) => updateField('stallName', e.target.value)}
            status={errors.stallName ? 'error' : ''}
            className="!rounded-lg"
          />
          <FieldError message={errors.stallName} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-1.5">
            Description <span className="text-error">*</span>
          </label>
          <Input.TextArea
            id="description"
            rows={3}
            maxLength={320}
            showCount
            placeholder="Tell buyers about your farm, practices, and produce."
            value={draft.description}
            onChange={(e) => updateField('description', e.target.value)}
            status={errors.description ? 'error' : ''}
            className="!rounded-xl"
          />
          <FieldError message={errors.description} />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Farm type <span className="text-error">*</span>
          </label>
          <Select
            size="large"
            className="w-full"
            placeholder="Select farm type"
            options={FARM_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.key }))}
            value={draft.farmType || undefined}
            onChange={(value) => updateField('farmType', value)}
            status={errors.farmType ? 'error' : ''}
          />
          <FieldError message={errors.farmType} />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Stall photo
          </label>
          <Select
            size="large"
            className="w-full"
            options={STALL_PHOTO_OPTIONS}
            value={draft.photoUrl || undefined}
            onChange={(value) => updateField('photoUrl', value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Delivery fee (₱)
          </label>
          <InputNumber
            size="large"
            min={0}
            className="w-full !rounded-lg"
            value={parseFloat(draft.deliveryFee) || 0}
            onChange={(value) => updateField('deliveryFee', String(value ?? 0))}
            status={errors.deliveryFee ? 'error' : ''}
          />
          <FieldError message={errors.deliveryFee} />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-stone-50/80 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-stone-800">Allow pickup</p>
            <p className="text-xs text-stone-400">Buyers can collect at your farm/hub</p>
          </div>
          <Switch
            checked={draft.pickupAvailable}
            onChange={(checked) => updateField('pickupAvailable', checked)}
          />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-sm font-semibold text-stone-800 mb-1">Farm location</p>
        <p className="text-xs text-stone-400 mb-4">
          Where your stall picks up or dispatches from.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Region <span className="text-error">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              showSearch
              placeholder="Select region"
              options={location.regionOptions}
              value={draft.region || undefined}
              onChange={(value) => void location.handleSelectRegion(value)}
              status={errors.region ? 'error' : ''}
            />
            <FieldError message={errors.region} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Province <span className="text-error">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              showSearch
              placeholder="Select province"
              options={location.provinceOptions}
              value={draft.province || undefined}
              onChange={(value) => void location.handleSelectProvince(value)}
              loading={location.isProvincesLoading}
              disabled={!draft.region}
              status={errors.province ? 'error' : ''}
            />
            <FieldError message={errors.province} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              City / Municipality <span className="text-error">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              showSearch
              placeholder="Select city"
              options={location.cityOptions}
              value={draft.cityMunicipality || undefined}
              onChange={(value) => void location.handleSelectCity(value)}
              loading={location.isCitiesLoading}
              disabled={!draft.province}
              status={errors.cityMunicipality ? 'error' : ''}
            />
            <FieldError message={errors.cityMunicipality} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Barangay <span className="text-error">*</span>
            </label>
            <Select
              size="large"
              className="w-full"
              showSearch
              placeholder="Select barangay"
              options={location.barangayOptions}
              value={draft.barangay || undefined}
              onChange={(value) => updateField('barangay', value)}
              loading={location.isBarangaysLoading}
              disabled={!draft.cityMunicipality}
              status={errors.barangay ? 'error' : ''}
            />
            <FieldError message={errors.barangay} />
          </div>
          <div>
            <label htmlFor="streetBuilding" className="block text-sm font-medium text-stone-700 mb-1.5">
              Street / building <span className="text-error">*</span>
            </label>
            <Input
              id="streetBuilding"
              size="large"
              placeholder="e.g. Km 6 Valley Road"
              value={draft.streetBuilding}
              onChange={(e) => updateField('streetBuilding', e.target.value)}
              status={errors.streetBuilding ? 'error' : ''}
              className="!rounded-lg"
            />
            <FieldError message={errors.streetBuilding} />
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-stone-700 mb-1.5">
              Postal code <span className="text-error">*</span>
            </label>
            <Input
              id="postalCode"
              size="large"
              maxLength={4}
              placeholder="e.g. 2601"
              value={draft.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
              status={errors.postalCode ? 'error' : ''}
              className="!rounded-lg"
            />
            <FieldError message={errors.postalCode} />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-800">Verification (UI only)</p>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
            Not real verification
          </span>
        </div>
        <p className="text-xs text-stone-400 mb-4">
          Shared with buyers so they know your farm is vetted.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="idType" className="block text-sm font-medium text-stone-700 mb-1.5">
              ID type
            </label>
            <Input
              id="idType"
              size="large"
              placeholder="e.g. Barangay Clearance"
              value={draft.idType}
              onChange={(e) => updateField('idType', e.target.value)}
              className="!rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="idNumber" className="block text-sm font-medium text-stone-700 mb-1.5">
              ID number
            </label>
            <Input
              id="idNumber"
              size="large"
              placeholder="Reference number"
              value={draft.idNumber}
              onChange={(e) => updateField('idNumber', e.target.value)}
              className="!rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}