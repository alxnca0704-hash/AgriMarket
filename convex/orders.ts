import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { deliveryAddressValidator } from "./shared";
import { createNotification } from "./notifications";
import { makeFunctionReference } from "convex/server";
import { SELLER_DEPOSIT_AMOUNT } from "../constants/deposits";
import { RETURN_REQUEST_WINDOW_MS, RETURN_WINDOW_CLOSED_MESSAGE } from "../constants/refunds";

const BUYER_ORDER_LIMIT = 100;
const SELLER_ORDER_LIMIT = 200;
const CART_ITEM_LIMIT = 200;
const accrueCodDeliveryRef = makeFunctionReference<"mutation", { orderId: Id<"orders"> }, null>("commissions:accrueCodDelivery");

type OrderStatus =
  | "pending"
  | "confirmed"
  | "to-receive"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refund-requested"
  | "return-approved"
  | "return-in-transit"
  | "return-received"
  | "refunded";

async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();
}

async function requireUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (user === null) throw new Error("Not authenticated");
  return user;
}

async function getBuyerOrder(
  ctx: MutationCtx,
  buyerId: Id<"users">,
  orderId: Id<"orders">
): Promise<Doc<"orders">> {
  const order = await ctx.db.get("orders", orderId);
  if (order === null || order.buyerId !== buyerId) {
    throw new Error("Order not found");
  }
  return order;
}

async function requireSellerOrder(
  ctx: MutationCtx,
  sellerId: Id<"users">,
  orderId: Id<"orders">
): Promise<Doc<"orders">> {
  const order = await ctx.db.get("orders", orderId);
  if (order === null || order.sellerId !== sellerId) {
    throw new Error("Order not found");
  }
  return order;
}

function assertStatus(order: Doc<"orders">, expected: OrderStatus): void {
  if (order.status !== expected) {
    throw new Error(`This action is not available for a ${order.status} order`);
  }
}

async function restoreStock(ctx: MutationCtx, order: Doc<"orders">) {
  if (order.confirmedAt === undefined) return;
  const now = new Date().toISOString();
  for (const item of order.items) {
    const product = await ctx.db.get("products", item.productId);
    if (product === null) continue;
    await ctx.db.patch("products", product._id, {
      stockQty: product.stockQty + item.qty,
      soldCount: Math.max(0, product.soldCount - item.qty),
      updatedAt: now,
    });
  }
}

