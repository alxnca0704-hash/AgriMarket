'use client';

import { useMemo, useState } from 'react';
import { DeliveryAddress } from '@/types/auth';
import { COMPLETE_PH_REGIONS, NamedLocation } from '@/constants/phLocations';
import { fetchProvinces, fetchCities, fetchBarangays } from '@/lib/phAddress';

export interface AddressOption {
  label: string;
  value: string;
}

export interface AddressEditorApi {
  draftAddress: DeliveryAddress;
  errors: Record<string, string>;
  regionOptions: AddressOption[];
  provinceOptions: AddressOption[];
  cityOptions: AddressOption[];
  barangayOptions: AddressOption[];
  isProvincesLoading: boolean;
  isCitiesLoading: boolean;
  isBarangaysLoading: boolean;
  open: (address: DeliveryAddress) => Promise<void>;
  reset: () => void;
  update: <K extends keyof DeliveryAddress>(field: K, value: DeliveryAddress[K]) => void;
  selectRegion: (value: string) => Promise<void>;
  selectProvince: (value: string) => Promise<void>;
  selectCity: (value: string) => Promise<void>;
  validate: () => Record<string, string>;
}

export function makeEmptyAddress(overrides: Partial<DeliveryAddress> = {}): DeliveryAddress {
  return {
    label: overrides.label ?? 'Home',
    receiverName: overrides.receiverName ?? '',
    receiverPhone: overrides.receiverPhone ?? '',
    region: overrides.region ?? '',
    province: overrides.province ?? '',
    cityMunicipality: overrides.cityMunicipality ?? '',
    barangay: overrides.barangay ?? '',
    streetBuilding: overrides.streetBuilding ?? '',
    postalCode: overrides.postalCode ?? '',
  };
}

export function useAddressEditor(): AddressEditorApi {
  const [draftAddress, setDraftAddress] = useState<DeliveryAddress>(() => makeEmptyAddress());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [provincesList, setProvincesList] = useState<NamedLocation[]>([]);
  const [citiesList, setCitiesList] = useState<NamedLocation[]>([]);
  const [barangaysList, setBarangaysList] = useState<NamedLocation[]>([]);
  const [isProvincesLoading, setIsProvincesLoading] = useState(false);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [isBarangaysLoading, setIsBarangaysLoading] = useState(false);

  const regionOptions = useMemo(
    () => COMPLETE_PH_REGIONS.map((r) => ({ label: r.name, value: r.name })),
    []
  );
  const provinceOptions = useMemo(
    () => provincesList.map((p) => ({ label: p.name, value: p.name })),
    [provincesList]
  );
  const cityOptions = useMemo(
    () => citiesList.map((c) => ({ label: c.name, value: c.name })),
    [citiesList]
  );
  const barangayOptions = useMemo(
    () => barangaysList.map((b) => ({ label: b.name, value: b.name })),
    [barangaysList]
  );

  const clearErrors = (...fields: (keyof DeliveryAddress)[]) => {
    setErrors((prev) => {
      const next = { ...prev };
      fields.forEach((field) => delete next[field]);
      return next;
    });
  };

  const update = <K extends keyof DeliveryAddress>(field: K, value: DeliveryAddress[K]) => {
    setDraftAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) clearErrors(field);
  };

  const selectRegion = async (value: string) => {
    setDraftAddress((prev) => ({
      ...prev,
      region: value,
      province: '',
      cityMunicipality: '',
      barangay: '',
    }));
    setProvincesList([]);
    setCitiesList([]);
    setBarangaysList([]);
    clearErrors('region', 'province', 'cityMunicipality', 'barangay');
    setIsProvincesLoading(true);
    try {
      setProvincesList(await fetchProvinces(value));
    } finally {
      setIsProvincesLoading(false);
    }
  };

  const selectProvince = async (value: string) => {
    setDraftAddress((prev) => ({
      ...prev,
      province: value,
      cityMunicipality: '',
      barangay: '',
    }));
    setCitiesList([]);
    setBarangaysList([]);
    clearErrors('province', 'cityMunicipality', 'barangay');
    setIsCitiesLoading(true);
    try {
      const province = provincesList.find((p) => p.name === value);
      setCitiesList(await fetchCities(province));
    } finally {
      setIsCitiesLoading(false);
    }
  };

  const selectCity = async (value: string) => {
    setDraftAddress((prev) => ({
      ...prev,
      cityMunicipality: value,
      barangay: '',
    }));
    setBarangaysList([]);
    clearErrors('cityMunicipality', 'barangay');
    setIsBarangaysLoading(true);
    try {
      const city = citiesList.find((c) => c.name === value);
      setBarangaysList(await fetchBarangays(city));
    } finally {
      setIsBarangaysLoading(false);
    }
  };

  const open = async (address: DeliveryAddress) => {
    setDraftAddress(makeEmptyAddress(address));
    setErrors({});
    setProvincesList([]);
    setCitiesList([]);
    setBarangaysList([]);
    if (!address.region) return;
    setIsProvincesLoading(true);
    try {
      const provinces = await fetchProvinces(address.region);
      setProvincesList(provinces);
      const province = provinces.find((p) => p.name === address.province);
      if (province?.code) {
        setIsCitiesLoading(true);
        try {
          const cities = await fetchCities(province);
          setCitiesList(cities);
          const city = cities.find((c) => c.name === address.cityMunicipality);
          if (city?.code) {
            setIsBarangaysLoading(true);
            try {
              setBarangaysList(await fetchBarangays(city));
            } finally {
              setIsBarangaysLoading(false);
            }
          }
        } finally {
          setIsCitiesLoading(false);
        }
      }
    } finally {
      setIsProvincesLoading(false);
    }
  };

  const reset = () => {
    setDraftAddress(makeEmptyAddress());
    setErrors({});
    setProvincesList([]);
    setCitiesList([]);
    setBarangaysList([]);
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const {
      receiverName,
      receiverPhone,
      region,
      province,
      cityMunicipality,
      barangay,
      streetBuilding,
      postalCode,
    } = draftAddress;

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
    return errs;
  };

  return {
    draftAddress,
    errors,
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
    isProvincesLoading,
    isCitiesLoading,
    isBarangaysLoading,
    open,
    reset,
    update,
    selectRegion,
    selectProvince,
    selectCity,
    validate,
  };
}