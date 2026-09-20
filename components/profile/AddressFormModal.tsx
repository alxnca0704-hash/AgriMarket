'use client';

import React from 'react';
import { Input, Modal, Select } from 'antd';
import { ADDRESS_LABELS, AddressLabel } from '@/constants/phLocations';
import { AddressEditorApi, AddressOption } from '@/hooks/useAddressEditor';

interface AddressFormModalProps {
  open: boolean;
  title: string;
  submitLabel: string;
  editor: AddressEditorApi;
  onSave: () => void;
  onCancel: () => void;
}

function FieldLabel({ text, error }: { text: string; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">
        {text} <span className="text-[#A64D42]">*</span>
      </label>
      {error && <p className="text-sm text-[#A64D42] mb-1.5">{error}</p>}
    </div>
  );
}

function LabelPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (label: AddressLabel) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ADDRESS_LABELS.map((lbl) => {
        const isSelected = value === lbl;
        return (
          <button
            key={lbl}
            type="button"
            onClick={() => onChange(lbl)}
            className={`px-3.5 py-1.5 text-sm rounded-full font-medium transition-colors cursor-pointer ${
              isSelected
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
            }`}
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}

function AsyncSelect({
  placeholder,
  loading,
  disabled,
  options,
  value,
  error,
  onChange,
}: {
  placeholder: string;
  loading?: boolean;
  disabled?: boolean;
  options: AddressOption[];
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const searchFilter = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  return (
    <div>
      <Select
        size="large"
        className="w-full"
        placeholder={placeholder}
        showSearch
        filterOption={searchFilter}
        disabled={disabled}
        loading={loading}
        value={value || undefined}
        onChange={onChange}
        options={options}
        status={error ? 'error' : ''}
      />
    </div>
  );
}

export function AddressFormModal({
  open,
  title,
  submitLabel,
  editor,
  onSave,
  onCancel,
}: AddressFormModalProps) {
  const {
    draftAddress,
    errors,
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
    isProvincesLoading,
    isCitiesLoading,
    isBarangaysLoading,
    update,
    selectRegion,
    selectProvince,
    selectCity,
  } = editor;

  const updateAsync = (
    field: 'region' | 'province' | 'cityMunicipality',
    value: string
  ) => {
    update(field, value);
    if (field === 'region') selectRegion(value);
    if (field === 'province') selectProvince(value);
    if (field === 'cityMunicipality') selectCity(value);
  };

  return (
    <Modal
      open={open}
      title={title}
      okText={submitLabel}
      cancelText="Cancel"
      onOk={onSave}
      onCancel={onCancel}
      centered
      width="min(560px, calc(100% - 32px))"
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <div className="pt-4 space-y-4">
        <div>
          <span className="block text-sm font-medium text-stone-700 mb-2">
            Address label
          </span>
          <LabelPicker
            value={draftAddress.label ?? 'Home'}
            onChange={(label) => update('label', label)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel text="Contact person" error={errors.receiverName} />
            <Input
              size="large"
              placeholder="Full name"
              value={draftAddress.receiverName}
              onChange={(e) => update('receiverName', e.target.value)}
              status={errors.receiverName ? 'error' : ''}
              className="!rounded-lg"
            />
          </div>
          <div>
            <FieldLabel text="Contact phone" error={errors.receiverPhone} />
            <Input
              size="large"
              placeholder="0917 123 4567"
              value={draftAddress.receiverPhone}
              onChange={(e) => update('receiverPhone', e.target.value)}
              status={errors.receiverPhone ? 'error' : ''}
              className="!rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel text="Region" error={errors.region} />
            <AsyncSelect
              placeholder="Select region"
              options={regionOptions}
              value={draftAddress.region}
              error={errors.region}
              onChange={(val) => updateAsync('region', val)}
            />
          </div>
          <div>
            <FieldLabel text="Province" error={errors.province} />
            <AsyncSelect
              placeholder={
                !draftAddress.region
                  ? 'Select region first'
                  : isProvincesLoading
                  ? 'Loading provinces...'
                  : 'Select province'
              }
              disabled={!draftAddress.region || isProvincesLoading}
              loading={isProvincesLoading}
              options={provinceOptions}
              value={draftAddress.province}
              error={errors.province}
              onChange={(val) => updateAsync('province', val)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel text="City / Municipality" error={errors.cityMunicipality} />
            <AsyncSelect
              placeholder={
                !draftAddress.province
                  ? 'Select province first'
                  : isCitiesLoading
                  ? 'Loading cities...'
                  : 'Select city or municipality'
              }
              disabled={!draftAddress.province || isCitiesLoading}
              loading={isCitiesLoading}
              options={cityOptions}
              value={draftAddress.cityMunicipality}
              error={errors.cityMunicipality}
              onChange={(val) => updateAsync('cityMunicipality', val)}
            />
          </div>
          <div>
            <FieldLabel text="Barangay" error={errors.barangay} />
            <AsyncSelect
              placeholder={
                !draftAddress.cityMunicipality
                  ? 'Select city first'
                  : isBarangaysLoading
                  ? 'Loading barangays...'
                  : 'Select barangay'
              }
              disabled={!draftAddress.cityMunicipality || isBarangaysLoading}
              loading={isBarangaysLoading}
              options={barangayOptions}
              value={draftAddress.barangay}
              error={errors.barangay}
              onChange={(val) => update('barangay', val)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <FieldLabel text="Street name, building, house no." error={errors.streetBuilding} />
            <Input
              size="large"
              placeholder="e.g. 142 Rizal St, Unit 4B"
              value={draftAddress.streetBuilding}
              onChange={(e) => update('streetBuilding', e.target.value)}
              status={errors.streetBuilding ? 'error' : ''}
              className="!rounded-lg"
            />
          </div>
          <div>
            <FieldLabel text="Postal code" error={errors.postalCode} />
            <Input
              size="large"
              maxLength={4}
              placeholder="e.g. 1229"
              value={draftAddress.postalCode}
              onChange={(e) => update('postalCode', e.target.value.replace(/\D/g, ''))}
              status={errors.postalCode ? 'error' : ''}
              className="!rounded-lg"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}