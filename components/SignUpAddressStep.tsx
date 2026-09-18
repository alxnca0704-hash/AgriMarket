'use client';

import React from 'react';
import { Input, Select, Switch } from 'antd';
import { ADDRESS_LABELS, AddressLabel } from '@/constants/phLocations';
import { AddressStepData } from '@/types/auth';

interface SignUpAddressStepProps {
  address: AddressStepData;
  errors: Record<string, string>;
  regionOptions: { label: string; value: string }[];
  provinceOptions: { label: string; value: string }[];
  cityOptions: { label: string; value: string }[];
  barangayOptions: { label: string; value: string }[];
  isProvincesLoading?: boolean;
  isCitiesLoading?: boolean;
  isBarangaysLoading?: boolean;
  onUpdate: <K extends keyof AddressStepData>(field: K, value: AddressStepData[K]) => void;
}

export function SignUpAddressStep({
  address,
  errors,
  regionOptions,
  provinceOptions,
  cityOptions,
  barangayOptions,
  isProvincesLoading = false,
  isCitiesLoading = false,
  isBarangaysLoading = false,
  onUpdate,
}: SignUpAddressStepProps) {
  const searchFilter = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Address & routing</h2>
        <p className="text-sm text-stone-500 mt-1">
          Select your location to connect with your municipal aggregation hub.
        </p>
      </div>

      {/* Address Label Pills */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Address label
        </label>
        <div className="flex flex-wrap gap-2">
          {ADDRESS_LABELS.map((lbl) => {
            const isSelected = address.label === lbl;
            return (
              <button
                key={lbl}
                type="button"
                onClick={() => onUpdate('label', lbl as AddressLabel)}
                className={`px-3.5 py-1.5 text-sm rounded-full font-medium transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                }`}
              >
                {lbl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contact Person & Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="receiverName"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Contact person <span className="text-error">*</span>
          </label>
          <Input
            id="receiverName"
            size="large"
            placeholder="Full name"
            value={address.receiverName}
            onChange={(e) => onUpdate('receiverName', e.target.value)}
            status={errors.receiverName ? 'error' : ''}
            className="!rounded-lg"
          />
          {errors.receiverName && (
            <p className="text-sm text-error mt-1">{errors.receiverName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="receiverPhone"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Contact phone <span className="text-error">*</span>
          </label>
          <Input
            id="receiverPhone"
            size="large"
            placeholder="0917 123 4567"
            value={address.receiverPhone}
            onChange={(e) => onUpdate('receiverPhone', e.target.value)}
            status={errors.receiverPhone ? 'error' : ''}
            className="!rounded-lg"
          />
          {errors.receiverPhone && (
            <p className="text-sm text-error mt-1">{errors.receiverPhone}</p>
          )}
        </div>
      </div>

      {/* Complete Cascading: Region & Province */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Region <span className="text-error">*</span>
          </label>
          <Select
            size="large"
            className="w-full"
            placeholder="Select region (all 18 regions)"
            showSearch
            filterOption={searchFilter}
            value={address.region || undefined}
            onChange={(val) => onUpdate('region', val)}
            options={regionOptions}
            status={errors.region ? 'error' : ''}
          />
          {errors.region && (
            <p className="text-sm text-error mt-1">{errors.region}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Province <span className="text-error">*</span>
          </label>
          <Select
            size="large"
            className="w-full"
            placeholder={
              !address.region
                ? 'Select region first'
                : isProvincesLoading
                ? 'Loading provinces...'
                : 'Select province'
            }
            showSearch
            filterOption={searchFilter}
            disabled={!address.region || isProvincesLoading}
            loading={isProvincesLoading}
            value={address.province || undefined}
            onChange={(val) => onUpdate('province', val)}
            options={provinceOptions}
            status={errors.province ? 'error' : ''}
          />
          {errors.province && (
            <p className="text-sm text-error mt-1">{errors.province}</p>
          )}
        </div>
      </div>

      {/* Complete Cascading: City/Municipality & Barangay */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            City / Municipality <span className="text-error">*</span>
          </label>
          <Select
            size="large"
            className="w-full"
            placeholder={
              !address.province
                ? 'Select province first'
                : isCitiesLoading
                ? 'Loading cities...'
                : 'Select city or municipality'
            }
            showSearch
            filterOption={searchFilter}
            disabled={!address.province || isCitiesLoading}
            loading={isCitiesLoading}
            value={address.cityMunicipality || undefined}
            onChange={(val) => onUpdate('cityMunicipality', val)}
            options={cityOptions}
            status={errors.cityMunicipality ? 'error' : ''}
          />
          {errors.cityMunicipality && (
            <p className="text-sm text-error mt-1">{errors.cityMunicipality}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            Barangay <span className="text-error">*</span>
          </label>
          <Select
            size="large"
            className="w-full"
            placeholder={
              !address.cityMunicipality
                ? 'Select city first'
                : isBarangaysLoading
                ? 'Loading barangays...'
                : 'Select barangay'
            }
            showSearch
            filterOption={searchFilter}
            disabled={!address.cityMunicipality || isBarangaysLoading}
            loading={isBarangaysLoading}
            value={address.barangay || undefined}
            onChange={(val) => onUpdate('barangay', val)}
            options={barangayOptions}
            status={errors.barangay ? 'error' : ''}
          />
          {errors.barangay && (
            <p className="text-sm text-error mt-1">{errors.barangay}</p>
          )}
        </div>
      </div>

      {/* Street & Postal Code */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label
            htmlFor="streetBuilding"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Street name, building, house no. <span className="text-error">*</span>
          </label>
          <Input
            id="streetBuilding"
            size="large"
            placeholder="e.g. 142 Rizal St, Unit 4B"
            value={address.streetBuilding}
            onChange={(e) => onUpdate('streetBuilding', e.target.value)}
            status={errors.streetBuilding ? 'error' : ''}
            className="!rounded-lg"
          />
          {errors.streetBuilding && (
            <p className="text-sm text-error mt-1">{errors.streetBuilding}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Postal code <span className="text-error">*</span>
          </label>
          <Input
            id="postalCode"
            size="large"
            maxLength={4}
            placeholder="e.g. 1600"
            value={address.postalCode}
            onChange={(e) => onUpdate('postalCode', e.target.value.replace(/\D/g, ''))}
            status={errors.postalCode ? 'error' : ''}
            className="!rounded-lg"
          />
          {errors.postalCode && (
            <p className="text-sm text-error mt-1">{errors.postalCode}</p>
          )}
        </div>
      </div>

      {/* Default Address Toggle */}
      <div className="pt-2 flex items-center justify-between bg-stone-50/80 p-4 rounded-xl border border-stone-200/70">
        <span className="text-sm font-medium text-stone-700">
          Set as default delivery address
        </span>
        <Switch
          checked={address.isDefault}
          onChange={(checked) => onUpdate('isDefault', checked)}
        />
      </div>
    </div>
  );
}