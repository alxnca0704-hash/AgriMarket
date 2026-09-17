import { AddressLabel } from '@/constants/phLocations';
import { UserRole } from '@/constants/roles';

export interface AccountStepData {
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface ProfileStepData {
  role: UserRole;
  firstName: string;
  lastName: string;
  birthday: string;
  farmName?: string;
  photoUrl?: string;
}

export interface AddressStepData {
  label: AddressLabel;
  receiverName: string;
  receiverPhone: string;
  region: string;
  province: string;
  cityMunicipality: string;
  barangay: string;
  streetBuilding: string;
  postalCode: string;
  isDefault: boolean;
}

export interface SignUpFormData {
  account: AccountStepData;
  profile: ProfileStepData;
  address: AddressStepData;
}

export interface SignInFormData {
  identifier: string; // phone or email
  password: string;
  rememberMe?: boolean;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  fullName: string;
  mobileNumber: string;
  email?: string;
  defaultAddressSummary: string;
  createdAt: string;
}
