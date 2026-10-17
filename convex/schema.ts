import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  addressValidator,
  deliveryAddressValidator,
  orderEventValidator,
  orderItemValidator,
  orderStatusValidator,
  productInputValidator,
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

  products: defineTable({
    stallId: v.id("stalls"),
    ...productInputValidator.fields,
    soldCount: v.number(),
    updatedAt: v.string(),
  }).index("by_stallId", ["stallId"]),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    stallId: v.id("stalls"),
    qty: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_productId", ["userId", "productId"]),

  orders: defineTable({
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    stallId: v.id("stalls"),
    sellerName: v.string(),
    sellerLocation: v.string(),
    deliveryFeePeso: v.number(),
    items: v.array(orderItemValidator),
    subtotal: v.number(),
    deliveryFee: v.number(),
    total: v.number(),
    paymentMethod: v.literal("cod"),
    paymentStatus: v.union(v.literal("unpaid"), v.literal("paid")),
    address: deliveryAddressValidator,
    note: v.optional(v.string()),
    status: orderStatusValidator,
    events: v.array(orderEventValidator),
    placedAt: v.string(),
    confirmedAt: v.optional(v.string()),
    toReceiveAt: v.optional(v.string()),
    deliveredAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    cancelledAt: v.optional(v.string()),
    cancelReason: v.optional(v.string()),
    refundReason: v.optional(v.string()),
    refundRequestedAt: v.optional(v.string()),
    refundConfirmedAt: v.optional(v.string()),
    refundRejectedAt: v.optional(v.string()),
    refundRejectReason: v.optional(v.string()),
    updatedAt: v.string(),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_sellerId", ["sellerId"])
    .index("by_stallId", ["stallId"]),

  reviews: defineTable({
    orderId: v.id("orders"),
    productId: v.optional(v.id("products")),
    productName: v.optional(v.string()),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    stallId: v.id("stalls"),
    /** buyer-facing display name snapshot */
    buyerName: v.string(),
    rating: v.number(), // 1-5
    comment: v.string(),
    /** Optional seller reply */
    reply: v.optional(v.string()),
    repliedAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_productId", ["productId"])
    .index("by_sellerId", ["sellerId"])
    .index("by_stallId", ["stallId"])
    .index("by_buyerId", ["buyerId"]),
});