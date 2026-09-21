import { v } from "convex/values";

export const addressValidator = v.object({
  label: v.string(),
  receiverName: v.string(),
  receiverPhone: v.string(),
  region: v.string(),
  province: v.string(),
  cityMunicipality: v.string(),
  barangay: v.string(),
  streetBuilding: v.string(),
  postalCode: v.string(),
  isDefault: v.boolean(),
});

export const stallLocationValidator = v.object({
  region: v.string(),
  province: v.string(),
  cityMunicipality: v.string(),
  barangay: v.string(),
  streetBuilding: v.string(),
  postalCode: v.string(),
});

export const stallVerificationValidator = v.object({
  status: v.union(
    v.literal("unverified"),
    v.literal("pending"),
    v.literal("verified")
  ),
  idType: v.string(),
  idNumber: v.string(),
});

export const productCategoryValidator = v.union(
  v.literal("fruits"),
  v.literal("vegetables"),
  v.literal("grains")
);

export const productUnitValidator = v.union(
  v.literal("kg"),
  v.literal("bundle"),
  v.literal("piece")
);

export const productInputValidator = v.object({
  name: v.string(),
  category: productCategoryValidator,
  price: v.number(),
  unit: productUnitValidator,
  stockQty: v.number(),
  harvestDate: v.string(),
  expiryDate: v.optional(v.string()),
  description: v.string(),
  imageUrl: v.string(),
  imageUrls: v.array(v.string()),
  isActive: v.boolean(),
});

export const stallInputValidator = v.object({
  stallName: v.string(),
  description: v.string(),
  photoUrl: v.string(),
  farmType: v.string(),
  location: stallLocationValidator,
  deliveryFeePeso: v.number(),
  pickupAvailable: v.boolean(),
  idType: v.string(),
  idNumber: v.string(),
});

export const deliveryAddressValidator = addressValidator.omit("isDefault");

export const orderStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("to-receive"),
  v.literal("delivered"),
  v.literal("completed"),
  v.literal("cancelled")
);

export const orderItemValidator = v.object({
  productId: v.id("products"),
  name: v.string(),
  price: v.number(),
  unit: v.string(),
  imageUrl: v.string(),
  qty: v.number(),
});

export const orderEventValidator = v.object({
  status: v.union(
    v.literal("placed"),
    v.literal("pending"),
    v.literal("confirmed"),
    v.literal("to-receive"),
    v.literal("delivered"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  label: v.string(),
  at: v.string(),
});