export const placeOrders = mutation({
  args: {
    address: deliveryAddressValidator,
    notes: v.record(v.string(), v.string()),
    productIds: v.array(v.id("products")),
    paymentMethod: v.union(v.literal("cod"), v.literal("gcash")),
    paymentReference: v.optional(v.string()),
    paymentNote: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const paymentReference = args.paymentReference?.trim().replace(/\s+/g, " ").toUpperCase();
    const paymentNote = args.paymentNote?.trim();
    if (args.paymentMethod === "gcash") {
      if (!paymentReference || paymentReference.length < 4 || paymentReference.length > 40 || !paymentNote || !/^AG-[A-Z0-9]{12}$/.test(paymentNote)) {
        throw new Error("GCash reference number and payment note are required.");
      }
      const existingNote = await ctx.db.query("orders")
        .withIndex("by_paymentNote", (q) => q.eq("paymentNote", paymentNote))
        .first();
      if (existingNote) throw new Error("Payment note collision. Please refresh checkout and try again.");
      const referenceGroups = await Promise.all((['pending', 'paid', 'rejected'] as const).map((status) => ctx.db.query("orders")
        .withIndex("by_paymentMethod_and_paymentStatus", (q) => q.eq("paymentMethod", "gcash").eq("paymentStatus", status)).take(1000)));
      const duplicateReference = referenceGroups.flat().some((order) => order.paymentReference?.trim().replace(/\s+/g, " ").toUpperCase() === paymentReference);
      if (duplicateReference) {
        throw new Error("This GCash reference number has already been submitted.");
      }
    }

    const allCartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(CART_ITEM_LIMIT);
    const selectedIds = new Set<string>(args.productIds);
    const cartItems = allCartItems.filter((item) =>
      selectedIds.has(item.productId)
    );
    if (cartItems.length === 0) {
      throw new Error("Select at least one item to check out");
    }

    const itemsByStall = new Map<Id<"stalls">, Doc<"cartItems">[]>();
    for (const item of cartItems) {
      const list = itemsByStall.get(item.stallId) ?? [];
      list.push(item);
      itemsByStall.set(item.stallId, list);
    }

    const now = new Date().toISOString();
    const createdIds: Id<"orders">[] = [];

    for (const [stallId, items] of itemsByStall) {
      const stall = await ctx.db.get("stalls", stallId);
      if (stall === null) {
        throw new Error("A seller in your cart is no longer available");
      }
      if ((stall.depositPaidAmount ?? 0) < SELLER_DEPOSIT_AMOUNT) {
        throw new Error("A stall in your cart is not accepting orders until its deposit is fully approved.");
      }

      const lineItems: Doc<"orders">["items"] = [];
      let subtotal = 0;
      for (const item of items) {
        const product = await ctx.db.get("products", item.productId);
        if (product === null || !product.isActive) {
          throw new Error("An item in your cart is no longer available");
        }
        if (product.stockQty < item.qty) {
          throw new Error(`Not enough stock for ${product.name}`);
        }
        subtotal += product.price * item.qty;
        lineItems.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          imageUrl: product.imageUrl,
          qty: item.qty,
        });
      }

      const deliveryFee = stall.deliveryFeePeso;
      const note = args.notes[stallId]?.trim();
      const sellerLocation = [
        stall.location.cityMunicipality,
        stall.location.province,
      ]
        .filter(Boolean)
        .join(", ");

      const orderId = await ctx.db.insert("orders", {
        buyerId: user._id,
        sellerId: stall.ownerId,
        stallId,
        sellerName: stall.stallName,
        sellerLocation,
        deliveryFeePeso: deliveryFee,
        items: lineItems,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        paymentMethod: args.paymentMethod,
        paymentStatus: args.paymentMethod === "gcash" ? "pending" : "unpaid",
        ...(args.paymentMethod === "gcash" ? {
          paymentReference,
        } : {}),
        address: args.address,
        ...(note ? { note } : {}),
        status: "pending",
        events: [{ status: "placed", label: "Order placed", at: now }],
        placedAt: now,
        updatedAt: now,
      });
      createdIds.push(orderId);
      await createNotification(ctx, {
        userId: stall.ownerId,
        role: "seller",
        orderId,
        type: "order_placed",
        title: "New order received",
        body: `Order #${orderId.slice(-6).toUpperCase()} placed by ${user.fullName} (${lineItems.length} item${lineItems.length > 1 ? "s" : ""} · ₱${(subtotal + deliveryFee).toLocaleString()}). Review and confirm the order.`,
      });
      await createNotification(ctx, {
        userId: user._id,
        role: "buyer",
        orderId,
        type: "order_placed",
        title: "Order placed successfully",
        body: `Your order #${orderId.slice(-6).toUpperCase()} with ${stall.stallName} (₱${(subtotal + deliveryFee).toLocaleString()}) has been placed.`,
      });
    }

    if (args.paymentMethod === "gcash") {
      const storedOrders: Doc<"orders">[] = [];
      for (const id of createdIds) {
        const order = await ctx.db.get("orders", id);
        if (order) storedOrders.push(order);
      }
      const now = new Date().toISOString();
      const expectedAmount = storedOrders.reduce((sum, order) => sum + order.total, 0);
      for (const order of storedOrders) {
        await ctx.db.patch("orders", order._id, {
          paymentNote,
          paymentSubmittedAt: now,
          submittedAt: now,
          attemptNumber: 1,
          paymentEvents: [{ type: "submitted", actorId: String(order.buyerId), actorRole: "buyer" as const, referenceNumber: order.paymentReference ?? "", expectedAmount, at: now }],
          paymentReviewEvents: [{ status: "pending", label: "Payment submitted", at: now }],
        });
      }
    }

    for (const item of cartItems) {
      await ctx.db.delete("cartItems", item._id);
    }

    const orders: Doc<"orders">[] = [];
    for (const id of createdIds) {
      const order = await ctx.db.get("orders", id);
      if (order !== null) orders.push(order);
    }
    return orders;
  },
});
export const resubmitGcashPayment = mutation({
  args: {
    orderId: v.id("orders"),
    paymentReference: v.string(),
  },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await getBuyerOrder(ctx, user._id, args.orderId);
    if (order.paymentMethod !== "gcash" || order.paymentStatus !== "rejected" || !order.paymentNote) {
      throw new Error("This GCash payment cannot be resubmitted.");
    }
    const paymentReference = args.paymentReference.trim().replace(/\s+/g, " ").toUpperCase();
    if (!paymentReference) {
      throw new Error("Enter a new GCash reference number.");
    }
    if (paymentReference.length < 4 || paymentReference.length > 40) {
      throw new Error("Enter a valid GCash reference number.");
    }
    if (paymentReference === order.paymentReference) {
      throw new Error("Enter the new reference number for the replacement transfer.");
    }
    const siblings = await ctx.db.query("orders")
      .withIndex("by_paymentNote", (q) => q.eq("paymentNote", order.paymentNote))
      .take(200);
    if (siblings.some((sibling) => sibling.buyerId !== user._id || sibling.paymentStatus !== "rejected" || sibling.status === "cancelled")) {
      throw new Error("The checkout payment group is not eligible for resubmission.");
    }
    const referenceGroups = await Promise.all((['pending', 'paid', 'rejected'] as const).map((status) => ctx.db.query("orders")
      .withIndex("by_paymentMethod_and_paymentStatus", (q) => q.eq("paymentMethod", "gcash").eq("paymentStatus", status)).take(1000)));
    const duplicateReference = referenceGroups.flat().some((candidate) => candidate.paymentReference?.trim().replace(/\s+/g, " ").toUpperCase() === paymentReference);
    if (duplicateReference) {
      throw new Error("This GCash reference number has already been submitted.");
    }
    const now = new Date().toISOString();
    const expectedAmount = siblings.reduce((sum, sibling) => sum + sibling.total, 0);
    for (const sibling of siblings) {
      await ctx.db.patch("orders", sibling._id, {
        paymentStatus: "pending",
        paymentReference,
        paymentSubmittedAt: now,
        submittedAt: now,
        attemptNumber: (sibling.attemptNumber ?? 1) + 1,
        paymentEvents: [
          ...(sibling.paymentEvents ?? [{ type: "submitted" as const, actorId: String(user._id), actorRole: "buyer" as const, referenceNumber: sibling.paymentReference ?? "", expectedAmount, at: sibling.submittedAt ?? sibling.paymentSubmittedAt ?? sibling.placedAt }]),
          { type: "resubmitted" as const, actorId: String(user._id), actorRole: "buyer" as const, referenceNumber: paymentReference, expectedAmount, at: now },
        ],
        paymentRejectionReason: undefined,
        paymentReviewEvents: [
          ...(sibling.paymentReviewEvents ?? []),
          { status: "pending", label: "Payment proof resubmitted", at: now },
        ],
        updatedAt: now,
      });
    }
    return null;
  },
});

