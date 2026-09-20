'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { AuthenticatedUser } from '@/types/auth';
import { getMockUser, updateSessionUser } from '@/lib/mockSession';

const DEMO_EMAIL = 'demo.user@gmail.com';

export function useSignIn() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  const validate = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      errors.identifier = 'Please enter your mobile number or email';
    } else {
      const cleanIdent = identifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdent);
      const isPhone = /^(\+?63|0)?9\d{9}$/.test(cleanIdent.replace(/\s|-/g, ''));
      if (!isEmail && !isPhone) {
        errors.identifier = 'Enter a valid 11-digit PH mobile (e.g. 0917 123 4567) or email address';
      }
    }

    if (!password) {
      errors.password = 'Please enter your password';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleIdentifierChange = (val: string) => {
    setIdentifier(val);
    if (fieldErrors.identifier) {
      setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const completeSignIn = (email: string) => {
    const existing = getMockUser();
    const user: AuthenticatedUser = existing ?? {
      id: `mock-${Date.now()}`,
      role: ROLES.BUYER,
      fullName: 'Demo Buyer',
      mobileNumber: '09171234567',
      email,
      defaultAddressSummary:
        '142 Rizal St, Brgy. San Lorenzo, Makati City, Metro Manila, NCR 1229',
      createdAt: new Date().toISOString(),
    };
    updateSessionUser(user);
    router.push(APP_ROUTES.home);
  };

  const handleGoogleSignIn = () => {
    setError(null);
    setIsGoogleLoading(true);
    setTimeout(() => {
      setIsGoogleLoading(false);
      completeSignIn(DEMO_EMAIL);
    }, 900);
  };

  const handleForgotPassword = () => {
    setForgotPasswordNotice(true);
  };

  const closeForgotPasswordNotice = () => {
    setForgotPasswordNotice(false);
  };

  const handleNavigateToSignUp = () => {
    router.push(APP_ROUTES.signUp);
  };

  const handleNavigateToLanding = () => {
    router.push(APP_ROUTES.landing);
  };

  const handleSubmit = () => {
    setError(null);
    if (!validate()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      completeSignIn(identifier.trim());
    }, 900);
  };

  return {
    identifier,
    password,
    isLoading,
    isGoogleLoading,
    error,
    fieldErrors,
    forgotPasswordNotice,
    handleIdentifierChange,
    handlePasswordChange,
    handleGoogleSignIn,
    handleForgotPassword,
    closeForgotPasswordNotice,
    handleSubmit,
    handleNavigateToSignUp,
    handleNavigateToLanding,
  };
}