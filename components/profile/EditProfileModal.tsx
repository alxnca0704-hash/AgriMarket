'use client';

import React from 'react';
import { Input, Modal } from 'antd';
import { ProfileEditData } from '@/types/profile';

interface EditProfileModalProps {
  open: boolean;
  draft: ProfileEditData;
  errors: Record<string, string>;
  onUpdate: <K extends keyof ProfileEditData>(field: K, value: ProfileEditData[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  placeholder,
  type,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1.5">
        {label} <span className="text-[#A64D42]">*</span>
      </label>
      <Input
        id={id}
        size="large"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        status={error ? 'error' : ''}
        className="!rounded-lg"
      />
      {error && <p className="text-sm text-[#A64D42] mt-1">{error}</p>}
    </div>
  );
}

export function EditProfileModal({
  open,
  draft,
  errors,
  onUpdate,
  onSave,
  onCancel,
}: EditProfileModalProps) {
  return (
    <Modal
      open={open}
      title="Edit profile"
      okText="Save changes"
      cancelText="Cancel"
      onOk={onSave}
      onCancel={onCancel}
      centered
      width="min(440px, calc(100% - 32px))"
    >
      <div className="pt-4 space-y-4">
        <Field
          id="fullName"
          label="Full name"
          value={draft.fullName}
          error={errors.fullName}
          onChange={(val) => onUpdate('fullName', val)}
          placeholder="e.g. Juan dela Cruz"
        />
        <Field
          id="mobileNumber"
          label="Mobile number"
          value={draft.mobileNumber}
          error={errors.mobileNumber}
          onChange={(val) => onUpdate('mobileNumber', val)}
          placeholder="0917 123 4567"
        />
        <Field
          id="email"
          label="Email address"
          type="email"
          value={draft.email}
          error={errors.email}
          onChange={(val) => onUpdate('email', val)}
          placeholder="you@example.com"
        />
      </div>
    </Modal>
  );
}