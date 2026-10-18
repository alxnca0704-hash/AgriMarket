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
    paymentMethod: v.union(v.literal("cod"), v.literal("gcash")),
    paymentStatus: v.union(v.literal("unpaid"), v.literal("pending"), v.literal("paid"), v.literal("rejected")),
    paymentReference: v.optional(v.string()),
    paymentReceiptUrl: v.optional(v.string()),
    paymentAmount: v.optional(v.number()),
    paymentSenderName: v.optional(v.string()),
    paymentSenderNumber: v.optional(v.string()),
    paymentNote: v.optional(v.string()),
    paymentSubmittedAt: v.optional(v.string()),
    paymentRejectionReason: v.optional(v.string()),
    paymentReviewEvents: v.optional(v.array(v.object({
      status: v.union(v.literal("pending"), v.literal("paid"), v.literal("rejected")),
      label: v.string(),
      at: v.string(),
      actorEmail: v.optional(v.string()),
      reason: v.optional(v.string()),
    }))),
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
    refundEvidenceUrls: v.optional(v.array(v.string())),
    refundPayoutHold: v.optional(v.boolean()),
    returnFromStatus: v.optional(v.union(v.literal("delivered"), v.literal("completed"))),
    refundRequestedAt: v.optional(v.string()),
    returnApprovedAt: v.optional(v.string()),
    returnAddress: v.optional(v.string()),
    returnCarrier: v.optional(v.string()),
    returnTrackingNumber: v.optional(v.string()),
    returnShippedAt: v.optional(v.string()),
    returnReceivedAt: v.optional(v.string()),
    refundConfirmedAt: v.optional(v.string()),
    refundMethod: v.optional(v.union(v.literal("gcash"), v.literal("cash"))),
    refundReference: v.optional(v.string()),
    refundAmount: v.optional(v.number()),
    refundRejectedAt: v.optional(v.string()),
    refundRejectReason: v.optional(v.string()),
    payoutRequestId: v.optional(v.id("payoutRequests")),
    updatedAt: v.string(),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_sellerId", ["sellerId"])
    .index("by_stallId", ["stallId"])
    .index("by_paymentReference", ["paymentReference"])
    .index("by_paymentNote", ["paymentNote"])
    .index("by_paymentMethod_and_paymentStatus", ["paymentMethod", "paymentStatus"])
    .index("by_status", ["status"]),

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

  conversations: defineTable({
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    stallId: v.id("stalls"),
    orderId: v.optional(v.id("orders")),
    buyerLastReadAt: v.optional(v.string()),
    sellerLastReadAt: v.optional(v.string()),
    buyerUnreadCount: v.optional(v.number()),
    sellerUnreadCount: v.optional(v.number()),
    updatedAt: v.string(),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_sellerId", ["sellerId"])
    .index("by_buyerId_and_sellerId", ["buyerId", "sellerId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    senderName: v.string(),
    body: v.string(),
    createdAt: v.string(),
  }).index("by_conversationId", ["conversationId"]),

  gcashSettings: defineTable({
    key: v.literal("primary"),
    qrUrl: v.string(),
    number: v.string(),
    updatedAt: v.string(),
  }).index("by_key", ["key"]),

  payoutRequests: defineTable({
    sellerId: v.id("users"),
    stallId: v.id("stalls"),
    orderIds: v.array(v.id("orders")),
    orderSnapshots: v.optional(v.array(v.object({
      orderId: v.id("orders"),
      amount: v.number(),
      placedAt: v.string(),
      deliveredAt: v.string(),
      paymentMethod: v.union(v.literal("cod"), v.literal("gcash")),
    }))),
    amount: v.number(),
    gcashName: v.string(),
    gcashNumber: v.string(),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("rejected")),
    requestedAt: v.string(),
    reviewedAt: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
    transferReference: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_status", ["status"]),

  adminAuditLog: defineTable({
    actorEmail: v.string(),
    action: v.union(
      v.literal("gcash_settings_updated"),
      v.literal("return_approved"),
      v.literal("return_rejected"),
      v.literal("return_refunded"),
      v.literal("payout_paid"),
      v.literal("payout_rejected")
    ),
    orderId: v.optional(v.id("orders")),
    payoutRequestId: v.optional(v.id("payoutRequests")),
    paymentReference: v.optional(v.string()),
    refundReference: v.optional(v.string()),
    payoutReference: v.optional(v.string()),
    refundMethod: v.optional(v.union(v.literal("gcash"), v.literal("cash"))),
    refundAmount: v.optional(v.number()),
    payoutAmount: v.optional(v.number()),
    reason: v.optional(v.string()),
    previousNumber: v.optional(v.string()),
    nextNumber: v.optional(v.string()),
    previousQrUrl: v.optional(v.string()),
    nextQrUrl: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_createdAt", ["createdAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    role: v.optional(v.union(v.literal("buyer"), v.literal("seller"))),
    orderId: v.optional(v.id("orders")),
    refId: v.optional(v.string()),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_read", ["userId", "read"])
    .index("by_orderId", ["orderId"]),
});
