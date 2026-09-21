'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { useSignIn as useClerkSignIn } from '@clerk/nextjs';
import { APP_ROUTES } from '@/constants/routes';

export function useSignIn() {
  const router = useRouter();
  const { message } = App.useApp();
  const { signIn } = useClerkSignIn();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      errors.identifier = 'Please enter your email address';
    } else {
      const cleanIdent = identifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdent);
      const isPhone = /^(\+?63|0)?9\d{9}$/.test(cleanIdent.replace(/\s|-/g, ''));
      if (!isEmail && !isPhone) {
        errors.identifier = 'Enter a valid email address or PH mobile number';
      }
    }

    if (!password) {
      errors.password = 'Please enter your password';
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
    message.info('Password reset is not available in this prototype yet.');
  };

  const handleNavigateToSignUp = () => {
    router.push(APP_ROUTES.signUp);
  };

  const handleNavigateToLanding = () => {
    router.push(APP_ROUTES.landing);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validate()) return;
    if (!signIn) {
      setError('Sign-in is still loading. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const createResult = await signIn.create({
        identifier: identifier.trim(),
        password,
      });
      if (createResult.error) {
        setError(createResult.error.message);
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
        router.push(APP_ROUTES.home);
        return;
      }

      if (signIn.status === 'needs_first_factor') {
        const passwordResult = await signIn.password({ password });
        if (passwordResult.error) {
          setError(passwordResult.error.message);
          return;
        }
        if (signIn.status as string === 'complete') {
          await signIn.finalize();
          router.push(APP_ROUTES.home);
          return;
        }
      }

      if (signIn.status === 'needs_second_factor') {
        setError('This account requires two-factor authentication.');
        return;
      }

      setError('Sign-in could not be completed. Please try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    identifier,
    password,
    isLoading,
    error,
    fieldErrors,
    handleIdentifierChange,
    handlePasswordChange,
    handleForgotPassword,
    handleSubmit,
    handleNavigateToSignUp,
    handleNavigateToLanding,
  };
}