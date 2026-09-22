'use client';

import React from 'react';
import { Button, Alert, Input } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

export interface SignUpCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpAuthStepProps {
  isSignedIn: boolean;
  email: string;
  error: string | null;
  notice: string | null;
  authView: 'form' | 'verify';
  pendingEmail: string;
  credentials: SignUpCredentials;
  credentialErrors: Record<string, string>;
  verificationCode: string;
  resendCooldown: number;
  isCreating: boolean;
  onCredentialChange: (field: keyof SignUpCredentials, value: string) => void;
  onCodeChange: (value: string) => void;
  onCreateAccount: () => void;
  onVerifyCode: (code: string) => void;
  onResendCode: () => void;
  onCancelVerification: () => void;
}

export function SignUpAuthStep({
  isSignedIn,
  email,
  error,
  notice,
  authView,
  pendingEmail,
  credentials,
  credentialErrors,
  verificationCode,
  resendCooldown,
  isCreating,
  onCredentialChange,
  onCodeChange,
  onCreateAccount,
  onVerifyCode,
  onResendCode,
  onCancelVerification,
}: SignUpAuthStepProps) {
  if (isSignedIn) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 tracking-tight">
            You&apos;re verified
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Your account is ready. Continue to set up your profile.
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-sage-soft">
          <CheckCircleFilled className="text-[#2D6A4F] text-lg" />
          <div>
            <span className="block text-sm font-medium text-stone-800">Account verified</span>
            {email && <span className="block text-sm text-stone-500">{email}</span>}
          </div>
        </div>
      </div>
    );
  }

  if (authView === 'verify') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Verify your email</h2>
          <p className="text-sm text-stone-500 mt-1">
            Enter the 6-digit code we sent to{' '}
            <span className="font-medium text-stone-700">{pendingEmail}</span>.
          </p>
        </div>

        {error && <Alert type="error" title={error} showIcon />}
        {notice && <Alert type="success" title={notice} showIcon />}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onVerifyCode(verificationCode);
          }}
          noValidate
          className="space-y-5"
        >
          <Input.OTP
            id="email-verification-code"
            length={6}
            autoFocus
            value={verificationCode}
            onChange={(value) => {
              onCodeChange(value);
              if (value.length === 6) onVerifyCode(value);
            }}
            formatter={(value) => value.replace(/\D/g, '')}
            disabled={isCreating}
            status={error ? 'error' : ''}
            autoComplete="one-time-code"
            className="!justify-center w-full"
          />

          <div id="clerk-captcha" />

          <Button
            type="primary"
            size="large"
            block
            htmlType="submit"
            loading={isCreating}
            disabled={verificationCode.length === 0}
            className="!h-11 !text-sm !font-medium !rounded-lg !bg-[#2D6A4F] hover:!bg-[#1B4332]"
          >
            Verify email
          </Button>
        </form>

        <div className="flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            onClick={onResendCode}
            disabled={isCreating || resendCooldown > 0}
            className="text-sage hover:underline font-medium cursor-pointer disabled:opacity-50 disabled:no-underline"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </button>
          <span className="text-stone-300">•</span>
          <button
            type="button"
            onClick={onCancelVerification}
            disabled={isCreating}
            className="text-stone-500 hover:text-stone-700 font-medium cursor-pointer disabled:opacity-50"
          >
            Change email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight">
          Create your account
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          Enter an email address and password to create your Agrimarket account.
        </p>
      </div>

      {error && <Alert type="error" title={error} showIcon />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCreateAccount();
        }}
        noValidate
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Email address
          </label>
          <Input
            id="signup-email"
            type="email"
            size="large"
            placeholder="you@example.com"
            value={credentials.email}
            onChange={(e) => onCredentialChange('email', e.target.value)}
            status={credentialErrors.email ? 'error' : ''}
            autoComplete="email"
            disabled={isCreating}
            className="!rounded-lg"
          />
          {credentialErrors.email && (
            <p className="text-sm text-error mt-1 font-normal">{credentialErrors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Password
          </label>
          <Input.Password
            id="signup-password"
            size="large"
            placeholder="At least 8 characters"
            value={credentials.password}
            onChange={(e) => onCredentialChange('password', e.target.value)}
            status={credentialErrors.password ? 'error' : ''}
            autoComplete="new-password"
            disabled={isCreating}
            className="!rounded-lg"
          />
          {credentialErrors.password ? (
            <p className="text-sm text-error mt-1 font-normal">{credentialErrors.password}</p>
          ) : (
            <p className="text-sm text-stone-400 mt-1">Use at least 8 characters.</p>
          )}
        </div>

        <div>
          <label
            htmlFor="signup-confirm-password"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Confirm password
          </label>
          <Input.Password
            id="signup-confirm-password"
            size="large"
            placeholder="Re-enter your password"
            value={credentials.confirmPassword}
            onChange={(e) => onCredentialChange('confirmPassword', e.target.value)}
            status={credentialErrors.confirmPassword ? 'error' : ''}
            autoComplete="new-password"
            disabled={isCreating}
            className="!rounded-lg"
          />
          {credentialErrors.confirmPassword && (
            <p className="text-sm text-error mt-1 font-normal">
              {credentialErrors.confirmPassword}
            </p>
          )}
        </div>

        <div id="clerk-captcha" />

        <Button
          type="primary"
          size="large"
          block
          htmlType="submit"
          loading={isCreating}
          className="!h-11 !text-sm !font-medium !rounded-lg !bg-[#2D6A4F] hover:!bg-[#1B4332]"
        >
          Create account
        </Button>
      </form>

      <p className="text-sm text-stone-400 leading-relaxed">
        We&apos;ll email you a one-time verification code. After that you&apos;ll set up your
        profile in the next steps.
      </p>
    </div>
  );
}