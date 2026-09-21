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