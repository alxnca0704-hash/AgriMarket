'use client';

import { useMemo, useState } from 'react';
import { COMPLETE_PH_REGIONS, NamedLocation } from '@/constants/phLocations';
import { fetchProvinces, fetchCities, fetchBarangays } from '@/lib/phAddress';

export interface LocationDraft {
  region: string;
  province: string;
  cityMunicipality: string;
  barangay: string;
}

export function useLocationCascade(
  current: LocationDraft,
  onUpdate: (patch: Partial<LocationDraft>) => void
) {
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

  const loadInitial = async (target: LocationDraft) => {
    if (!target.region) return;
    setIsProvincesLoading(true);
    try {
      const provinces = await fetchProvinces(target.region);
      setProvincesList(provinces);
      const province = provinces.find((p) => p.name === target.province);
      if (province) {
        setIsCitiesLoading(true);
        try {
          const cities = await fetchCities(province);
          setCitiesList(cities);
          const city = cities.find((c) => c.name === target.cityMunicipality);
          if (city) {
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

  const handleSelectRegion = async (regionName: string) => {
    onUpdate({
      region: regionName,
      province: '',
      cityMunicipality: '',
      barangay: '',
    });
    setProvincesList([]);
    setCitiesList([]);
    setBarangaysList([]);
    if (!regionName) return;
    setIsProvincesLoading(true);
    try {
      setProvincesList(await fetchProvinces(regionName));
    } finally {
      setIsProvincesLoading(false);
    }
  };

  const handleSelectProvince = async (provinceName: string) => {
    onUpdate({ province: provinceName, cityMunicipality: '', barangay: '' });
    setCitiesList([]);
    setBarangaysList([]);
    if (!provinceName) return;
    const province = provincesList.find((p) => p.name === provinceName);
    setIsCitiesLoading(true);
    try {
      setCitiesList(await fetchCities(province));
    } finally {
      setIsCitiesLoading(false);
    }
  };

  const handleSelectCity = async (cityName: string) => {
    onUpdate({ cityMunicipality: cityName, barangay: '' });
    setBarangaysList([]);
    if (!cityName) return;
    const city = citiesList.find((c) => c.name === cityName);
    setIsBarangaysLoading(true);
    try {
      setBarangaysList(await fetchBarangays(city));
    } finally {
      setIsBarangaysLoading(false);
    }
  };

  return {
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
    isProvincesLoading,
    isCitiesLoading,
    isBarangaysLoading,
    loadInitial,
    handleSelectRegion,
    handleSelectProvince,
    handleSelectCity,
  };
}