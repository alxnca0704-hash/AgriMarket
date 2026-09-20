import { ProductCategory } from '@/constants/categories';

export interface Seller {
  id: string;
  name: string;
  farmName: string;
  location: string;
  region: string;
  province: string;
  rating: number;
  ratingCount: number;
  verified: boolean;
  distanceKm: number;
  deliveryFeePeso: number;
  avatarUrl?: string;
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  category: ProductCategory;
  price: number;
  unit: string;
  imageUrl: string;
  stockQty: number;
  soldCount: number;
  harvestDate: string;
  origin: string;
  storageTips: string;
  description: string;
  rating: number;
  ratingCount: number;
  tags: string[];
}

export interface CartItem {
  productId: string;
  sellerId: string;
  qty: number;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Catalog {
  sellers: Seller[];
  products: Product[];
  reviews: Review[];
}