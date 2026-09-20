'use client';

import { useEffect, useMemo, useState } from 'react';
import { App } from 'antd';
import { useCart } from '@/hooks/useCart';
import { useCartContext } from '@/components/buyer/CartProvider';
import { DeliveryAddress, AuthenticatedUser } from '@/types/auth';
import { Order } from '@/types/order';
import { NamedLocation, COMPLETE_PH_REGIONS } from '@/constants/phLocations';
import {
  updateSessionUser,
  getDeliveryAddresses,
  getDefaultAddressIndex,
} from '@/lib/mockSession';
import {
  createOrdersFromCheckout,
  OrderDraftGroup,
} from '@/lib/mockOrders';
import { fetchProvinces, fetchCities, fetchBarangays } from '@/lib/phAddress';
import { formatAddressSummary } from '@/lib/format';

function validateDeliveryAddress(
  delivery: DeliveryAddress
): Record<string, string> {
  const errs: Record<string, string> = {};

  if (!delivery.receiverName.trim()) {
    errs.receiverName = 'Contact person name is required';
  }

  const cleanPhone = delivery.receiverPhone.replace(/\s|-/g, '');
  if (!cleanPhone) {
    errs.receiverPhone = 'Contact mobile number is required';
  } else if (!/^(\+?63|0)?9\d{9}$/.test(cleanPhone)) {
    errs.receiverPhone = 'Enter a valid 11-digit mobile number';
  }

  if (!delivery.region) errs.region = 'Please select a region';
  if (!delivery.province) errs.province = 'Please select a province';
  if (!delivery.cityMunicipality)
    errs.cityMunicipality = 'Please select a city or municipality';
  if (!delivery.barangay) errs.barangay = 'Please select a barangay';

  if (!delivery.streetBuilding.trim()) {
    errs.streetBuilding = 'Street address or building number is required';
  }

  if (!delivery.postalCode.trim()) {
    errs.postalCode = 'Postal code is required';
  } else if (!/^\d{4}$/.test(delivery.postalCode.trim())) {
    errs.postalCode = 'Enter a 4-digit postal code';
  }

  return errs;
}

function makeFallbackAddress(user: AuthenticatedUser): DeliveryAddress {
  return {
    label: 'Home',
    receiverName: user.fullName,
    receiverPhone: user.mobileNumber,
    region: '',
    province: '',
    cityMunicipality: '',
    barangay: '',
    streetBuilding: '',
    postalCode: '',
  };
}

