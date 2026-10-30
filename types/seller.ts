import { ProductCategory } from '@/constants/categories';
import { ProductUnit } from '@/constants/productUnits';
import { ProductVariant } from '@/types/product';

export interface SellerListing {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  unit: ProductUnit;
  imageUrl: string;
  imageUrls: string[];
  stockQty: number;
  variants?: ProductVariant[];
  soldCount: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StallLocation {
  region: string;
  province: string;
  cityMunicipality: string;
  barangay: string;
  streetBuilding: string;
  postalCode: string;
}

export interface StallVerification {
  status: 'unverified' | 'pending' | 'verified';
  idType: string;
  idNumber: string;
}

export interface StallProfile {
  stallName: string;
  description: string;
  photoUrl: string;
  farmType: string;
  location: StallLocation;
  deliveryFeePeso: number;
  pickupAvailable: boolean;
  verification: StallVerification;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PayoutChannel = 'bank';

export interface PayoutMethod {
  channel: PayoutChannel;
  accountName: string;
  accountNumber: string;
  bankName?: string;
}

export type SellerNotificationType =
  | 'new-order'
  | 'order-cancelled'
  | 'low-stock'
  | 'new-review'
  | 'order-shipped'
  | 'order_placed'
  | 'order_confirmed'
  | 'order_dispatched'
  | 'order_completed'
  | 'order_cancelled'
  | 'refund_requested'
  | 'return_approved'
  | 'return_in_transit'
  | 'return_received'
  | 'refunded'
  | 'refund_rejected'
  | 'payment_approved'
  | 'payment_rejected'
  | (string & {});

export interface SellerNotification {
  id: string;
  type: SellerNotificationType;
  title: string;
  body: string;
  refId?: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export interface SellerReviewReply {
  reviewId: string;
  sellerId: string;
  reply: string;
  repliedAt: string;
}

export interface SellerReview {
  id: string;
  productId: string;
  productName: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  reply?: SellerReviewReply;
}
