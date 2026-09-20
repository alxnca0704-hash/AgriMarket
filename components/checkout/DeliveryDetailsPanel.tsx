'use client';

import React from 'react';
import { Button, Input, Select } from 'antd';
import {
  CheckCircleFilled,
  EditOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  PlusOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { DeliveryAddress } from '@/types/auth';
import { ADDRESS_LABELS, AddressLabel } from '@/constants/phLocations';
import { formatAddressSummary } from '@/lib/format';

interface DeliveryDetailsPanelProps {
  editMode: boolean;
  isAdding: boolean;
  confirmed: boolean;
  addresses: DeliveryAddress[];
  selectedIndex: number;
  defaultIndex: number;
  addressKey: (address: DeliveryAddress, index: number) => string;
  draftAddress: DeliveryAddress;
  errors: Record<string, string>;
  regionOptions: { label: string; value: string }[];
  provinceOptions: { label: string; value: string }[];
  cityOptions: { label: string; value: string }[];
  barangayOptions: { label: string; value: string }[];
  isProvincesLoading: boolean;
  isCitiesLoading: boolean;
  isBarangaysLoading: boolean;
  onUpdate: <K extends keyof DeliveryAddress>(
    field: K,
    value: DeliveryAddress[K]
  ) => void;
  onSelectRegion: (value: string) => void;
  onSelectProvince: (value: string) => void;
  onSelectCity: (value: string) => void;
  onSelectAddress: (index: number) => void;
  onSetDefault: (index: number) => void;
  onStartEdit: (index: number) => void;
  onStartAdd: () => void;
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

interface FieldsEditorProps {
  address: DeliveryAddress;
  errors: Record<string, string>;
  regionOptions: DeliveryDetailsPanelProps['regionOptions'];
  provinceOptions: DeliveryDetailsPanelProps['provinceOptions'];
  cityOptions: DeliveryDetailsPanelProps['cityOptions'];
  barangayOptions: DeliveryDetailsPanelProps['barangayOptions'];
  isProvincesLoading: boolean;
  isCitiesLoading: boolean;
  isBarangaysLoading: boolean;
  onUpdate: DeliveryDetailsPanelProps['onUpdate'];
  onSelectRegion: DeliveryDetailsPanelProps['onSelectRegion'];
  onSelectProvince: DeliveryDetailsPanelProps['onSelectProvince'];
  onSelectCity: DeliveryDetailsPanelProps['onSelectCity'];
}

function FieldsEditor({
  address,
  errors,
  regionOptions,
  provinceOptions,
  cityOptions,
  barangayOptions,
  isProvincesLoading,
  isCitiesLoading,
  isBarangaysLoading,
  onUpdate,
  onSelectRegion,
  onSelectProvince,
  onSelectCity,
}: FieldsEditorProps) {
  const searchFilter = (input: string, option?: { label: string; value: string }) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  const updateAsyncField = (field: 'region' | 'province' | 'cityMunicipality', value: string) => {
    onUpdate(field, value);
    if (field === 'region') onSelectRegion(value);
    if (field === 'province') onSelectProvince(value);
    if (field === 'cityMunicipality') onSelectCity(value);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel text="Contact person" error={errors.receiverName} />
          <Input
            size="large"
            placeholder="Full name"
            value={address.receiverName}
            onChange={(e) => onUpdate('receiverName', e.target.value)}
            status={errors.receiverName ? 'error' : ''}
            className="!rounded-lg"
          />
        </div>
        <div>
          <FieldLabel text="Contact phone" error={errors.receiverPhone} />
          <Input
            size="large"
            placeholder="0917 123 4567"
            value={address.receiverPhone}
            onChange={(e) => onUpdate('receiverPhone', e.target.value)}
            status={errors.receiverPhone ? 'error' : ''}
            className="!rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel text="Region" error={errors.region} />
          <Select
            size="large"
            className="w-full"
            placeholder="Select region"
            showSearch
            filterOption={searchFilter}
            value={address.region || undefined}
            onChange={(val) => updateAsyncField('region', val)}
            options={regionOptions}
            status={errors.region ? 'error' : ''}
          />
        </div>
        <div>
          <FieldLabel text="Province" error={errors.province} />
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
            onChange={(val) => updateAsyncField('province', val)}
            options={provinceOptions}
            status={errors.province ? 'error' : ''}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel text="City / Municipality" error={errors.cityMunicipality} />
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
            onChange={(val) => updateAsyncField('cityMunicipality', val)}
            options={cityOptions}
            status={errors.cityMunicipality ? 'error' : ''}
          />
        </div>
        <div>
          <FieldLabel text="Barangay" error={errors.barangay} />
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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <FieldLabel text="Street name, building, house no." error={errors.streetBuilding} />
          <Input
            size="large"
            placeholder="e.g. 142 Rizal St, Unit 4B"
            value={address.streetBuilding}
            onChange={(e) => onUpdate('streetBuilding', e.target.value)}
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
            value={address.postalCode}
            onChange={(e) => onUpdate('postalCode', e.target.value.replace(/\D/g, ''))}
            status={errors.postalCode ? 'error' : ''}
            className="!rounded-lg"
          />
        </div>
      </div>
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

export function DeliveryDetailsPanel(props: DeliveryDetailsPanelProps) {
  const {
    editMode,
    isAdding,
    confirmed,
    addresses,
    selectedIndex,
    defaultIndex,
    addressKey,
    draftAddress,
    onStartEdit,
    onStartAdd,
    onSelectAddress,
    onSetDefault,
    onSave,
    onCancel,
  } = props;

  if (editMode) {
    return (
      <section className="rounded-2xl bg-white shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-10 h-10 rounded-xl bg-sage-soft text-sage flex items-center justify-center shrink-0">
            <HomeOutlined />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">
              {isAdding ? 'Add a delivery address' : 'Edit delivery address'}
            </h2>
            <p className="text-xs text-stone-400">
              {isAdding
                ? 'Save a new address for faster checkout next time.'
                : 'Update the contact details and location.'}
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-5">
          <div>
            <span className="block text-sm font-medium text-stone-700 mb-2">Address label</span>
            <LabelPicker
              value={draftAddress.label ?? 'Home'}
              onChange={(label) => props.onUpdate('label', label)}
            />
          </div>
          <FieldsEditor
            address={draftAddress}
            errors={props.errors}
            regionOptions={props.regionOptions}
            provinceOptions={props.provinceOptions}
            cityOptions={props.cityOptions}
            barangayOptions={props.barangayOptions}
            isProvincesLoading={props.isProvincesLoading}
            isCitiesLoading={props.isCitiesLoading}
            isBarangaysLoading={props.isBarangaysLoading}
            onUpdate={props.onUpdate}
            onSelectRegion={props.onSelectRegion}
            onSelectProvince={props.onSelectProvince}
            onSelectCity={props.onSelectCity}
          />
        </div>

        <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between gap-3">
          <Button
            size="large"
            onClick={onCancel}
            className="!rounded-xl !border-stone-200 hover:!border-sage hover:!text-sage"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={onSave}
            className="!rounded-xl !h-11 !px-6 !font-semibold"
          >
            {isAdding ? 'Save address' : 'Save & confirm'}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`rounded-2xl bg-white shadow-sm p-4 sm:p-6 ${
        confirmed ? 'ring-1 ring-[#2D6A4F]/20' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-sage-soft text-sage flex items-center justify-center shrink-0">
            <HomeOutlined />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-stone-900">Delivery address</h2>
              {confirmed && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sage bg-sage-soft px-2 py-0.5 rounded-full">
                  <CheckCircleFilled /> Confirmed
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 truncate">
              {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'} · pick one
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onStartAdd}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-[#2D6A4F] cursor-pointer shrink-0"
        >
          <PlusOutlined /> Add new
        </button>
      </div>

      <div className="space-y-2.5">
        {addresses.map((address, index) => {
          const isSelected = index === selectedIndex;
          const isDefault = index === defaultIndex;
          return (
            <div
              key={addressKey(address, index)}
              className={`flex items-stretch gap-1 rounded-xl p-3.5 sm:p-4 transition-all ${
                isSelected
                  ? 'bg-sage-soft ring-1 ring-[#2D6A4F]/30'
                  : 'bg-stone-50/80 hover:bg-stone-100'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectAddress(index)}
                className="flex-1 min-w-0 flex items-start gap-3 text-left cursor-pointer"
              >
                <span
                  className={`mt-0.5 shrink-0 ${
                    isSelected ? 'text-[#2D6A4F]' : 'text-stone-300'
                  }`}
                >
                  <CheckCircleFilled className="text-lg" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-stone-900">
                      {address.receiverName}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-sage bg-white/70 px-2 py-0.5 rounded-full">
                      {address.label ?? 'Home'}
                    </span>
                    {isDefault && (
                      <span className="text-[11px] font-semibold text-white bg-[#2D6A4F] px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-1 inline-flex items-center gap-1">
                    <EnvironmentOutlined className="text-sage" />
                    <span className="line-clamp-2">{formatAddressSummary(address)}</span>
                  </p>
                </div>
              </button>
              <div className="self-start shrink-0 flex flex-col items-end gap-1">
                {isSelected && (
                  <button
                    type="button"
                    onClick={() => onStartEdit(index)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-[#2D6A4F] cursor-pointer px-2 py-1 rounded-lg hover:bg-white/80"
                  >
                    <EditOutlined /> Edit
                  </button>
                )}
                {!isDefault && (
                  <button
                    type="button"
                    onClick={() => onSetDefault(index)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-[#2D6A4F] cursor-pointer px-2 py-1 rounded-lg hover:bg-white/80"
                  >
                    <StarOutlined /> Set as default
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <p className="text-xs text-stone-400">
          {confirmed
            ? 'You can switch or edit this address before placing the order.'
            : 'Pick a delivery address for this order.'}
        </p>
      </div>
    </section>
  );
}