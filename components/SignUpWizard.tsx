'use client';

import React from 'react';
import { Steps, Button, Alert } from 'antd';
import { SignUpAccountStep } from '@/components/SignUpAccountStep';
import { SignUpProfileStep } from '@/components/SignUpProfileStep';
import { SignUpAddressStep } from '@/components/SignUpAddressStep';
import { SignUpReviewStep } from '@/components/SignUpReviewStep';
import { useSignUp } from '@/hooks/useSignUp';
import { APP_ROUTES } from '@/constants/routes';

const STEP_ITEMS = [
  { title: 'Account' },
  { title: 'Role & Profile' },
  { title: 'Address' },
  { title: 'Review' },
];

export function SignUpWizard() {
  const {
    currentStep,
    formData,
    errors,
    isLoading,
    submitError,
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
    isProvincesLoading,
    isCitiesLoading,
    isBarangaysLoading,
    updateAccountField,
    updateProfileField,
    updateAddressField,
    handleRoleChange,
    handleNext,
    handleBack,
    handleJumpToStep,
    handleSubmit,
  } = useSignUp();

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#FBFBFA] p-4 sm:p-8">
      {/* Minimal Top Header */}
      <header className="max-w-xl mx-auto w-full pt-4 pb-2 flex items-center justify-between">
        <a href={APP_ROUTES.landing} className="flex items-center gap-2 text-decoration-none">
          <div className="w-7 h-7 rounded-md bg-[#2D6A4F] text-white flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" />
              <path d="M12 6v12" />
              <path d="M8 10l4-4 4 4" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight text-slate-900">agrimarket</span>
        </a>

        <button
          type="button"
          onClick={handleBack}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          {currentStep === 0 ? 'Back to home' : 'Previous step'}
        </button>
      </header>

      {/* Centered Clean Wizard Container */}
      <div className="max-w-xl mx-auto w-full my-auto py-6">
        <div className="bg-white p-7 sm:p-9 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Stepper */}
          <div className="mb-7 pb-4 border-b border-slate-100">
            <Steps
              current={currentStep}
              size="small"
              items={STEP_ITEMS}
              responsive={false}
            />
          </div>

          {submitError && (
            <div className="mb-5">
              <Alert type="error" message={submitError} showIcon />
            </div>
          )}

          {/* Current Step Component */}
          <div>
            {currentStep === 0 && (
              <SignUpAccountStep
                account={formData.account}
                errors={errors}
                onUpdate={updateAccountField}
              />
            )}

            {currentStep === 1 && (
              <SignUpProfileStep
                profile={formData.profile}
                errors={errors}
                onRoleChange={handleRoleChange}
                onUpdate={updateProfileField}
              />
            )}

            {currentStep === 2 && (
              <SignUpAddressStep
                address={formData.address}
                errors={errors}
                regionOptions={regionOptions}
                provinceOptions={provinceOptions}
                cityOptions={cityOptions}
                barangayOptions={barangayOptions}
                isProvincesLoading={isProvincesLoading}
                isCitiesLoading={isCitiesLoading}
                isBarangaysLoading={isBarangaysLoading}
                onUpdate={updateAddressField}
              />
            )}

            {currentStep === 3 && (
              <SignUpReviewStep
                formData={formData}
                onEditStep={handleJumpToStep}
              />
            )}
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <Button
              type="default"
              size="large"
              onClick={handleBack}
              disabled={isLoading}
              className="!h-10 !px-5 !text-xs !font-medium !rounded-lg !border-slate-300"
            >
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </Button>

            {currentStep < 3 ? (
              <Button
                type="primary"
                size="large"
                onClick={handleNext}
                className="!h-10 !px-6 !text-xs !font-medium !rounded-lg !bg-[#2D6A4F] hover:!bg-[#1B4332]"
              >
                Continue →
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                loading={isLoading}
                onClick={handleSubmit}
                className="!h-10 !px-6 !text-xs !font-medium !rounded-lg !bg-[#2D6A4F] hover:!bg-[#1B4332]"
              >
                Create account
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Step {currentStep + 1} of 4 • {STEP_ITEMS[currentStep].title}
        </p>
      </div>

      <footer className="text-center text-xs text-slate-400 py-3">
        Agrimarket Philippines • Prototype
      </footer>
    </main>
  );
}
