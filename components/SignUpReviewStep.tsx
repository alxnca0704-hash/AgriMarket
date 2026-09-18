'use client';

import React from 'react';
import { SignUpFormData } from '@/types/auth';
import { ROLE_DETAILS } from '@/constants/roles';

interface SignUpReviewStepProps {
  formData: SignUpFormData;
  onEditStep: (stepIndex: number) => void;
}

export function SignUpReviewStep({ formData, onEditStep }: SignUpReviewStepProps) {
  const { account, profile, address } = formData;
  const roleInfo = ROLE_DETAILS[profile.role];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Review your information</h2>
        <p className="text-sm text-stone-500 mt-1">
          Verify your details before completing account creation.
        </p>
      </div>

      {/* Account Section */}
      <div className="bg-stone-50/80 p-5 rounded-xl border border-stone-200/70">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-[0.16em]">
            1. Account
          </span>
          <button
            type="button"
            onClick={() => onEditStep(0)}
            className="text-sm font-medium text-sage hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-stone-400 block">Mobile number</span>
            <span className="font-medium text-stone-800 font-mono">+63 {account.mobileNumber.replace(/^(\+63|0)/, '')}</span>
          </div>
          {account.email && (
            <div>
              <span className="text-stone-400 block">Email</span>
              <span className="font-medium text-stone-800">{account.email}</span>
            </div>
          )}
          <div>
            <span className="text-stone-400 block">Password</span>
            <span className="text-stone-500">••••••••</span>
          </div>
        </div>
      </div>

      {/* Role & Profile Section */}
      <div className="bg-stone-50/80 p-5 rounded-xl border border-stone-200/70">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-[0.16em]">
            2. Role & Profile
          </span>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="text-sm font-medium text-sage hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-stone-400 block">Role</span>
            <span className="font-semibold text-stone-900">
              {roleInfo.label}
            </span>
          </div>
          <div>
            <span className="text-stone-400 block">Full name</span>
            <span className="font-medium text-stone-800">
              {profile.firstName} {profile.lastName}
            </span>
          </div>
          {profile.farmName && (
            <div className="sm:col-span-2">
              <span className="text-stone-400 block">Farm name</span>
              <span className="font-medium text-stone-800">{profile.farmName}</span>
            </div>
          )}
          {profile.birthday && (
            <div>
              <span className="text-stone-400 block">Birthday</span>
              <span className="font-medium text-stone-800">{profile.birthday}</span>
            </div>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-stone-50/80 p-5 rounded-xl border border-stone-200/70">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-[0.16em]">
            3. Address & Routing
          </span>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="text-sm font-medium text-sage hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">{address.receiverName}</span>
            <span className="text-stone-400">•</span>
            <span className="text-stone-600 font-mono">{address.receiverPhone}</span>
            <span className="text-stone-400">•</span>
            <span className="text-stone-500 font-medium">
              {address.label}
            </span>
          </div>
          <p className="text-stone-600 pt-0.5 leading-relaxed">
            {address.streetBuilding}, Brgy. {address.barangay}, {address.cityMunicipality},{' '}
            {address.province}, {address.region} {address.postalCode}
          </p>
        </div>
      </div>
    </div>
  );
}