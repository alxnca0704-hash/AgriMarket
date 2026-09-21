'use client';

import React from 'react';
import { Input, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { ROLES, UserRole } from '@/constants/roles';
import { ProfileStepData } from '@/types/auth';

interface SignUpProfileStepProps {
  profile: ProfileStepData;
  errors: Record<string, string>;
  onRoleChange: (role: UserRole) => void;
  onUpdate: <K extends keyof ProfileStepData>(field: K, value: ProfileStepData[K]) => void;
}

export function SignUpProfileStep({
  profile,
  errors,
  onRoleChange,
  onUpdate,
}: SignUpProfileStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Your role & name</h2>
        <p className="text-sm text-stone-500 mt-1">
          Select your account type to customize your marketplace experience.
        </p>
      </div>

      {/* Role Selector: Quiet Selection Cards */}
      <div>
        <label className="block mb-2">
          <span className="text-sm font-medium text-stone-700">
            Account role <span className="text-error">*</span>
          </span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Buyer option */}
          <button
            type="button"
            onClick={() => onRoleChange(ROLES.BUYER)}
            className={`text-left p-5 rounded-xl transition-all cursor-pointer border ${
              profile.role === ROLES.BUYER
                ? 'bg-sage-soft border-[#2D6A4F] text-stone-900'
                : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-base text-stone-900">
                Buyer
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  profile.role === ROLES.BUYER ? 'bg-[#2D6A4F]' : 'bg-stone-300'
                }`}
              />
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Order fresh crops and harvests directly from local farms at farmgate prices.
            </p>
          </button>

          {/* Farmer / Seller option */}
          <button
            type="button"
            onClick={() => onRoleChange(ROLES.SELLER)}
            className={`text-left p-5 rounded-xl transition-all cursor-pointer border ${
              profile.role === ROLES.SELLER
                ? 'bg-sage-soft border-[#2D6A4F] text-stone-900'
                : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-base text-stone-900">
                Farmer / Producer
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  profile.role === ROLES.SELLER ? 'bg-[#2D6A4F]' : 'bg-stone-300'
                }`}
              />
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              List harvests, set your farmgate rates, and dispatch through municipal hubs.
            </p>
          </button>
        </div>
      </div>

      {/* Mobile Number */}
      <div>
        <label
          htmlFor="mobileNumber"
          className="block text-sm font-medium text-stone-700 mb-1.5"
        >
          Mobile number <span className="text-error">*</span>
        </label>
        <Input
          id="mobileNumber"
          size="large"
          placeholder="0917 123 4567"
          value={profile.mobileNumber}
          onChange={(e) => onUpdate('mobileNumber', e.target.value)}
          status={errors.mobileNumber ? 'error' : ''}
          className="!rounded-lg"
        />
        {errors.mobileNumber && (
          <p className="text-sm text-error mt-1">{errors.mobileNumber}</p>
        )}
      </div>

      {/* First & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            First name <span className="text-error">*</span>
          </label>
          <Input
            id="firstName"
            size="large"
            placeholder="Juan"
            value={profile.firstName}
            onChange={(e) => onUpdate('firstName', e.target.value)}
            status={errors.firstName ? 'error' : ''}
            className="!rounded-lg"
          />
          {errors.firstName && (
            <p className="text-sm text-error mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Last name <span className="text-error">*</span>
          </label>
          <Input
            id="lastName"
            size="large"
            placeholder="dela Cruz"
            value={profile.lastName}
            onChange={(e) => onUpdate('lastName', e.target.value)}
            status={errors.lastName ? 'error' : ''}
            className="!rounded-lg"
          />
          {errors.lastName && (
            <p className="text-sm text-error mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Birthday (Optional) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="birthday"
            className="block text-sm font-medium text-stone-700"
          >
            Birthday
          </label>
          <span className="text-sm text-stone-400">Optional</span>
        </div>
        <DatePicker
          id="birthday"
          size="large"
          className="w-full !rounded-lg"
          placeholder="Select birth date"
          value={profile.birthday ? dayjs(profile.birthday) : null}
          onChange={(_, dateString) => {
            onUpdate('birthday', typeof dateString === 'string' ? dateString : '');
          }}
        />
      </div>
    </div>
  );
}