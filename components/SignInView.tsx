'use client';

import React from 'react';
import { Input, Button, Checkbox, Alert } from 'antd';
import { useSignIn } from '@/hooks/useSignIn';
import { APP_ROUTES } from '@/constants/routes';

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
    <main className="min-h-screen flex flex-col justify-between bg-[#FBFBFA] p-4 sm:p-8">
      {/* Minimal Top Header */}
      <header className="max-w-md mx-auto w-full pt-4 pb-2 flex items-center justify-between">
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
          onClick={handleNavigateToLanding}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          Back to home
        </button>
      </header>

      {/* Centered Clean Card */}
      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-white p-7 sm:p-9 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Sign in to Agrimarket
            </h1>
            <p className="text-xs text-slate-500 mt-1">
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
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-medium text-slate-700 mb-1"
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
                <p className="text-xs text-rose-600 mt-1 font-normal">
                  {fieldErrors.identifier}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-[#2D6A4F] hover:underline font-normal cursor-pointer"
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
                <p className="text-xs text-rose-600 mt-1 font-normal">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="pt-0.5">
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="text-xs text-slate-600"
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

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={handleNavigateToSignUp}
              className="text-[#2D6A4F] hover:underline font-medium cursor-pointer"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 py-3">
        Agrimarket Philippines • Prototype
      </footer>
    </main>
  );
}
