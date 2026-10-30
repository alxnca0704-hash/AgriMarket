import type { Doc } from '@/convex/_generated/dataModel';
import { AuthenticatedUser, DeliveryAddress } from '@/types/auth';
import { AddressLabel, ADDRESS_LABELS } from '@/constants/phLocations';
import { SellerListing, StallProfile } from '@/types/seller';
import { Product, Seller } from '@/types/product';
import { Order } from '@/types/order';
import { AppNotification } from '@/types/notification';
import { formatAddressSummary } from '@/lib/format';

type UserDoc = Doc<'users'>;
type AddressDoc = Doc<'addresses'>;
type StallDoc = Doc<'stalls'>;
type ProductDoc = Doc<'products'>;
type OrderDoc = Doc<'orders'>;
type NotificationDoc = Doc<'notifications'>;

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
  const variants = product.variants ?? [{ id: `legacy-${product._id}`, name: product.unit || 'Standard', price: product.price, stock: product.stockQty, sortOrder: 0 }];
  const activeVariants = variants.filter((variant) => !variant.archived).sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    id: product._id,
    name: product.name,
    category: product.category,
    price: activeVariants.length > 0 ? Math.min(...activeVariants.map((variant) => variant.price)) : product.price,
    unit: product.unit,
    imageUrl: product.imageUrl,
    imageUrls: product.imageUrls,
    stockQty: activeVariants.reduce((sum, variant) => sum + variant.stock, 0),
    variants,
    soldCount: product.soldCount,
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
  const variants = product.variants ?? [{ id: `legacy-${product._id}`, name: product.unit || 'Standard', price: product.price, stock: product.stockQty, sortOrder: 0 }];
  const activeVariants = variants.filter((variant) => !variant.archived).sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    id: product._id,
    sellerId: product.stallId,
    name: product.name,
    category: product.category,
    price: activeVariants.length > 0 ? Math.min(...activeVariants.map((variant) => variant.price)) : product.price,
    unit: product.unit,
    images: product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl],
    imageUrl: product.imageUrl,
    stockQty: activeVariants.reduce((sum, variant) => sum + variant.stock, 0),
    soldCount: product.soldCount,
    harvestDate: '',
    variants,
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
      variantId: item.variantId,
      variantName: item.variantName,
      name: item.name,
      price: item.price,
      unit: item.unit,
      imageUrl: item.imageUrl,
      qty: item.qty,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
      payment: {
        method: order.paymentMethod,
        status: order.paymentStatus,
        ...(order.paymentReference ? { reference: order.paymentReference } : {}),
        ...(order.paymentNote ? { note: order.paymentNote } : {}),
        ...(order.paymentSubmittedAt ? { submittedAt: order.paymentSubmittedAt } : {}),
        ...(order.paymentRejectionReason ? { rejectionReason: order.paymentRejectionReason } : {}),
        ...(order.reviewedAt ? { reviewedAt: order.reviewedAt } : {}),
        attempts: order.paymentEvents ?? [],
      },
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
    deliveryCourier: order.deliveryCourier,
    deliveryTrackingNumber: order.deliveryTrackingNumber,
    deliveredAt: order.deliveredAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    refundReason: order.refundReason,
    refundEvidenceUrls: order.refundEvidenceUrls,
    refundPayoutHold: order.refundPayoutHold,
    returnFromStatus: order.returnFromStatus,
    refundRequestedAt: order.refundRequestedAt,
    returnApprovedAt: order.returnApprovedAt,
    returnAddress: order.returnAddress,
    returnCarrier: order.returnCarrier,
    returnTrackingNumber: order.returnTrackingNumber,
    returnShippedAt: order.returnShippedAt,
    returnReceivedAt: order.returnReceivedAt,
    refundConfirmedAt: order.refundConfirmedAt,
    refundMethod: order.refundMethod,
    refundFundedBy: order.refundFundedBy,
    refundAffectsPlatformGcash: order.refundAffectsPlatformGcash,
    refundReference: order.refundReference,
    refundAmount: order.refundAmount,
    refundRejectedAt: order.refundRejectedAt,
    refundRejectReason: order.refundRejectReason,
    refundGcashNumber: order.refundGcashNumber,
    refundGcashName: order.refundGcashName,
    refundSellerResponseDueAt: order.refundSellerResponseDueAt,
    refundBuyerShipDueAt: order.refundBuyerShipDueAt,
    refundRepaymentDueAt: order.refundRepaymentDueAt,
    refundRepaymentRemainingMs: order.refundRepaymentRemainingMs,
    refundBuyerResponseDueAt: order.refundBuyerResponseDueAt,
    refundNumberIssue: order.refundNumberIssue,
    refundNumberIssueReason: order.refundNumberIssueReason,
    refundNumberIssueReportedAt: order.refundNumberIssueReportedAt,
    refundSellerApprovedAt: order.refundSellerApprovedAt,
    refundSellerRejectedAt: order.refundSellerRejectedAt,
    refundSellerRejectReason: order.refundSellerRejectReason,
    refundEscalatedAt: order.refundEscalatedAt,
    refundBuyerEscalatedAt: order.refundBuyerEscalatedAt,
    refundEscalationDecision: order.refundEscalationDecision,
    refundEscalationReason: order.refundEscalationReason,
    refundRepaymentReference: order.refundRepaymentReference,
    refundRepaymentProofUrl: order.refundRepaymentProofUrl,
    refundRepaymentSubmittedAt: order.refundRepaymentSubmittedAt,
    refundRepaymentRejectedAt: order.refundRepaymentRejectedAt,
    refundRepaymentRejectReason: order.refundRepaymentRejectReason,
    refundBuyerConfirmedAt: order.refundBuyerConfirmedAt,
    refundBuyerDisputedAt: order.refundBuyerDisputedAt,
    refundBuyerDisputeReason: order.refundBuyerDisputeReason,
    refundBuyerResponse: order.refundBuyerResponse,
    refundBuyerResponseAt: order.refundBuyerResponseAt,
    refundBuyerDidNotRespond: order.refundBuyerDidNotRespond,
    refundSellerDidNotRespond: order.refundSellerDidNotRespond,
    refundDisputeCount: order.refundDisputeCount,
    refundOverdue: order.refundOverdue,
    refundOverdueAt: order.refundOverdueAt,
    refundClosedAt: order.refundClosedAt,
    refundCloseReason: order.refundCloseReason,
    refundSellerReminderSentAt: order.refundSellerReminderSentAt,
    refundRepaymentReminderSentAt: order.refundRepaymentReminderSentAt,
    refundBuyerReminderSentAt: order.refundBuyerReminderSentAt,
    refundBuyerResponseReminderSentAt: order.refundBuyerResponseReminderSentAt,
    refundOverdueNotifiedAt: order.refundOverdueNotifiedAt,
    refundReturnIssue: order.refundReturnIssue,
    refundAdminDecisionReason: order.refundAdminDecisionReason,
    refundRecordedBy: order.refundRecordedBy,
    refundRecordedAt: order.refundRecordedAt,
    refundEvents: order.refundEvents,
    payoutRequestId: order.payoutRequestId,
  };
}

export function toAppNotification(doc: NotificationDoc): AppNotification {
  return {
    id: doc._id,
    userId: doc.userId,
    role: doc.role,
    orderId: doc.orderId,
    type: doc.type as AppNotification['type'],
    title: doc.title,
    body: doc.body,
    read: doc.read,
    createdAt: doc.createdAt,
  };
}
