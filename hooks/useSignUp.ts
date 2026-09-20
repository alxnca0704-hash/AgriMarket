'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { APP_ROUTES, API_ROUTES } from '@/constants/routes';
import { ROLES, UserRole } from '@/constants/roles';
import { COMPLETE_PH_REGIONS, NamedLocation } from '@/constants/phLocations';
import { SignUpFormData, AuthenticatedUser } from '@/types/auth';
import { saveMockUser } from '@/lib/mockSession';

const INITIAL_FORM_DATA: SignUpFormData = {
  profile: {
    role: ROLES.BUYER,
    firstName: '',
    lastName: '',
    birthday: '',
    farmName: '',
    photoUrl: '',
  },
  address: {
    label: 'Home',
    receiverName: '',
    receiverPhone: '',
    region: '',
    province: '',
    cityMunicipality: '',
    barangay: '',
    streetBuilding: '',
    postalCode: '',
    isDefault: true,
  },
};

const DEMO_EMAIL = 'demo.user@gmail.com';

export function useSignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  // Complete Cascading Address State
  const [provincesList, setProvincesList] = useState<NamedLocation[]>([]);
  const [citiesList, setCitiesList] = useState<NamedLocation[]>([]);
  const [barangaysList, setBarangaysList] = useState<NamedLocation[]>([]);

  const [isProvincesLoading, setIsProvincesLoading] = useState(false);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [isBarangaysLoading, setIsBarangaysLoading] = useState(false);

  const isSignedIn = verifiedEmail !== null;
  const userEmail = verifiedEmail ?? '';

  // An unsigned visitor can never advance past the Google verification step.
  const currentStep = !isSignedIn && step > 0 ? 0 : step;

  // Without a real identity provider, the profile starts blank.
  const profileWithDefaults: SignUpFormData['profile'] = formData.profile;

  // Region options (all 18 Philippine regions)
  const regionOptions = useMemo(() => {
    return COMPLETE_PH_REGIONS.map((r) => ({ label: r.name, value: r.name }));
  }, []);

  const provinceOptions = useMemo(() => {
    return provincesList.map((p) => ({ label: p.name, value: p.name }));
  }, [provincesList]);

  const cityOptions = useMemo(() => {
    return citiesList.map((c) => ({ label: c.name, value: c.name }));
  }, [citiesList]);

  const barangayOptions = useMemo(() => {
    return barangaysList.map((b) => ({ label: b.name, value: b.name }));
  }, [barangaysList]);

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

  // Load Provinces when Region changes
  const handleSelectRegion = async (regionName: string) => {
    const matchedRegion = COMPLETE_PH_REGIONS.find((r) => r.name === regionName);

    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        region: regionName,
        province: '',
        cityMunicipality: '',
        barangay: '',
      },
    }));

    setProvincesList([]);
    setCitiesList([]);
    setBarangaysList([]);

    if (errors.region) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.region;
        return next;
      });
    }

    if (!matchedRegion) return;

    setIsProvincesLoading(true);
    try {
      const res = await fetch(`${API_ROUTES.locations}?type=provinces&code=${matchedRegion.code}`);
      const json = await res.json();
      if (Array.isArray(json.data)) {
        setProvincesList(json.data);
      }
    } catch (err) {
      console.error('Failed to load provinces:', err);
    } finally {
      setIsProvincesLoading(false);
    }
  };

  // Load Cities when Province changes
  const handleSelectProvince = async (provinceName: string) => {
    const matchedProvince = provincesList.find((p) => p.name === provinceName);

    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        province: provinceName,
        cityMunicipality: '',
        barangay: '',
      },
    }));

    setCitiesList([]);
    setBarangaysList([]);

    if (errors.province) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.province;
        return next;
      });
    }

    if (!matchedProvince) return;

    setIsCitiesLoading(true);
    try {
      const res = await fetch(`${API_ROUTES.locations}?type=cities&code=${matchedProvince.code}`);
      const json = await res.json();
      if (Array.isArray(json.data)) {
        setCitiesList(json.data);
      }
    } catch (err) {
      console.error('Failed to load cities:', err);
    } finally {
      setIsCitiesLoading(false);
    }
  };

  // Load Barangays when City changes
  const handleSelectCity = async (cityName: string) => {
    const matchedCity = citiesList.find((c) => c.name === cityName);

    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        cityMunicipality: cityName,
        barangay: '',
      },
    }));

    setBarangaysList([]);

    if (errors.cityMunicipality) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.cityMunicipality;
        return next;
      });
    }

    if (!matchedCity) return;

    setIsBarangaysLoading(true);
    try {
      const res = await fetch(`${API_ROUTES.locations}?type=barangays&code=${matchedCity.code}`);
      const json = await res.json();
      if (Array.isArray(json.data)) {
        setBarangaysList(json.data);
      }
    } catch (err) {
      console.error('Failed to load barangays:', err);
    } finally {
      setIsBarangaysLoading(false);
    }
  };

  // Address field updater
  const updateAddressField = <K extends keyof SignUpFormData['address']>(
    field: K,
    value: SignUpFormData['address'][K]
  ) => {
    if (field === 'region') {
      handleSelectRegion(value as string);
      return;
    }
    if (field === 'province') {
      handleSelectProvince(value as string);
      return;
    }
    if (field === 'cityMunicipality') {
      handleSelectCity(value as string);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Validations per step
  const validateProfileStep = (): boolean => {
    const errs: Record<string, string> = {};
    const { firstName, lastName, role, farmName } = profileWithDefaults;

    if (!firstName.trim()) {
      errs.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      errs.lastName = 'Last name is required';
    }
    if (role === ROLES.SELLER && farmName && farmName.length < 2) {
      errs.farmName = 'Farm name is too short';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAddressStep = (): boolean => {
    const errs: Record<string, string> = {};
    const { receiverName, receiverPhone, region, province, cityMunicipality, barangay, streetBuilding, postalCode } =
      formData.address;

    if (!receiverName.trim()) {
      errs.receiverName = 'Contact person name is required';
    }

    const cleanPhone = receiverPhone.replace(/\s|-/g, '');
    if (!cleanPhone) {
      errs.receiverPhone = 'Contact mobile number is required';
    } else if (!/^(\+?63|0)?9\d{9}$/.test(cleanPhone)) {
      errs.receiverPhone = 'Enter a valid 11-digit mobile number';
    }

    if (!region) errs.region = 'Please select a region';
    if (!province) errs.province = 'Please select a province';
    if (!cityMunicipality) errs.cityMunicipality = 'Please select a city or municipality';
    if (!barangay) errs.barangay = 'Please select a barangay';

    if (!streetBuilding.trim()) {
      errs.streetBuilding = 'Street address or building number is required';
    }

    if (!postalCode.trim()) {
      errs.postalCode = 'Postal code is required';
    } else if (!/^\d{4}$/.test(postalCode.trim())) {
      errs.postalCode = 'Enter a 4-digit postal code';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGoogleSignUp = () => {
    setAuthError(null);
    setIsGoogleLoading(true);

    setTimeout(() => {
      setIsGoogleLoading(false);
      setVerifiedEmail(DEMO_EMAIL);
    }, 900);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!isSignedIn) {
        setAuthError('Continue with Google to verify your account first.');
        return;
      }
      setAuthError(null);
      setStep(1);
    } else if (currentStep === 1) {
      if (validateProfileStep()) {
        if (!formData.address.receiverName && (profileWithDefaults.firstName || profileWithDefaults.lastName)) {
          const defaultName = `${profileWithDefaults.firstName} ${profileWithDefaults.lastName}`.trim();
          updateAddressField('receiverName', defaultName);
        }
        setStep(2);
      }
    } else if (currentStep === 2) {
      if (validateAddressStep()) {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setErrors({});
      setStep(currentStep - 1);
    } else {
      router.push(APP_ROUTES.landing);
    }
  };

  const handleJumpToStep = (stepIndex: number) => {
    setErrors({});
    setStep(stepIndex);
  };

  const handleRoleChange = (role: UserRole) => {
    updateProfileField('role', role);
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!isSignedIn) {
      setSubmitError('Please verify your account with Google to continue.');
      setStep(0);
      return;
    }

    setIsLoading(true);

    try {
      const profile = profileWithDefaults;
      const { address } = formData;
      const addressSummary = `${address.streetBuilding}, Brgy. ${address.barangay}, ${address.cityMunicipality}, ${address.province}, ${address.region} ${address.postalCode}`;
      const cleanPhone = address.receiverPhone.replace(/\s|-/g, '');
      const mobileNumber = cleanPhone.startsWith('0') ? cleanPhone : `0${cleanPhone}`;

      const user: AuthenticatedUser = {
        id: `mock-${Date.now()}`,
        role: profile.role,
        fullName: `${profile.firstName.trim()} ${profile.lastName.trim()}`,
        mobileNumber,
        email: userEmail || undefined,
        photoUrl: profile.photoUrl || undefined,
        defaultAddressSummary: addressSummary,
        createdAt: new Date().toISOString(),
      };

      saveMockUser(user);

      await new Promise((resolve) => setTimeout(resolve, 800));

      router.push(APP_ROUTES.home);
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
    formData: { ...formData, profile: profileWithDefaults },
    errors,
    isAuthLoaded: true,
    isSignedIn,
    userEmail,
    isLoading,
    isGoogleLoading,
    submitError,
    authError,
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
    isProvincesLoading,
    isCitiesLoading,
    isBarangaysLoading,
    updateProfileField,
    updateAddressField,
    handleRoleChange,
    handleGoogleSignUp,
    handleNext,
    handleBack,
    handleJumpToStep,
    handleSubmit,
  };
}