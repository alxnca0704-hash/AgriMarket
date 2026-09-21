'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignUp as useClerkSignUp } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { APP_ROUTES, API_ROUTES } from '@/constants/routes';
import { ROLES, UserRole } from '@/constants/roles';
import { SignUpFormData } from '@/types/auth';
import { updateSessionUser, setActiveView } from '@/lib/mockSession';
import { toSessionUser } from '@/lib/convexSync';
import { createStall } from '@/lib/mockStall';
import { useLocationCascade } from '@/hooks/useLocationCascade';
import {
  buildStallPayload,
  makeEmptyStallDraft,
  StallFormDraft,
  toLocationDraft,
  validateStall,
} from '@/hooks/useSellerOnboarding';

const INITIAL_FORM_DATA: SignUpFormData = {
  profile: {
    role: ROLES.BUYER,
    firstName: '',
    lastName: '',
    birthday: '',
    mobileNumber: '',
    photoUrl: '',
  },
  stall: makeEmptyStallDraft(),
};

export function useSignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useClerkSignUp();
  const { isLoaded, isSignedIn, user } = useUser();
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const createStallConvex = useMutation(api.stalls.createStall);
  const didPrefill = useRef(false);

  const initialRoleParam = searchParams.get('role');
  const initialRole: UserRole =
    initialRoleParam === ROLES.SELLER ? ROLES.SELLER : ROLES.BUYER;
  const initialStep = searchParams.get('step') === '1' ? 1 : 0;

  const [step, setStep] = useState<number>(initialStep);
  const [formData, setFormData] = useState<SignUpFormData>(() => ({
    ...INITIAL_FORM_DATA,
    profile: {
      ...INITIAL_FORM_DATA.profile,
      role: initialRole,
    },
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stallErrors, setStallErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Email + password create-account step
  const [authView, setAuthView] = useState<'form' | 'verify'>('form');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [credentialErrors, setCredentialErrors] = useState<Record<string, string>>({});
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendCooldown]);

  const isSeller = formData.profile.role === ROLES.SELLER;

  const stallLocation = useLocationCascade(
    toLocationDraft(formData.stall),
    (patch) =>
      setFormData((prev) => ({ ...prev, stall: { ...prev.stall, ...patch } }))
  );

  const signedIn = isSignedIn === true;
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? '';

  // An unsigned visitor can never advance past the account-creation step.
  const currentStep = signedIn || !isLoaded ? step : 0;

  // Prefill names from the signed-in account once.
  useEffect(() => {
    if (!isLoaded || !signedIn || !user || didPrefill.current) return;
    didPrefill.current = true;
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        firstName: prev.profile.firstName || user.firstName || '',
        lastName: prev.profile.lastName || user.lastName || '',
      },
    }));
  }, [isLoaded, signedIn, user]);

  // Profile field updater
  const updateProfileField = <K extends keyof SignUpFormData['profile']>(
    field: K,
    value: SignUpFormData['profile'][K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Stall field updater
  const updateStallField = <K extends keyof StallFormDraft>(
    field: K,
    value: StallFormDraft[K]
  ) => {
    setFormData((prev) => ({ ...prev, stall: { ...prev.stall, [field]: value } }));
    if (stallErrors[field]) {
      setStallErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStallStep = (): boolean => {
    const errs = validateStall(formData.stall);
    setStallErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validations per step
  const validateProfileStep = (): boolean => {
    const errs: Record<string, string> = {};
    const { firstName, lastName, mobileNumber } = formData.profile;

    if (!firstName.trim()) {
      errs.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      errs.lastName = 'Last name is required';
    }

    const cleanPhone = mobileNumber.replace(/\s|-/g, '');
    if (!cleanPhone) {
      errs.mobileNumber = 'Mobile number is required';
    } else if (!/^(\+?63|0)?9\d{9}$/.test(cleanPhone)) {
      errs.mobileNumber = 'Enter a valid 11-digit mobile number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCredentialChange = (
    field: 'email' | 'password' | 'confirmPassword',
    value: string
  ) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    if (credentialErrors[field]) {
      setCredentialErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (authError) setAuthError(null);
  };

  const validateCredentials = (): boolean => {
    const errs: Record<string, string> = {};
    const { email, password } = credentials;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    if (credentials.confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setCredentialErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateAccount = async () => {
    setAuthError(null);
    if (!validateCredentials()) return;
    if (!signUp) {
      setAuthError('Sign-up is still loading. Please wait a moment and try again.');
      return;
    }

    setIsCreating(true);
    try {
      const result = await signUp.create({
        emailAddress: credentials.email.trim(),
        password: credentials.password,
      });
      if (result.error) {
        setAuthError(result.error.message);
        return;
      }

      if (signUp.status === 'complete') {
        const finalResult = await signUp.finalize();
        if (finalResult.error) setAuthError(finalResult.error.message);
        return;
      }

      setPendingEmail(credentials.email.trim());
      setAuthView('verify');
      setResendCooldown(30);
      const sendResult = await signUp.verifications.sendEmailCode();
      if (sendResult.error) {
        setAuthNotice('Check your inbox for the verification code.');
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Failed to create account. Please try again.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setVerificationCode(value.replace(/\D/g, ''));
    if (authError) setAuthError(null);
    if (authNotice) setAuthNotice(null);
  };

  const handleVerifyCode = async (code: string) => {
    setAuthError(null);
    setAuthNotice(null);
    if (!signUp) return;
    if (!code) return;

    setIsCreating(true);
    try {
      const result = await signUp.verifications.verifyEmailCode({ code });
      if (result.error) {
        setAuthError(result.error.message);
        return;
      }
      if (signUp.status === 'complete') {
        const finalResult = await signUp.finalize();
        if (finalResult.error) setAuthError(finalResult.error.message);
      }
      setVerificationCode('');
      setResendCooldown(0);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Verification failed. Please try again.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleResendCode = async () => {
    setAuthError(null);
    setAuthNotice(null);
    if (!signUp) return;
    try {
      const result = await signUp.verifications.sendEmailCode();
      if (result.error) {
        setAuthError(result.error.message);
        return;
      }
      setResendCooldown(30);
      setAuthNotice('A new verification code has been sent to your email.');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Failed to resend the code. Please try again.'
      );
    }
  };

  const handleCancelVerification = async () => {
    setAuthError(null);
    setAuthNotice(null);
    setVerificationCode('');
    setResendCooldown(0);
    if (signUp) await signUp.reset();
    setAuthView('form');
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!signedIn) {
        setAuthError('Create an account and verify your email to continue.');
        return;
      }
      setAuthError(null);
      setStep(1);
    } else if (currentStep === 1) {
      if (validateProfileStep()) {
        setStep(2);
      }
    } else if (currentStep === 2 && isSeller) {
      if (validateStallStep()) {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setErrors({});
      setStallErrors({});
      setStep(currentStep - 1);
    } else {
      router.push(APP_ROUTES.landing);
    }
  };

  const handleJumpToStep = (stepIndex: number) => {
    setErrors({});
    setStallErrors({});
    setStep(stepIndex);
  };

  const handleRoleChange = (role: UserRole) => {
    updateProfileField('role', role);
  };

  const syncMockSession = (
    result: Awaited<ReturnType<typeof completeOnboarding>> | null,
    userEmailAddress: string
  ) => {
    if (!result) return;
    updateSessionUser(toSessionUser(result.user, result.addresses, userEmailAddress));
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!signedIn) {
      setSubmitError('Please finish creating your account to continue.');
      setStep(0);
      return;
    }

    setIsLoading(true);

    try {
      const profile = formData.profile;
      const cleanPhone = profile.mobileNumber.replace(/\s|-/g, '');
      const mobileNumber = cleanPhone.startsWith('0') ? cleanPhone : `0${cleanPhone}`;

      const result = await completeOnboarding({
        role: profile.role,
        fullName: `${profile.firstName.trim()} ${profile.lastName.trim()}`,
        mobileNumber,
      });

      await fetch(API_ROUTES.clerkRole, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: profile.role }),
      });

      syncMockSession(result, userEmail);

      if (profile.role === ROLES.SELLER) {
        const { profile: stall, mutationInput } = buildStallPayload(formData.stall);
        await createStallConvex({ stall: mutationInput });
        createStall(stall);
        setActiveView('seller');
        router.push(APP_ROUTES.sellerDashboard);
      } else {
        router.push(APP_ROUTES.home);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentStep,
    isSeller,
    formData,
    errors,
    stallErrors,
    stallLocation,
    isAuthLoaded: isLoaded,
    isSignedIn: signedIn,
    userEmail,
    isLoading,
    submitError,
    authError,
    authNotice,
    authView,
    credentials,
    credentialErrors,
    pendingEmail,
    verificationCode,
    resendCooldown,
    isCreating,
    updateProfileField,
    updateStallField,
    handleRoleChange,
    handleCredentialChange,
    handleCodeChange,
    handleCreateAccount,
    handleVerifyCode,
    handleResendCode,
    handleCancelVerification,
    handleNext,
    handleBack,
    handleJumpToStep,
    handleSubmit,
  };
}