import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  addressValidator,
  stallLocationValidator,
  stallVerificationValidator,
} from "./shared";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkId: v.string(),
    role: v.union(v.literal("buyer"), v.literal("seller")),
    fullName: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    mobileNumber: v.string(),
    email: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    updatedAt: v.string(),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_clerk_id", ["clerkId"]),

  addresses: defineTable({
    userId: v.id("users"),
    ...addressValidator.fields,
  }).index("by_userId", ["userId"]),

  stalls: defineTable({
    ownerId: v.id("users"),
    stallName: v.string(),
    description: v.string(),
    photoUrl: v.string(),
    farmType: v.string(),
    location: stallLocationValidator,
    deliveryFeePeso: v.number(),
    pickupAvailable: v.boolean(),
    verification: stallVerificationValidator,
    rating: v.number(),
    ratingCount: v.number(),
    updatedAt: v.string(),
  }).index("by_ownerId", ["ownerId"]),
});