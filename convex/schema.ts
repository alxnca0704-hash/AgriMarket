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
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

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
    depositStatus: v.optional(v.union(v.literal("unpaid"), v.literal("partial"), v.literal("paid"))),
    depositPaidAmount: v.optional(v.number()),
    depositDeadline: v.optional(v.number()),
    depositPaidAt: v.optional(v.string()),
    depositOverdue: v.optional(v.boolean()),
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
    submittedAt: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.string()),
    decision: v.optional(v.union(v.literal("approved"), v.literal("rejected"))),
    rejectionReason: v.optional(v.string()),
    attemptNumber: v.optional(v.number()),
    paymentEvents: v.optional(v.array(v.object({
      type: v.union(v.literal("submitted"), v.literal("approved"), v.literal("rejected"), v.literal("resubmitted")),
      actorId: v.string(),
      actorRole: v.union(v.literal("buyer"), v.literal("admin")),
      referenceNumber: v.string(),
      expectedAmount: v.number(),
      reason: v.optional(v.string()),
      at: v.string(),
    }))),
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
    deliveryCourier: v.optional(v.string()),
    deliveryTrackingNumber: v.optional(v.string()),
    deliveredAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    commissionRate: v.optional(v.number()),
    commissionAmount: v.optional(v.number()),
    netPayoutAmount: v.optional(v.number()),
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
    .index("by_referenceNumber", ["paymentReference"])
    .index("by_paymentNote", ["paymentNote"])
    .index("by_submittedAt", ["submittedAt"])
    .index("by_paymentStatus", ["paymentStatus"])
    .index("by_paymentMethod_and_paymentStatus", ["paymentMethod", "paymentStatus"])
    .index("by_completedAt", ["completedAt"])
    .index("by_stallId_and_completedAt", ["stallId", "completedAt"])
    .index("by_paymentMethod_and_completedAt", ["paymentMethod", "completedAt"])
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
      itemsSubtotal: v.optional(v.number()),
      deliveryFee: v.optional(v.number()),
      commissionAmount: v.optional(v.number()),
      netPayoutAmount: v.optional(v.number()),
      completedAt: v.optional(v.string()),
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

  platformCommissions: defineTable({
    orderId: v.id("orders"),
    stallId: v.id("stalls"),
    sellerId: v.id("users"),
    payoutRequestId: v.optional(v.id("payoutRequests")),
    itemsSubtotal: v.number(),
    rate: v.number(),
    amount: v.number(),
    status: v.union(v.literal("pending"), v.literal("collected"), v.literal("reversed")),
    createdAt: v.string(),
    collectedAt: v.optional(v.string()),
    reversedAt: v.optional(v.string()),
    events: v.array(v.object({ type: v.string(), label: v.string(), at: v.string(), actor: v.optional(v.string()), payoutRequestId: v.optional(v.id("payoutRequests")), transferReference: v.optional(v.string()) })),
  })
    .index("by_orderId", ["orderId"])
    .index("by_stallId_and_status", ["stallId", "status"])
    .index("by_status_and_collectedAt", ["status", "collectedAt"])
    .index("by_payoutRequestId", ["payoutRequestId"]),

  stallDeposits: defineTable({
    stallId: v.id("stalls"),
    sellerId: v.id("users"),
    amount: v.number(),
    referenceNumber: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    approvedAmount: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.string()),
    attemptNumber: v.optional(v.number()),
    submittedAt: v.optional(v.string()),
    events: v.array(v.union(
      v.object({ type: v.string(), actorId: v.string(), actorRole: v.union(v.literal("seller"), v.literal("admin")), amount: v.optional(v.number()), reason: v.optional(v.string()), at: v.string() }),
      v.object({ status: v.string(), label: v.string(), at: v.string(), actor: v.optional(v.string()), reason: v.optional(v.string()), amount: v.optional(v.number()) })
    )),
    createdAt: v.string(),
  })
    .index("by_stallId", ["stallId"])
    .index("by_status", ["status"])
    .index("by_referenceNumber", ["referenceNumber"])
    .index("by_submittedAt", ["submittedAt"]),

  commissionAccruals: defineTable({
    orderId: v.id("orders"), stallId: v.id("stalls"), sellerId: v.id("users"), amount: v.number(),
    rate: v.optional(v.number()),
    status: v.union(v.literal("accrued"), v.literal("invoiced"), v.literal("waived")),
    invoiceId: v.optional(v.id("commissionInvoices")), createdAt: v.string(),
  }).index("by_stallId_and_status", ["stallId", "status"]).index("by_stallId_and_createdAt", ["stallId", "createdAt"]).index("by_createdAt", ["createdAt"]).index("by_orderId", ["orderId"]),

  commissionInvoices: defineTable({
    stallId: v.id("stalls"), sellerId: v.id("users"), periodStart: v.string(), periodEnd: v.string(), amount: v.number(), paidAmount: v.number(),
    status: v.union(v.literal("issued"), v.literal("pending-review"), v.literal("partial"), v.literal("paid"), v.literal("overdue")),
    dueAt: v.number(), accrualIds: v.array(v.id("commissionAccruals")),
    events: v.array(v.object({ type: v.string(), label: v.string(), at: v.string(), actor: v.optional(v.string()), amount: v.optional(v.number()), reason: v.optional(v.string()) })),
    createdAt: v.string(),
  }).index("by_stallId", ["stallId"]).index("by_status", ["status"]).index("by_dueAt", ["dueAt"]),

  commissionPayments: defineTable({
    invoiceId: v.id("commissionInvoices"), stallId: v.id("stalls"), amount: v.number(), referenceNumber: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")), approvedAmount: v.optional(v.number()),
    rejectionReason: v.optional(v.string()), reviewedBy: v.optional(v.string()), reviewedAt: v.optional(v.string()), createdAt: v.string(),
  }).index("by_invoiceId", ["invoiceId"]).index("by_status", ["status"]).index("by_referenceNumber", ["referenceNumber"]),

  financeReconciliations: defineTable({
    actualBalance: v.number(),
    expectedBalance: v.number(),
    difference: v.number(),
    from: v.union(v.string(), v.null()),
    to: v.union(v.string(), v.null()),
    adminEmail: v.string(),
    createdAt: v.string(),
  }).index("by_createdAt", ["createdAt"]),

  adminAuditLog: defineTable({
    actorEmail: v.string(),
    action: v.union(
      v.literal("gcash_settings_updated"),
      v.literal("return_approved"),
      v.literal("return_rejected"),
      v.literal("return_refunded"),
      v.literal("payout_paid"),
      v.literal("payout_rejected"),
      v.literal("deposit_approved"),
      v.literal("deposit_rejected")
      ,v.literal("commission_payment_approved"), v.literal("commission_payment_rejected"),
      v.literal("gcash_payment_approved"), v.literal("gcash_payment_rejected")
    ),
    orderId: v.optional(v.id("orders")),
    payoutRequestId: v.optional(v.id("payoutRequests")),
    paymentReference: v.optional(v.string()),
    refundReference: v.optional(v.string()),
    payoutReference: v.optional(v.string()),
    refundMethod: v.optional(v.union(v.literal("gcash"), v.literal("cash"))),
    refundAmount: v.optional(v.number()),
    payoutAmount: v.optional(v.number()),
    depositId: v.optional(v.id("stallDeposits")),
    commissionPaymentId: v.optional(v.id("commissionPayments")),
    reason: v.optional(v.string()),
    previousNumber: v.optional(v.string()),
    nextNumber: v.optional(v.string()),
    previousQrUrl: v.optional(v.string()),
    nextQrUrl: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_createdAt", ["createdAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    role: v.optional(v.union(v.literal("buyer"), v.literal("seller"), v.literal("admin"))),
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
