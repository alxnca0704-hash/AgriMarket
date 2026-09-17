'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { APP_ROUTES, API_ROUTES } from '@/constants/routes';
import { ROLES, UserRole } from '@/constants/roles';
import { COMPLETE_PH_REGIONS, NamedLocation, AddressLabel } from '@/constants/phLocations';
import { SignUpFormData, AuthenticatedUser } from '@/types/auth';

const INITIAL_FORM_DATA: SignUpFormData = {
  account: {
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  },
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

export function useSignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get('role');
  const initialRole: UserRole =
    initialRoleParam === ROLES.SELLER ? ROLES.SELLER : ROLES.BUYER;

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<SignUpFormData>(() => ({
    ...INITIAL_FORM_DATA,
    profile: {
      ...INITIAL_FORM_DATA.profile,
      role: initialRole,
    },
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Complete Cascading Address State
  const [provincesList, setProvincesList] = useState<NamedLocation[]>([]);
  const [citiesList, setCitiesList] = useState<NamedLocation[]>([]);
  const [barangaysList, setBarangaysList] = useState<NamedLocation[]>([]);

  const [isProvincesLoading, setIsProvincesLoading] = useState(false);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [isBarangaysLoading, setIsBarangaysLoading] = useState(false);

  // Region options (all 18 Philippine regions)
  const regionOptions = useMemo(() => {
    return COMPLETE_PH_REGIONS.map((r) => ({ label: r.name, value: r.name }));
  }, []);

  // Province options
  const provinceOptions = useMemo(() => {
    return provincesList.map((p) => ({ label: p.name, value: p.name }));
  }, [provincesList]);

  // City options
  const cityOptions = useMemo(() => {
    return citiesList.map((c) => ({ label: c.name, value: c.name }));
  }, [citiesList]);

  // Barangay options
  const barangayOptions = useMemo(() => {
    return barangaysList.map((b) => ({ label: b.name, value: b.name }));
  }, [barangaysList]);

  // Account field updater
  const updateAccountField = <K extends keyof SignUpFormData['account']>(
    field: K,
    value: SignUpFormData['account'][K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      account: { ...prev.account, [field]: value },
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

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
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    const { mobileNumber, email, password, confirmPassword, agreeToTerms } = formData.account;

    const cleanPhone = mobileNumber.replace(/\s|-/g, '');
    if (!cleanPhone) {
      errs.mobileNumber = 'Mobile number is required';
    } else if (!/^9\d{9}$/.test(cleanPhone) && !/^09\d{9}$/.test(cleanPhone) && !/^\+?639\d{9}$/.test(cleanPhone)) {
      errs.mobileNumber = 'Enter a valid 10-digit mobile number (e.g. 917 123 4567)';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your password';
    } else if (confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      errs.agreeToTerms = 'You must agree to the Terms of Service to continue';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    const { firstName, lastName, role, farmName } = formData.profile;

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

  const validateStep3 = (): boolean => {
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

  const handleNext = () => {
    if (currentStep === 0) {
      if (validateStep1()) {
        if (!formData.address.receiverPhone && formData.account.mobileNumber) {
          const raw = formData.account.mobileNumber.replace(/\D/g, '');
          const fullPhone = raw.startsWith('0') ? raw : `0${raw}`;
          updateAddressField('receiverPhone', fullPhone);
        }
        setCurrentStep(1);
      }
    } else if (currentStep === 1) {
      if (validateStep2()) {
        if (!formData.address.receiverName && (formData.profile.firstName || formData.profile.lastName)) {
          const defaultName = `${formData.profile.firstName} ${formData.profile.lastName}`.trim();
          updateAddressField('receiverName', defaultName);
        }
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep3()) {
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setErrors({});
      setCurrentStep((prev) => prev - 1);
    } else {
      router.push(APP_ROUTES.landing);
    }
  };

  const handleJumpToStep = (stepIndex: number) => {
    setErrors({});
    setCurrentStep(stepIndex);
  };

  const handleRoleChange = (role: UserRole) => {
    updateProfileField('role', role);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const fullName = `${formData.profile.firstName} ${formData.profile.lastName}`.trim();
      const addressSummary = `${formData.address.streetBuilding}, Brgy. ${formData.address.barangay}, ${formData.address.cityMunicipality}, ${formData.address.province}, ${formData.address.region} ${formData.address.postalCode}`;

      const rawMobile = formData.account.mobileNumber.replace(/\D/g, '');
      const formattedMobile = rawMobile.startsWith('0') ? rawMobile : `0${rawMobile}`;

      const createdUser: AuthenticatedUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        role: formData.profile.role,
        fullName,
        mobileNumber: formattedMobile,
        email: formData.account.email || undefined,
        defaultAddressSummary: addressSummary,
        createdAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('agrimarket_user', JSON.stringify(createdUser));
      }

      router.push(APP_ROUTES.home);
    } catch {
      setSubmitError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentStep,
    formData,
    errors,
    isLoading,
    submitError,
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
    isProvincesLoading,
    isCitiesLoading,
    isBarangaysLoading,
    updateAccountField,
    updateProfileField,
    updateAddressField,
    handleRoleChange,
    handleNext,
    handleBack,
    handleJumpToStep,
    handleSubmit,
  };
}
