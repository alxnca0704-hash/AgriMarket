'use client';

import React from 'react';
import { Input, Button, Checkbox, Alert } from 'antd';
import { useSignIn } from '@/hooks/useSignIn';
import { APP_ROUTES } from '@/constants/routes';
import { BrandMark } from '@/components/BrandMark';

export function SignInView() {
  const {
    identifier,
    password,
    rememberMe,
    setRememberMe,
    isLoading,
    error,
    fieldErrors,
    forgotPasswordNotice,
    handleIdentifierChange,
    handlePasswordChange,
    handleForgotPassword,
    closeForgotPasswordNotice,
    handleSubmit,
    handleNavigateToSignUp,
    handleNavigateToLanding,
  } = useSignIn();

  return (
    <main className="min-h-screen flex flex-col justify-between bg-stone-50 p-4 sm:p-8">
      {/* Minimal Top Header */}
      <header className="max-w-md mx-auto w-full pt-4 pb-2 flex items-center justify-between">
        <a href={APP_ROUTES.landing} className="flex items-center gap-2 no-underline">
          <BrandMark />
        </a>

        <button
          type="button"
          onClick={handleNavigateToLanding}
          className="text-sm text-[#2D6A4F] hover:text-[#1B4332] transition-colors cursor-pointer"
        >
          Back to home
        </button>
      </header>

      {/* Centered Clean Card */}
      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-white p-7 sm:p-9 rounded-xl border border-stone-200/80">
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              Sign in to Agrimarket
            </h1>
            <p className="text-sm text-stone-500 mt-1.5">
              Enter your mobile number or email address
            </p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} showIcon />
            </div>
          )}

          {forgotPasswordNotice && (
            <div className="mb-4">
              <Alert
                type="info"
                message="Password reset is unavailable in this prototype"
                description="You can sign in with any valid 11-digit mobile number (e.g. 0917 123 4567) or email with 6+ characters."
                closable
                onClose={closeForgotPasswordNotice}
                showIcon
              />
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            noValidate
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-stone-700 mb-1.5"
              >
                Mobile number or email
              </label>
              <Input
                id="identifier"
                size="large"
                placeholder="0917 123 4567 or user@example.com"
                value={identifier}
                onChange={(e) => handleIdentifierChange(e.target.value)}
                status={fieldErrors.identifier ? 'error' : ''}
                autoComplete="username"
                disabled={isLoading}
                className="!rounded-lg"
              />
              {fieldErrors.identifier && (
                <p className="text-sm text-error mt-1 font-normal">
                  {fieldErrors.identifier}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-stone-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-sage hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <Input.Password
                id="password"
                size="large"
                placeholder="Enter password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                status={fieldErrors.password ? 'error' : ''}
                autoComplete="current-password"
                disabled={isLoading}
                className="!rounded-lg"
              />
              {fieldErrors.password && (
                <p className="text-sm text-error mt-1 font-normal">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="pt-0.5">
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="text-sm text-stone-600"
              >
                Keep me signed in on this browser
              </Checkbox>
            </div>

            <div className="pt-2">
              <Button
                type="primary"
                size="large"
                block
                htmlType="submit"
                loading={isLoading}
                className="!h-11 !text-sm !font-medium !rounded-lg !bg-[#2D6A4F] hover:!bg-[#1B4332]"
              >
                Sign in
              </Button>
            </div>
          </form>

          <div className="mt-7 pt-6 border-t border-stone-100 text-center text-sm text-stone-500">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={handleNavigateToSignUp}
              className="text-sage hover:underline font-medium cursor-pointer"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>

      <footer className="text-center text-sm text-stone-400 py-3">
        Agrimarket Philippines • Prototype
      </footer>
    </main>
  );
}