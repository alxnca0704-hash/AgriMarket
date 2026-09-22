'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { APP_ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';

export interface ProduceItem {
  id: string;
  name: string;
  category: 'fruits' | 'vegetables' | 'grains';
  origin: string;
  farm: string;
  farmgatePrice: number;
  unit: string;
  harvestTiming: string;
}

export interface RegionalHub {
  region: string;
  mainCrops: string;
  activeFarms: number;
}

export function useLanding() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'fruits' | 'vegetables' | 'grains'>('all');

  // Redirect already-signed-in users to their home
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      const role = user?.publicMetadata?.role as string | undefined;
      if (role === ROLES.SELLER) {
        router.replace(APP_ROUTES.sellerDashboard);
      } else {
        router.replace(APP_ROUTES.home);
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  useEffect(() => {
    // Keep skeleton visible until Clerk has resolved auth state — prevents
    // flashing the marketing page for a signed-in user before redirect fires.
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 80);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  const produceList: ProduceItem[] = [
    {
      id: 'prod-1',
      name: 'Highland Strawberries',
      category: 'fruits',
      origin: 'La Trinidad, Benguet',
      farm: 'Celso Farm',
      farmgatePrice: 140,
      unit: 'kg',
      harvestTiming: 'Daily harvest',
    },
    {
      id: 'prod-2',
      name: 'Carabao Mangoes',
      category: 'fruits',
      origin: 'Jordan, Guimaras',
      farm: 'Isla Orchards',
      farmgatePrice: 110,
      unit: 'kg',
      harvestTiming: 'Twice weekly',
    },
    {
      id: 'prod-3',
      name: 'Hydroponic Romaine',
      category: 'vegetables',
      origin: 'Silang, Cavite',
      farm: 'Verde Collective',
      farmgatePrice: 75,
      unit: 'kg',
      harvestTiming: 'Daily harvest',
    },
    {
      id: 'prod-4',
      name: 'Dinorado White Rice',
      category: 'grains',
      origin: 'Cabanatuan, Nueva Ecija',
      farm: 'San Jose Cooperative',
      farmgatePrice: 48,
      unit: 'kg',
      harvestTiming: 'Milled weekly',
    },
    {
      id: 'prod-5',
      name: 'Highland Arabica Coffee',
      category: 'grains',
      origin: 'Malaybalay, Bukidnon',
      farm: 'Kitanglad Ridge',
      farmgatePrice: 380,
      unit: 'kg',
      harvestTiming: 'Batch roasted / green',
    },
    {
      id: 'prod-6',
      name: 'Native Sweet Papaya',
      category: 'fruits',
      origin: 'Lipa, Batangas',
      farm: 'Malabanan Farm',
      farmgatePrice: 45,
      unit: 'kg',
      harvestTiming: 'Twice weekly',
    },
  ];

  const regionalHubs: RegionalHub[] = [
    { region: 'Benguet & Cordillera', mainCrops: 'Highland vegetables, strawberries, Arabica', activeFarms: 142 },
    { region: 'Nueva Ecija & Central Luzon', mainCrops: 'Rice, sweet corn, onions, tomatoes', activeFarms: 188 },
    { region: 'Cavite, Laguna & Batangas', mainCrops: 'Hydroponic greens, root crops, tropical fruits', activeFarms: 95 },
    { region: 'Cebu & Central Visayas', mainCrops: 'Mangoes, sweet potatoes, organic vegetables', activeFarms: 76 },
    { region: 'Bukidnon & Davao', mainCrops: 'Specialty coffee, cacao, bananas', activeFarms: 114 },
  ];

  const filteredProduce = produceList.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const handleCreateAccount = () => {
    router.push(APP_ROUTES.signUp);
  };

  const handleJoinAsBuyer = () => {
    router.push(APP_ROUTES.signUpWithRole(ROLES.BUYER));
  };

  const handleJoinAsSeller = () => {
    router.push(APP_ROUTES.signUpWithRole(ROLES.SELLER));
  };

  const handleLogIn = () => {
    router.push(APP_ROUTES.signIn);
  };

  return {
    isLoading,
    error,
    activeCategory,
    setActiveCategory,
    filteredProduce,
    regionalHubs,
    handleCreateAccount,
    handleJoinAsBuyer,
    handleJoinAsSeller,
    handleLogIn,
  };
}
