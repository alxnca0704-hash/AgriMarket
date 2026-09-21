import { AddressLabel } from '@/constants/phLocations';
import { UserRole } from '@/constants/roles';
import type { StallFormDraft } from '@/hooks/useSellerOnboarding';

export interface ProfileStepData {
  role: UserRole;
  firstName: string;
  lastName: string;
  birthday: string;
  mobileNumber: string;
  photoUrl?: string;
}

export interface DeliveryAddress {
  label?: AddressLabel;
  receiverName: string;
  receiverPhone: string;
  region: string;
  province: string;
  cityMunicipality: string;
  barangay: string;
  streetBuilding: string;
  postalCode: string;
}

export interface SignUpFormData {
  profile: ProfileStepData;
  stall: StallFormDraft;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  fullName: string;
  mobileNumber: string;
  email?: string;
  photoUrl?: string;
  defaultAddressSummary: string;
  deliveryAddress?: DeliveryAddress;
  deliveryAddresses?: DeliveryAddress[];
  createdAt: string;
}
