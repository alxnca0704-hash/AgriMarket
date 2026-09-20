'use client';

import React from 'react';
import { Button, Alert } from 'antd';
import { CheckCircleFilled, GoogleOutlined } from '@ant-design/icons';

interface SignUpAuthStepProps {
  isSignedIn: boolean;
  email: string;
  error: string | null;
  isLoading: boolean;
  onGoogleSignUp: () => void;
}

export function SignUpAuthStep({
  isSignedIn,
  email,
  error,
  isLoading,
  onGoogleSignUp,
}: SignUpAuthStepProps) {
  if (isSignedIn) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 tracking-tight">You&apos;re verified</h2>
          <p className="text-sm text-stone-500 mt-1">
            Your Google account is connected. Continue to set up your profile.
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-sage-soft">
          <CheckCircleFilled className="text-[#2D6A4F] text-lg" />
          <div>
            <span className="block text-sm font-medium text-stone-800">Signed in with Google</span>
            {email && <span className="block text-sm text-stone-500">{email}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight">Create your account</h2>
        <p className="text-sm text-stone-500 mt-1">
          Sign up securely with your Google or Gmail account. No password to remember.
        </p>
      </div>

      {error && <Alert type="error" message={error} showIcon />}

      <Button
        type="default"
        size="large"
        block
        icon={<GoogleOutlined />}
        onClick={onGoogleSignUp}
        loading={isLoading}
        className="!h-11 !text-sm !font-medium !rounded-lg !bg-white !text-stone-700 !border-stone-200 hover:!bg-stone-50 hover:!border-stone-300"
      >
        Continue with Google
      </Button>

      <p className="text-sm text-stone-400 leading-relaxed">
        We&apos;ll use your Google name and email to set up your Agrimarket profile. You can add your
        delivery details in the next steps.
      </p>
    </div>
  );
}
