'use client';

import React from 'react';
import { Input, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { ROLES, UserRole, ROLE_DETAILS } from '@/constants/roles';
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
        <h2 className="text-base font-semibold text-slate-900">Your role & name</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select your account type to customize your marketplace experience.
        </p>
      </div>

      {/* Role Selector: Tasteful, Minimal Selection Cards */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">
          Account role <span className="text-rose-600">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Buyer option */}
          <button
            type="button"
            onClick={() => onRoleChange(ROLES.BUYER)}
            className={`text-left p-4 rounded-xl transition-all cursor-pointer border ${
              profile.role === ROLES.BUYER
                ? 'bg-emerald-50/50 border-[#2D6A4F] text-slate-900'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-sm text-slate-900">
                Buyer
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  profile.role === ROLES.BUYER ? 'bg-[#2D6A4F]' : 'bg-slate-300'
                }`}
              />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Order fresh crops and harvests directly from local farms at farmgate prices.
            </p>
          </button>

          {/* Farmer / Seller option */}
          <button
            type="button"
            onClick={() => onRoleChange(ROLES.SELLER)}
            className={`text-left p-4 rounded-xl transition-all cursor-pointer border ${
              profile.role === ROLES.SELLER
                ? 'bg-emerald-50/50 border-[#2D6A4F] text-slate-900'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-sm text-slate-900">
                Farmer / Producer
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  profile.role === ROLES.SELLER ? 'bg-[#2D6A4F]' : 'bg-slate-300'
                }`}
              />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              List harvests, set your farmgate rates, and dispatch through municipal hubs.
            </p>
          </button>
        </div>
      </div>

      {/* Optional Farm Name for Farmer role */}
      {profile.role === ROLES.SELLER && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="farmName"
              className="block text-xs font-medium text-slate-700"
            >
              Farm or collective name
            </label>
            <span className="text-[11px] text-slate-400">Optional</span>
          </div>
          <Input
            id="farmName"
            size="large"
            placeholder="e.g. Green Valley Farm"
            value={profile.farmName || ''}
            onChange={(e) => onUpdate('farmName', e.target.value)}
            className="!rounded-lg"
          />
        </div>
      )}

      {/* First & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="firstName"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            First name <span className="text-rose-600">*</span>
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
            <p className="text-xs text-rose-600 mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Last name <span className="text-rose-600">*</span>
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
            <p className="text-xs text-rose-600 mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Birthday (Optional) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="birthday"
            className="block text-xs font-medium text-slate-700"
          >
            Birthday
          </label>
          <span className="text-[11px] text-slate-400">Optional</span>
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
