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
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [codeSent, setCodeSent] = useState(false);
  const [secondFactor, setSecondFactor] = useState(false);
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

  const handleCodeChange = (val: string) => {
    setCode(val.replace(/\D/g, '').slice(0, 8));
    setError(null);
  };

  const handleModeChange = (nextMode: 'password' | 'code') => {
    setMode(nextMode);
    setCodeSent(false);
    setSecondFactor(false);
    setCode('');
    setError(null);
    setFieldErrors({});
    signIn?.reset();
  };

  const sendEmailCode = async () => {
    const cleanIdent = identifier.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdent)) {
      setFieldErrors({ identifier: 'Enter a valid email address to receive your code' });
      return;
    }
    if (!signIn) {
      setError('Sign-in is still loading. Please wait a moment and try again.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const result = await signIn.emailCode.sendCode({ emailAddress: cleanIdent });
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setCodeSent(true);
      message.success('A sign-in code was sent to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the sign-in code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!signIn || !code.trim()) {
      setError('Enter the code from your email.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const result = secondFactor
        ? await signIn.mfa.verifyEmailCode({ code: code.trim() })
        : await signIn.emailCode.verifyCode({ code: code.trim() });
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (signIn.status === 'complete') {
        await signIn.finalize();
        router.replace(APP_ROUTES.landing);
        return;
      }
      if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
        const emailFactor = signIn.supportedSecondFactors.find((factor) => factor.strategy === 'email_code');
        if (emailFactor) {
          const sent = await signIn.mfa.sendEmailCode();
          if (sent.error) {
            setError(sent.error.message);
            return;
          }
          setSecondFactor(true);
          setCode('');
          message.info('Enter the extra verification code sent to your email.');
          return;
        }
      }
      setError(`Clerk needs another sign-in step (${signIn.status}). Try password sign-in or ask the site administrator to check Clerk settings.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify the code. Please try again.');
    } finally {
      setIsLoading(false);
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
    if (mode === 'password' && !validate()) return;
    if (mode === 'code') {
      if (codeSent) {
        await verifyEmailCode();
      } else {
        await sendEmailCode();
      }
      return;
    }
    if (!signIn) {
      setError('Sign-in is still loading. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const createResult = await signIn.password({
        identifier: identifier.trim(),
        password,
      });
      if (createResult.error) {
        setError(createResult.error.message);
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
        router.replace(APP_ROUTES.landing);
        return;
      }

      if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
        const emailFactor = signIn.supportedSecondFactors.find((factor) => factor.strategy === 'email_code');
        if (emailFactor) {
          const sent = await signIn.mfa.sendEmailCode();
          if (sent.error) {
            setError(sent.error.message);
            return;
          }
          setMode('code');
          setCodeSent(true);
          setSecondFactor(true);
          message.info('Enter the extra verification code sent to your email.');
          return;
        }
        setError('This account requires another verification method that this sign-in page does not support.');
        return;
      }

      setError(`Clerk needs another sign-in step (${signIn.status}). Try signing in with a code or ask the site administrator to check Clerk settings.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    identifier,
    password,
    code,
    mode,
    codeSent,
    isLoading,
    error,
    fieldErrors,
    handleIdentifierChange,
    handlePasswordChange,
    handleCodeChange,
    handleModeChange,
    handleForgotPassword,
    handleSubmit,
    handleNavigateToSignUp,
    handleNavigateToLanding,
  };
}