export const getPublicGcashSettings = query({
  args: {},
  async handler(ctx) {
    const settings = await ctx.db.query("gcashSettings")
      .withIndex("by_key", (q) => q.eq("key", "primary"))
      .first();
    return settings ? { qrUrl: settings.qrUrl, number: settings.number } : null;
  },
});

export const listMyOrders = query({
  args: {},
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (user === null) return [];
    return await ctx.db
      .query("orders")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", user._id))
      .order("desc")
      .take(BUYER_ORDER_LIMIT);
  },
});

export const getMyOrder = query({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    const order = await ctx.db.get("orders", args.orderId);
    if (order === null || order.buyerId !== user._id) return null;
    return order;
  },
});

export const listSellerOrders = query({
  args: {},
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (user === null) return [];
    return await ctx.db
      .query("orders")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
      .order("desc")
      .take(SELLER_ORDER_LIMIT);
  },
});

export const getSellerOrder = query({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    const order = await ctx.db.get("orders", args.orderId);
    if (order === null || order.sellerId !== user._id) return null;
    return order;
  },
});

export const cancelOrder = mutation({
  args: { orderId: v.id("orders"), reason: v.optional(v.string()) },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await getBuyerOrder(ctx, user._id, args.orderId);
    assertStatus(order, "pending");
    if (order.paymentMethod === "gcash") {
      throw new Error("GCash orders cannot be cancelled while payment approval and refunds are handled by support.");
    }

    await restoreStock(ctx, order);
    const now = new Date().toISOString();
    const reason = args.reason?.trim();
    await ctx.db.patch("orders", order._id, {
      status: "cancelled",
      cancelledAt: now,
      events: [
        ...order.events,
        { status: "cancelled", label: "Order cancelled", at: now },
      ],
      ...(reason ? { cancelReason: reason } : {}),
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "order_cancelled",
      title: "Order cancelled by buyer",
      body: `Buyer cancelled order #${order._id.slice(-6).toUpperCase()}${reason ? `: "${reason}"` : "."}`,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "order_cancelled",
      title: "Order cancelled",
      body: `You cancelled order #${order._id.slice(-6).toUpperCase()}.`,
    });
    return null;
  },
});

