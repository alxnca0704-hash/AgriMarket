'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { AuthenticatedUser } from '@/types/auth';

export function useSignIn() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async () => {
    setError(null);
    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate quick auth response
      await new Promise((resolve) => setTimeout(resolve, 600));

      const isPhone = /^(\+?63|0)?9\d{9}$/.test(identifier.replace(/\s|-/g, ''));
      const mockUser: AuthenticatedUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        role: ROLES.BUYER,
        fullName: isPhone ? 'Returning Customer' : identifier.split('@')[0],
        mobileNumber: isPhone ? identifier : '0917 888 1234',
        email: !isPhone ? identifier : undefined,
        defaultAddressSummary: 'Brgy. San Antonio, Pasig City, Metro Manila',
        createdAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('agrimarket_user', JSON.stringify(mockUser));
      }

      router.push(APP_ROUTES.home);
    } catch {
      setError('Unable to log in. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
}
