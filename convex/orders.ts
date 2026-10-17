import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { deliveryAddressValidator } from "./shared";

const BUYER_ORDER_LIMIT = 100;
const SELLER_ORDER_LIMIT = 200;
const CART_ITEM_LIMIT = 200;

type OrderStatus =
  | "pending"
  | "confirmed"
  | "to-receive"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refund-requested"
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
  },
  async handler(ctx, args) {
    const user = await requireUser(ctx);

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(CART_ITEM_LIMIT);
    if (cartItems.length === 0) throw new Error("Your cart is empty");

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
        paymentMethod: "cod",
        paymentStatus: "unpaid",
        address: args.address,
        ...(note ? { note } : {}),
        status: "pending",
        events: [{ status: "placed", label: "Order placed", at: now }],
        placedAt: now,
        updatedAt: now,
      });
      createdIds.push(orderId);
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
      status: "delivered",
      paymentStatus: "paid",
      deliveredAt: now,
      events: [
        ...order.events,
        { status: "delivered", label: "Delivered · payment received", at: now },
      ],
      updatedAt: now,
    });
    return null;
  },
});

export const confirmOrder = mutation({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await requireSellerOrder(ctx, user._id, args.orderId);
    assertStatus(order, "pending");

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
    return null;
  },
});

export const requestRefund = mutation({
  args: { orderId: v.id("orders"), reason: v.string() },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await getBuyerOrder(ctx, user._id, args.orderId);
    if (order.status !== "delivered") {
      throw new Error("You can only request a refund for delivered orders");
    }
    const reason = args.reason.trim();
    if (reason.length < 10) throw new Error("Please provide a reason with at least 10 characters");
    if (reason.length > 500) throw new Error("Reason is too long (max 500 characters)");

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status: "refund-requested",
      refundReason: reason,
      refundRequestedAt: now,
      events: [
        ...order.events,
        { status: "refund-requested", label: "Refund requested", at: now },
      ],
      updatedAt: now,
    };
    // Clear previous rejection state for a fresh request
    if (order.refundRejectedAt !== undefined) patch["refundRejectedAt"] = undefined;
    if (order.refundRejectReason !== undefined) patch["refundRejectReason"] = undefined;
    await ctx.db.patch("orders", order._id, patch as never);
    return null;
  },
});

export const approveRefund = mutation({
  args: { orderId: v.id("orders") },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await requireSellerOrder(ctx, user._id, args.orderId);
    assertStatus(order, "refund-requested");

    await restoreStock(ctx, order);
    const now = new Date().toISOString();
    await ctx.db.patch("orders", order._id, {
      status: "refunded",
      refundConfirmedAt: now,
      events: [
        ...order.events,
        { status: "refunded", label: "Refund approved", at: now },
      ],
      updatedAt: now,
    });
    return null;
  },
});

export const rejectRefund = mutation({
  args: { orderId: v.id("orders"), reason: v.optional(v.string()) },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const order = await requireSellerOrder(ctx, user._id, args.orderId);
    assertStatus(order, "refund-requested");

    const now = new Date().toISOString();
    const reason = args.reason?.trim();
    const patch: Record<string, unknown> = {
      status: "delivered",
      refundRejectedAt: now,
      events: [
        ...order.events,
        { status: "refund-rejected", label: "Refund rejected", at: now },
      ],
      updatedAt: now,
    };
    if (reason) patch["refundRejectReason"] = reason;
    else if (order.refundRejectReason !== undefined) patch["refundRejectReason"] = undefined;
    await ctx.db.patch("orders", order._id, patch as never);
    return null;
  },
});