export const confirmDelivery = mutation({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await getBuyerOrder(ctx, user._id, args.orderId);
    assertStatus(order, "to-receive");

      const now = new Date().toISOString();
      await ctx.db.patch("orders", order._id, {
        status: "completed",
        ...(order.paymentMethod === "cod" ? { paymentStatus: "paid" as const } : {}),
        deliveredAt: now,
        completedAt: now,
        events: [
          ...order.events,
          { status: "delivered", label: order.paymentMethod === "cod" ? "Delivered · payment received" : "Delivery confirmed", at: now },
          { status: "completed", label: "Buyer confirmed receipt · order completed", at: now },
        ],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "order_completed",
      title: "Order completed",
      body: `Buyer confirmed delivery for order #${order._id.slice(-6).toUpperCase()}. Payment recorded.`,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "order_completed",
      title: "Order completed",
      body: `You confirmed delivery for order #${order._id.slice(-6).toUpperCase()}. Thank you!`,
    });
    if (order.paymentMethod === "cod") await ctx.runMutation(accrueCodDeliveryRef, { orderId: order._id });
    return null;
  },
});

export const confirmOrder = mutation({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await requireSellerOrder(ctx, user._id, args.orderId);
    assertStatus(order, "pending");
    if (order.paymentMethod === "gcash" && order.paymentStatus !== "paid") {
      throw new Error("GCash payment must be approved before this order can be confirmed.");
    }

    const reserved: Array<{ product: Doc<"products">; qty: number }> = [];
    for (const item of order.items) {
      const product = await ctx.db.get("products", item.productId);
      if (product === null || product.stockQty < item.qty) {
        throw new Error(`Not enough stock for ${item.name}`);
      }
      reserved.push({ product, qty: item.qty });
    }

    const now = new Date().toISOString();
    for (const { product, qty } of reserved) {
      await ctx.db.patch("products", product._id, {
        stockQty: product.stockQty - qty,
        soldCount: product.soldCount + qty,
        updatedAt: now,
      });
    }

    await ctx.db.patch("orders", order._id, {
      status: "confirmed",
      confirmedAt: now,
      events: [
        ...order.events,
        { status: "confirmed", label: "Order confirmed", at: now },
      ],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "order_confirmed",
      title: "Order confirmed",
      body: `${order.sellerName} confirmed order #${order._id.slice(-6).toUpperCase()}. Your items are being prepared.`,
    });
    return null;
  },
});

export const rejectOrder = mutation({
  args: { orderId: v.id("orders"), reason: v.optional(v.string()) },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await requireSellerOrder(ctx, user._id, args.orderId);
    assertStatus(order, "pending");

    await restoreStock(ctx, order);
    const now = new Date().toISOString();
    const reason = args.reason?.trim();
    await ctx.db.patch("orders", order._id, {
      status: "cancelled",
      cancelledAt: now,
      events: [
        ...order.events,
        { status: "cancelled", label: "Order rejected", at: now },
      ],
      ...(reason ? { cancelReason: reason } : {}),
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "order_cancelled",
      title: "Order rejected",
      body: `${order.sellerName} rejected order #${order._id.slice(-6).toUpperCase()}${reason ? `: "${reason}"` : "."}`,
    });
    return null;
  },
});

export const dispatchOrder = mutation({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await requireSellerOrder(ctx, user._id, args.orderId);
    assertStatus(order, "confirmed");

    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "to-receive",
      toReceiveAt: now,
      events: [
        ...order.events,
        { status: "to-receive", label: "Out for delivery", at: now },
      ],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "order_dispatched",
      title: "Order out for delivery",
      body: `Order #${order._id.slice(-6).toUpperCase()} from ${order.sellerName} is out for delivery!`,
    });
    return null;
  },
});

