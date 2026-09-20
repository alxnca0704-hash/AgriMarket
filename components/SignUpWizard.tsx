'use client';

import React from 'react';
import { Steps, Button, Alert, Skeleton } from 'antd';
import { SignUpAuthStep } from '@/components/SignUpAuthStep';
import { SignUpProfileStep } from '@/components/SignUpProfileStep';
import { SignUpAddressStep } from '@/components/SignUpAddressStep';
import { SignUpReviewStep } from '@/components/SignUpReviewStep';
import { useSignUp } from '@/hooks/useSignUp';
import { APP_ROUTES } from '@/constants/routes';
import { BrandMark } from '@/components/BrandMark';

const STEP_ITEMS = [
  { title: 'Sign-in' },
  { title: 'Role & Profile' },
  { title: 'Address' },
  { title: 'Review' },
];

export function SignUpWizard() {
  const {
    currentStep,
    formData,
    errors,
    isAuthLoaded,
    isSignedIn,
    userEmail,
    isLoading,
    isGoogleLoading,
    submitError,
    authError,
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
    isProvincesLoading,
    isCitiesLoading,
    isBarangaysLoading,
    updateProfileField,
    updateAddressField,
    handleRoleChange,
    handleGoogleSignUp,
    handleNext,
    handleBack,
    handleJumpToStep,
    handleSubmit,
  } = useSignUp();

  return (
    <main className="min-h-screen flex flex-col justify-between bg-stone-50 p-4 sm:p-8">
      {/* Minimal Top Header */}
      <header className="max-w-xl mx-auto w-full pt-4 pb-2 flex items-center justify-between">
        <a href={APP_ROUTES.landing} className="flex items-center gap-2 no-underline">
          <BrandMark />
        </a>

        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-[#2D6A4F] hover:text-[#1B4332] transition-colors cursor-pointer"
        >
          {currentStep === 0 ? 'Back to home' : 'Previous step'}
        </button>
      </header>

      {/* Centered Clean Wizard Container */}
      <div className="max-w-xl mx-auto w-full my-auto py-6">
        <div className="bg-white p-7 sm:p-9 rounded-xl border border-stone-200/80">
          {!isAuthLoaded ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <>
              {/* Stepper */}
              <div className="mb-8 pb-5 border-b border-stone-100">
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
                  <SignUpAuthStep
                    isSignedIn={isSignedIn}
                    email={userEmail}
                    error={authError}
                    isLoading={isGoogleLoading}
                    onGoogleSignUp={handleGoogleSignUp}
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
                    email={userEmail}
                    onEditStep={handleJumpToStep}
                  />
                )}
              </div>

              {/* Navigation Controls */}
              <div className="mt-9 pt-6 border-t border-stone-100 flex items-center justify-between gap-3">
                <Button
                  type="default"
                  size="large"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="!h-10 !px-5 !text-sm !font-medium !rounded-lg !bg-white !text-[#2D6A4F] !border-[#2D6A4F] hover:!bg-[#E9F0EB]"
                >
                  {currentStep === 0 ? 'Cancel' : 'Back'}
                </Button>

                {currentStep < 3 ? (
                  currentStep === 0 && !isSignedIn ? null : (
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleNext}
                      className="!h-10 !px-6 !text-sm !font-medium !rounded-lg !bg-[#2D6A4F] hover:!bg-[#1B4332]"
                    >
                      Continue →
                    </Button>
                  )
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    loading={isLoading}
                    onClick={handleSubmit}
                    className="!h-10 !px-6 !text-sm !font-medium !rounded-lg !bg-[#2D6A4F] hover:!bg-[#1B4332]"
                  >
                    Create account
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {isAuthLoaded && (
          <p className="text-center text-sm text-stone-400 mt-4">
            Step {currentStep + 1} of 4 • {STEP_ITEMS[currentStep].title}
          </p>
        )}
      </div>

      <footer className="text-center text-sm text-stone-400 py-3">
        Agrimarket Philippines • Prototype
      </footer>
    </main>
  );
}