export function useCheckout() {
  const cart = useCartContext();
  const { user, groups } = useCart();
  const { message } = App.useApp();

  const initialAddresses = useMemo((): DeliveryAddress[] => {
    const saved = getDeliveryAddresses(user);
    return saved.length > 0 ? saved : [makeFallbackAddress(user)];
  }, [user]);

  const initialDefaultIndex = useMemo(() => getDefaultAddressIndex(user), [user]);

  const [addresses, setAddresses] = useState<DeliveryAddress[]>(initialAddresses);
  const [defaultIndex, setDefaultIndex] = useState(initialDefaultIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(
    () => getDeliveryAddresses(user).length === 0
  );
  const [isAdding, setIsAdding] = useState(false);
  const [detailsConfirmed, setDetailsConfirmed] = useState(
    () => getDeliveryAddresses(user).length > 0
  );
  const [selectedIndex, setSelectedIndex] = useState(initialDefaultIndex);
  const [draftAddress, setDraftAddress] = useState<DeliveryAddress>(
    () => initialAddresses[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const [provincesList, setProvincesList] = useState<NamedLocation[]>([]);
  const [citiesList, setCitiesList] = useState<NamedLocation[]>([]);
  const [barangaysList, setBarangaysList] = useState<NamedLocation[]>([]);
  const [isProvincesLoading, setIsProvincesLoading] = useState(false);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [isBarangaysLoading, setIsBarangaysLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [placedOrders, setPlacedOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const selectedAddress = addresses[selectedIndex] ?? addresses[0];

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

  const updateDraftField = <K extends keyof DeliveryAddress>(
    field: K,
    value: DeliveryAddress[K]
  ) => {
    setDraftAddress((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSelectRegion = async (regionName: string) => {
    setDraftAddress((prev) => ({
      ...prev,
      region: regionName,
      province: '',
      cityMunicipality: '',
      barangay: '',
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
    setIsProvincesLoading(true);
    try {
      setProvincesList(await fetchProvinces(regionName));
    } finally {
      setIsProvincesLoading(false);
    }
  };

  const handleSelectProvince = async (provinceName: string) => {
    setDraftAddress((prev) => ({
      ...prev,
      province: provinceName,
      cityMunicipality: '',
      barangay: '',
    }));
    setCitiesList([]);
    setBarangaysList([]);
    if (errors.cityMunicipality || errors.barangay) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.cityMunicipality;
        delete next.barangay;
        return next;
      });
    }
    setIsCitiesLoading(true);
    try {
      const province = provincesList.find((p) => p.name === provinceName);
      setCitiesList(await fetchCities(province));
    } finally {
      setIsCitiesLoading(false);
    }
  };

  const handleSelectCity = async (cityName: string) => {
    setDraftAddress((prev) => ({
      ...prev,
      cityMunicipality: cityName,
      barangay: '',
    }));
    setBarangaysList([]);
    if (errors.barangay) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.barangay;
        return next;
      });
    }
    setIsBarangaysLoading(true);
    try {
      const city = citiesList.find((c) => c.name === cityName);
      setBarangaysList(await fetchBarangays(city));
    } finally {
      setIsBarangaysLoading(false);
    }
  };

  const loadDraftCascade = async (target: DeliveryAddress) => {
    if (!target.region) return;
    setIsProvincesLoading(true);
    try {
      const provinces = await fetchProvinces(target.region);
      setProvincesList(provinces);
      const province = provinces.find((p) => p.name === target.province);
      if (province?.code) {
        setIsCitiesLoading(true);
        try {
          const cities = await fetchCities(province);
          setCitiesList(cities);
          const city = cities.find((c) => c.name === target.cityMunicipality);
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

  const selectAddress = (index: number) => {
    if (index === selectedIndex) return;
    setSelectedIndex(index);
    setDetailsConfirmed(true);
  };

  const syncAddressList = (nextAddresses: DeliveryAddress[]) => {
    const def = nextAddresses[defaultIndex] ?? nextAddresses[0];
    if (!def) return;
    const updatedUser: AuthenticatedUser = {
      ...user,
      deliveryAddresses: nextAddresses,
      deliveryAddress: def,
      defaultAddressSummary: formatAddressSummary(def),
    };
    updateSessionUser(updatedUser);
  };

  const setDefaultAddress = (index: number) => {
    const def = addresses[index];
    if (!def) return;
    if (index !== defaultIndex) {
      setDefaultIndex(index);
      const updatedUser: AuthenticatedUser = {
        ...user,
        deliveryAddresses: addresses,
        deliveryAddress: def,
        defaultAddressSummary: formatAddressSummary(def),
      };
      updateSessionUser(updatedUser);
    }
    if (index !== selectedIndex) {
      setSelectedIndex(index);
    }
    setDetailsConfirmed(true);
  };

  const startEdit = async (index: number) => {
    setErrors({});
    setIsAdding(false);
    setSelectedIndex(index);
    const target = addresses[index];
    setDraftAddress({ ...target });
    setEditMode(true);
    await loadDraftCascade(target);
  };

  const startAdd = () => {
    setErrors({});
    setIsAdding(true);
    setDraftAddress({
      label: 'Home',
      receiverName: user.fullName,
      receiverPhone: user.mobileNumber,
      region: '',
      province: '',
      cityMunicipality: '',
      barangay: '',
      streetBuilding: '',
      postalCode: '',
    });
    setProvincesList([]);
    setCitiesList([]);
    setBarangaysList([]);
    setEditMode(true);
  };

  const saveDeliveryDetails = () => {
    const errs = validateDeliveryAddress(draftAddress);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const saved = { ...draftAddress };
    let next: DeliveryAddress[];
    let index: number;
    if (isAdding) {
      next = [...addresses, saved];
      index = addresses.length;
    } else {
      next = addresses.map((a, i) => (i === selectedIndex ? saved : a));
      index = selectedIndex;
    }

    setAddresses(next);
    setSelectedIndex(index);
    setEditMode(false);
    setIsAdding(false);
    setDetailsConfirmed(true);
    syncAddressList(next);
    message.success(isAdding ? 'New address added' : 'Delivery details updated');
  };

  const cancelEdit = () => {
    setErrors({});
    setEditMode(false);
    setIsAdding(false);
  };

  const updateNote = (sellerId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [sellerId]: value }));
  };

  const openConfirm = () => {
    if (groups.length === 0) return;
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (!isPlacing) setConfirmOpen(false);
  };

  const placeOrder = async () => {
    setIsPlacing(true);
    await new Promise((resolve) => setTimeout(resolve, 650));

    const drafts: OrderDraftGroup[] = groups.map((group) => ({
      seller: group.seller,
      subtotal: group.subtotal,
      items: group.lines.map((line) => ({
        productId: line.productId,
        sellerId: group.seller.id,
        name: line.name,
        price: line.price,
        unit: line.unit,
        imageUrl: line.imageUrl,
        qty: line.qty,
      })),
    }));

    const created = createOrdersFromCheckout({
      groups: drafts,
      address: selectedAddress,
      notes,
    });
    cart.clearCart();
    setPlacedOrders(created);
    setConfirmOpen(false);
    setIsPlacing(false);
  };

  const addressKey = (address: DeliveryAddress, index: number): string =>
    `${index}-${address.region}-${address.streetBuilding}`;

  return {
    isLoading,
    error: null,
    user,
    groups,
    subtotal: cart.subtotal,
    deliveryFee: cart.deliveryFee,
    total: cart.total,
    itemCount: cart.itemCount,
    addresses,
    selectedIndex,
    defaultIndex,
    selectedAddress,
    addressKey,
    editMode,
    isAdding,
    detailsConfirmed,
    draftAddress,
    errors,
    notes,
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
    isProvincesLoading,
    isCitiesLoading,
    isBarangaysLoading,
    confirmOpen,
    isPlacing,
    placedOrders,
    updateDraftField,
    handleSelectRegion,
    handleSelectProvince,
    handleSelectCity,
    selectAddress,
    setDefaultAddress,
    startEdit,
    startAdd,
    saveDeliveryDetails,
    cancelEdit,
    updateNote,
    openConfirm,
    closeConfirm,
    placeOrder,
  };
}