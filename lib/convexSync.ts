import type { Doc } from '@/convex/_generated/dataModel';
import { AuthenticatedUser, DeliveryAddress } from '@/types/auth';
import { AddressLabel, ADDRESS_LABELS } from '@/constants/phLocations';
import { StallProfile } from '@/types/seller';
import { formatAddressSummary } from '@/lib/format';

type UserDoc = Doc<'users'>;
type AddressDoc = Doc<'addresses'>;
type StallDoc = Doc<'stalls'>;

export function toAddressLabel(value: string): AddressLabel {
  return (ADDRESS_LABELS as readonly string[]).includes(value)
    ? (value as AddressLabel)
    : 'Home';
}

export function toDeliveryAddress(address: AddressDoc): DeliveryAddress {
  return {
    label: toAddressLabel(address.label),
    receiverName: address.receiverName,
    receiverPhone: address.receiverPhone,
    region: address.region,
    province: address.province,
    cityMunicipality: address.cityMunicipality,
    barangay: address.barangay,
    streetBuilding: address.streetBuilding,
    postalCode: address.postalCode,
  };
}

export function toSessionUser(
  user: UserDoc,
  addresses: AddressDoc[],
  email?: string | null
): AuthenticatedUser {
  const sorted = [...addresses].sort(
    (a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)
  );
  const defaultAddress = sorted.find((a) => a.isDefault) ?? sorted[0];
  const deliveryAddresses =
    sorted.length > 0 ? sorted.map(toDeliveryAddress) : undefined;
  const defaultDelivery = defaultAddress
    ? toDeliveryAddress(defaultAddress)
    : undefined;

  return {
    id: user._id,
    role: user.role,
    fullName: user.fullName,
    mobileNumber: user.mobileNumber,
    email: user.email ?? email ?? undefined,
    photoUrl: user.photoUrl ?? undefined,
    defaultAddressSummary: defaultDelivery
      ? formatAddressSummary(defaultDelivery)
      : '',
    deliveryAddress: defaultDelivery,
    deliveryAddresses,
    createdAt: new Date(user._creationTime).toISOString(),
  };
}

export function toStallProfile(stall: StallDoc): StallProfile {
  return {
    stallName: stall.stallName,
    description: stall.description,
    photoUrl: stall.photoUrl,
    farmType: stall.farmType,
    location: {
      region: stall.location.region,
      province: stall.location.province,
      cityMunicipality: stall.location.cityMunicipality,
      barangay: stall.location.barangay,
      streetBuilding: stall.location.streetBuilding,
      postalCode: stall.location.postalCode,
    },
    deliveryFeePeso: stall.deliveryFeePeso,
    pickupAvailable: stall.pickupAvailable,
    verification: {
      status: stall.verification.status,
      idType: stall.verification.idType,
      idNumber: stall.verification.idNumber,
    },
    rating: stall.rating,
    ratingCount: stall.ratingCount,
    createdAt: new Date(stall._creationTime).toISOString(),
    updatedAt: stall.updatedAt,
  };
}