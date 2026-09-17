'use client';

import React from 'react';
import { Input, Checkbox, Space, Button } from 'antd';
import { AccountStepData } from '@/types/auth';

interface SignUpAccountStepProps {
  account: AccountStepData;
  errors: Record<string, string>;
  onUpdate: <K extends keyof AccountStepData>(field: K, value: AccountStepData[K]) => void;
}

export function SignUpAccountStep({ account, errors, onUpdate }: SignUpAccountStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Set up your account</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          We use your mobile number to coordinate orders and deliveries.
        </p>
      </div>

      {/* Mobile number */}
      <div>
        <label
          htmlFor="mobileNumber"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5"
        >
          Mobile number <span className="text-rose-600">*</span>
        </label>
        <Space.Compact size="large" className="w-full">
          <Button
            disabled
            className="!text-xs !font-medium !text-slate-600 !bg-slate-50 !border-slate-300 pointer-events-none"
          >
            +63
          </Button>
          <Input
            id="mobileNumber"
            placeholder="917 123 4567"
            value={account.mobileNumber}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              let cleaned = raw;
              if (cleaned.startsWith('63')) {
                cleaned = cleaned.slice(2);
              }
              if (cleaned.startsWith('0')) {
                cleaned = cleaned.slice(1);
              }
              onUpdate('mobileNumber', cleaned.slice(0, 10));
            }}
            maxLength={10}
            status={errors.mobileNumber ? 'error' : ''}
          />
        </Space.Compact>
        {errors.mobileNumber ? (
          <p className="text-xs text-rose-600 mt-1 font-medium">{errors.mobileNumber}</p>
        ) : (
          <p className="text-[11px] text-slate-400 mt-1">Standard 10 digits after +63</p>
        )}
      </div>

      {/* Email (Optional) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
          >
            Email address
          </label>
          <span className="text-xs text-slate-400 font-normal">Optional</span>
        </div>
        <Input
          id="email"
          size="large"
          type="email"
          placeholder="juan@example.com"
          value={account.email}
          onChange={(e) => onUpdate('email', e.target.value)}
          status={errors.email ? 'error' : ''}
        />
        {errors.email && (
          <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="signup-password"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5"
        >
          Password <span className="text-rose-600">*</span>
        </label>
        <Input.Password
          id="signup-password"
          size="large"
          placeholder="At least 8 characters"
          value={account.password}
          onChange={(e) => onUpdate('password', e.target.value)}
          status={errors.password ? 'error' : ''}
        />
        {errors.password && (
          <p className="text-xs text-rose-600 mt-1 font-medium">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5"
        >
          Confirm password <span className="text-rose-600">*</span>
        </label>
        <Input.Password
          id="confirmPassword"
          size="large"
          placeholder="Repeat your password"
          value={account.confirmPassword}
          onChange={(e) => onUpdate('confirmPassword', e.target.value)}
          status={errors.confirmPassword ? 'error' : ''}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-rose-600 mt-1 font-medium">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Terms agreement */}
      <div className="pt-2">
        <Checkbox
          checked={account.agreeToTerms}
          onChange={(e) => onUpdate('agreeToTerms', e.target.checked)}
          className="text-xs text-slate-600"
        >
          I agree to the Agrimarket Terms of Service and Privacy Policy
        </Checkbox>
        {errors.agreeToTerms && (
          <p className="text-xs text-rose-600 mt-1 font-medium">{errors.agreeToTerms}</p>
        )}
      </div>
    </div>
  );
}
