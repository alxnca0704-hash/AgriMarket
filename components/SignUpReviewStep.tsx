'use client';

import React from 'react';
import { SignUpFormData } from '@/types/auth';
import { ROLE_DETAILS, ROLES } from '@/constants/roles';

interface SignUpReviewStepProps {
  formData: SignUpFormData;
  email: string;
  onEditStep: (stepIndex: number) => void;
}

export function SignUpReviewStep({ formData, email, onEditStep }: SignUpReviewStepProps) {
  const { profile, stall } = formData;
  const roleInfo = ROLE_DETAILS[profile.role];
  const isSeller = profile.role === ROLES.SELLER;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Review your information</h2>
        <p className="text-sm text-stone-500 mt-1">
          Verify your details before completing account creation.
        </p>
      </div>

      {/* Sign-in Section */}
      <div className="bg-stone-50/80 p-5 rounded-xl border border-stone-200/70">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-[0.16em]">
            1. Sign-in
          </span>
          <button
            type="button"
            onClick={() => onEditStep(0)}
            className="text-sm font-medium text-sage hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>
        <div className="text-sm">
          <span className="text-stone-400 block">Account</span>
          <span className="font-medium text-stone-800">{email || 'Email & password account'}</span>
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
          <div>
            <span className="text-stone-400 block">Mobile number</span>
            <span className="font-medium text-stone-800 font-mono">{profile.mobileNumber}</span>
          </div>
          {profile.birthday && (
            <div>
              <span className="text-stone-400 block">Birthday</span>
              <span className="font-medium text-stone-800">{profile.birthday}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stall Section */}
      {isSeller && (
        <div className="bg-stone-50/80 p-5 rounded-xl border border-stone-200/70">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-[0.16em]">
              3. Stall
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
              <span className="font-semibold text-stone-800">
                {stall.stallName || 'Your stall'}
              </span>
              <span className="text-stone-400">•</span>
              <span className="text-stone-500 font-medium">
                {stall.farmType || 'Farm type'}
              </span>
            </div>
            <p className="text-stone-600 pt-0.5 leading-relaxed">
              {stall.streetBuilding}, Brgy. {stall.barangay}, {stall.cityMunicipality},{' '}
              {stall.province}, {stall.region} {stall.postalCode}
            </p>
            <div className="flex items-center gap-4 pt-1">
              <span className="text-stone-500">
                {Number.isFinite(parseFloat(stall.deliveryFee)) ? `₱${stall.deliveryFee} delivery` : 'Delivery fee'}
              </span>
              <span className="text-stone-400">•</span>
              <span className="text-stone-500">
                {stall.pickupAvailable ? 'Pickup available' : 'Delivery only'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}