export const completeOrder = mutation({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await requireSellerOrder(ctx, user._id, args.orderId);
    assertStatus(order, "delivered");

    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "completed",
      completedAt: now,
      events: [
        ...order.events,
        { status: "completed", label: "Order completed", at: now },
      ],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "order_completed",
      title: "Order completed",
      body: `Order #${order._id.slice(-6).toUpperCase()} from ${order.sellerName} has been completed.`,
    });
    return null;
  },
});

export const requestRefund = mutation({
  args: { orderId: v.id("orders"), reason: v.string(), evidenceUrls: v.array(v.string()) },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await getBuyerOrder(ctx, user._id, args.orderId);
    if (order.status !== "delivered" && order.status !== "completed") {
      throw new Error("You can only request a refund for delivered orders");
    }
    const deliveredAt = Date.parse(order.deliveredAt ?? "");
    if (!Number.isFinite(deliveredAt) || Date.now() - deliveredAt > RETURN_REQUEST_WINDOW_MS) {
      throw new Error(RETURN_WINDOW_CLOSED_MESSAGE);
    }
    const reason = args.reason.trim();
    if (reason.length < 10) throw new Error("Please provide a reason with at least 10 characters");
    if (reason.length > 500) throw new Error("Reason is too long (max 500 characters)");
    if (args.evidenceUrls.length < 1 || args.evidenceUrls.length > 5) {
      throw new Error("Please attach between 1 and 5 photos or videos");
    }
    if (args.evidenceUrls.some((url) => !url.startsWith("https://res.cloudinary.com/"))) {
      throw new Error("Refund evidence must be uploaded before submitting");
    }

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status: "refund-requested",
      refundReason: reason,
      refundEvidenceUrls: args.evidenceUrls,
      refundPayoutHold: true,
      returnFromStatus: order.status,
      refundRequestedAt: now,
      events: [
        ...order.events,
        { status: "refund-requested", label: "Return requested", at: now },
      ],
      updatedAt: now,
    };
    // Clear previous rejection state for a fresh request
    if (order.refundRejectedAt !== undefined) patch["refundRejectedAt"] = undefined;
    if (order.refundRejectReason !== undefined) patch["refundRejectReason"] = undefined;
    await ctx.db.patch("orders", order._id, patch as never);
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "refund_requested",
      title: "Return requested",
      body: `Buyer requested a return for order #${order._id.slice(-6).toUpperCase()}: "${reason}".`,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "refund_requested",
      title: "Return request submitted",
      body: `Your return request for order #${order._id.slice(-6).toUpperCase()} was submitted for admin review.`,
    });
    return null;
  },
});

export const submitReturnShipment = mutation({
  args: {
    orderId: v.id("orders"),
    carrier: v.string(),
    trackingNumber: v.string(),
  },
  returns: v.null(),
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await getBuyerOrder(ctx, user._id, args.orderId);
    assertStatus(order, "return-approved");
    const carrier = args.carrier.trim();
    const trackingNumber = args.trackingNumber.trim();
    if (carrier.length < 2 || carrier.length > 80) throw new Error("Enter a carrier name between 2 and 80 characters");
    if (trackingNumber.length < 3 || trackingNumber.length > 100) throw new Error("Enter a tracking number between 3 and 100 characters");

    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "return-in-transit",
      returnCarrier: carrier,
      returnTrackingNumber: trackingNumber,
      returnShippedAt: now,
      events: [...order.events, { status: "return-in-transit", label: "Return shipment sent", at: now }],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.sellerId,
      role: "seller",
      orderId: order._id,
      type: "return_in_transit",
      title: "Return items shipped",
      body: `Buyer shipped return items for order #${order._id.slice(-6).toUpperCase()} via ${carrier} (Tracking: ${trackingNumber}).`,
    });
    return null;
  },
});

export const confirmReturnReceived = mutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await requireSellerOrder(ctx, user._id, args.orderId);
    assertStatus(order, "return-in-transit");
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "return-received",
      returnReceivedAt: now,
      events: [...order.events, { status: "return-received", label: "Seller received returned goods", at: now }],
      updatedAt: now,
    });
    await createNotification(ctx, {
      userId: order.buyerId,
      role: "buyer",
      orderId: order._id,
      type: "return_received",
      title: "Returned items received",
      body: `${order.sellerName} received your returned items for order #${order._id.slice(-6).toUpperCase()}. Refund will be processed soon.`,
    });
    return null;
  },
});
