import type { Doc } from '@/convex/_generated/dataModel';
import { AuthenticatedUser, DeliveryAddress } from '@/types/auth';
import { AddressLabel, ADDRESS_LABELS } from '@/constants/phLocations';
import { SellerListing, StallProfile } from '@/types/seller';
import { Product, Seller } from '@/types/product';
import { Order } from '@/types/order';
import { formatAddressSummary } from '@/lib/format';

type UserDoc = Doc<'users'>;
type AddressDoc = Doc<'addresses'>;
type StallDoc = Doc<'stalls'>;
type ProductDoc = Doc<'products'>;
type OrderDoc = Doc<'orders'>;

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

export function toSellerListing(product: ProductDoc): SellerListing {
  return {
    id: product._id,
    name: product.name,
    category: product.category,
    price: product.price,
    unit: product.unit,
    imageUrl: product.imageUrl,
    imageUrls: product.imageUrls,
    stockQty: product.stockQty,
    soldCount: product.soldCount,
    harvestDate: product.harvestDate,
    expiryDate: product.expiryDate,
    description: product.description,
    isActive: product.isActive,
    createdAt: new Date(product._creationTime).toISOString(),
    updatedAt: product.updatedAt,
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

export function toBuyerSeller(stall: StallDoc, ownerName: string | null): Seller {
  return {
    id: stall._id,
    name: ownerName ?? stall.stallName,
    farmName: stall.stallName,
    location: [stall.location.cityMunicipality, stall.location.province]
      .filter(Boolean)
      .join(', '),
    region: stall.location.region,
    province: stall.location.province,
    rating: stall.rating,
    ratingCount: stall.ratingCount,
    verified: stall.verification.status === 'verified',
    distanceKm: 0,
    deliveryFeePeso: stall.deliveryFeePeso,
    avatarUrl: stall.photoUrl,
  };
}

export function toBuyerProduct(product: ProductDoc, stall: StallDoc): Product {
  return {
    id: product._id,
    sellerId: product.stallId,
    name: product.name,
    category: product.category,
    price: product.price,
    unit: product.unit,
    images: product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl],
    imageUrl: product.imageUrl,
    stockQty: product.stockQty,
    soldCount: product.soldCount,
    harvestDate: product.harvestDate,
    origin: stall.location.cityMunicipality,
    storageTips: 'Keep in a cool, dry place away from direct sunlight.',
    description: product.description,
    rating: stall.rating,
    ratingCount: stall.ratingCount,
    tags: [],
  };
}

export function toOrder(order: OrderDoc): Order {
  return {
    id: order._id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    stallId: order.stallId,
    sellerName: order.sellerName,
    sellerLocation: order.sellerLocation,
    deliveryFeePeso: order.deliveryFeePeso,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      unit: item.unit,
      imageUrl: item.imageUrl,
      qty: item.qty,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    payment: { method: order.paymentMethod, status: order.paymentStatus },
    address: {
      label: toAddressLabel(order.address.label),
      receiverName: order.address.receiverName,
      receiverPhone: order.address.receiverPhone,
      region: order.address.region,
      province: order.address.province,
      cityMunicipality: order.address.cityMunicipality,
      barangay: order.address.barangay,
      streetBuilding: order.address.streetBuilding,
      postalCode: order.address.postalCode,
    },
    note: order.note,
    status: order.status,
    events: order.events.map((event) => ({
      status: event.status,
      label: event.label,
      at: event.at,
    })),
    placedAt: order.placedAt,
    confirmedAt: order.confirmedAt,
    toReceiveAt: order.toReceiveAt,
    deliveredAt: order.deliveredAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    refundReason: order.refundReason,
    refundRequestedAt: order.refundRequestedAt,
    refundConfirmedAt: order.refundConfirmedAt,
    refundRejectedAt: order.refundRejectedAt,
    refundRejectReason: order.refundRejectReason,
  };
}