import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) return null;
  return await ctx.db.query("users")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .first();
}

async function requireUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (user === null) throw new Error("Not authenticated");
  return user;
}

function hasAccess(conversation: Doc<"conversations">, userId: Id<"users">) {
  return conversation.buyerId === userId || conversation.sellerId === userId;
}

export const listMine = query({
  args: {},
  returns: v.array(v.object({
    conversation: v.object({
      _id: v.id("conversations"), _creationTime: v.number(), buyerId: v.id("users"),
      sellerId: v.id("users"), stallId: v.id("stalls"), orderId: v.optional(v.id("orders")),
      buyerLastReadAt: v.optional(v.string()), sellerLastReadAt: v.optional(v.string()),
      buyerUnreadCount: v.optional(v.number()), sellerUnreadCount: v.optional(v.number()), updatedAt: v.string(),
    }),
    partnerName: v.string(),
    stallName: v.string(),
    lastMessage: v.union(v.null(), v.object({ body: v.string(), createdAt: v.string() })),
    unreadCount: v.number(),
  })),
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (user === null) return [];
    const conversations = user.role === "buyer"
      ? await ctx.db.query("conversations").withIndex("by_buyerId", (q) => q.eq("buyerId", user._id)).order("desc").take(100)
      : await ctx.db.query("conversations").withIndex("by_sellerId", (q) => q.eq("sellerId", user._id)).order("desc").take(100);
    const result = [];
    for (const conversation of conversations) {
      const partnerId = user.role === "buyer" ? conversation.sellerId : conversation.buyerId;
      const [partner, stall, latest] = await Promise.all([
        ctx.db.get("users", partnerId),
        ctx.db.get("stalls", conversation.stallId),
        ctx.db.query("messages").withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id)).order("desc").first(),
      ]);
      const unreadCount = user.role === "buyer" ? conversation.buyerUnreadCount ?? 0 : conversation.sellerUnreadCount ?? 0;
      result.push({ conversation, partnerName: partner?.fullName ?? "Marketplace member", stallName: stall?.stallName ?? "Shop", lastMessage: latest ? { body: latest.body, createdAt: latest.createdAt } : null, unreadCount });
    }
    return result;
  },
});

export const getThread = query({
  args: { conversationId: v.id("conversations") },
  returns: v.union(v.null(), v.object({
    conversation: v.object({
      _id: v.id("conversations"), _creationTime: v.number(), buyerId: v.id("users"),
      sellerId: v.id("users"), stallId: v.id("stalls"), orderId: v.optional(v.id("orders")),
      buyerLastReadAt: v.optional(v.string()), sellerLastReadAt: v.optional(v.string()),
      buyerUnreadCount: v.optional(v.number()), sellerUnreadCount: v.optional(v.number()), updatedAt: v.string(),
    }),
    partnerName: v.string(), stallName: v.string(),
    orderSummary: v.optional(v.object({
      _id: v.id("orders"),
      status: v.string(),
      total: v.number(),
      itemsCount: v.number(),
      firstItemName: v.string(),
      placedAt: v.string(),
    })),
    messages: v.array(v.object({ _id: v.id("messages"), _creationTime: v.number(), conversationId: v.id("conversations"), senderId: v.id("users"), senderName: v.string(), body: v.string(), createdAt: v.string() })),
  })),
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (conversation === null || !hasAccess(conversation, user._id)) return null;
    const partnerId = user._id === conversation.buyerId ? conversation.sellerId : conversation.buyerId;
    const [partner, stall, messages, order] = await Promise.all([
      ctx.db.get("users", partnerId), ctx.db.get("stalls", conversation.stallId),
      ctx.db.query("messages").withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id)).order("asc").take(200),
      conversation.orderId ? ctx.db.get("orders", conversation.orderId) : Promise.resolve(null),
    ]);
    const stallName = stall?.stallName ?? "Shop";
    const displayMessages = messages.map((item) => ({
      ...item,
      senderName: item.senderId === conversation.sellerId ? stallName : item.senderName,
    }));
    const orderSummary = order
      ? {
          _id: order._id,
          status: order.status,
          total: order.total,
          itemsCount: order.items.length,
          firstItemName: order.items[0]?.name ?? "Farm produce",
          placedAt: order.placedAt,
        }
      : undefined;
    return {
      conversation,
      partnerName: partner?.fullName ?? "Marketplace member",
      stallName,
      orderSummary,
      messages: displayMessages,
    };
  },
});

export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (conversation === null || !hasAccess(conversation, user._id)) throw new Error("Conversation not found");
    const now = new Date().toISOString();
    await ctx.db.patch(conversation._id, user._id === conversation.buyerId
      ? { buyerLastReadAt: now, buyerUnreadCount: 0 }
      : { sellerLastReadAt: now, sellerUnreadCount: 0 });
    return null;
  },
});

export const startConversation = mutation({
  args: { stallId: v.id("stalls"), orderId: v.optional(v.id("orders")) },
  returns: v.id("conversations"),
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const stall = await ctx.db.get("stalls", args.stallId);
    if (stall === null) throw new Error("Shop not found");
    let buyerId = user._id;
    let sellerId = stall.ownerId;
    if (args.orderId) {
      const order = await ctx.db.get("orders", args.orderId);
      if (order === null || order.stallId !== stall._id || (order.buyerId !== user._id && order.sellerId !== user._id)) throw new Error("Order not found");
      buyerId = order.buyerId;
      sellerId = order.sellerId;
    } else if (user.role !== "buyer" || stall.ownerId === user._id) {
      throw new Error("Only buyers can start a shop conversation");
    }
    const existing = await ctx.db.query("conversations")
      .withIndex("by_buyerId_and_sellerId", (q) => q.eq("buyerId", buyerId).eq("sellerId", sellerId))
      .first();
    const now = new Date().toISOString();
    if (existing) {
      await ctx.db.patch(existing._id, { stallId: stall._id, ...(args.orderId ? { orderId: args.orderId } : {}), updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("conversations", {
      buyerId, sellerId, stallId: stall._id,
      ...(args.orderId ? { orderId: args.orderId } : {}), updatedAt: now,
    });
  },
});

export const sendMessage = mutation({
  args: { conversationId: v.id("conversations"), body: v.string() },
  returns: v.id("messages"),
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (conversation === null || !hasAccess(conversation, user._id)) throw new Error("Conversation not found");
    const body = args.body.trim();
    if (!body || body.length > 2000) throw new Error("Message must be between 1 and 2,000 characters");
    const now = new Date().toISOString();
    const messageId = await ctx.db.insert("messages", { conversationId: conversation._id, senderId: user._id, senderName: user.fullName, body, createdAt: now });
    await ctx.db.patch(conversation._id, user._id === conversation.buyerId
      ? { updatedAt: now, sellerUnreadCount: (conversation.sellerUnreadCount ?? 0) + 1 }
      : { updatedAt: now, buyerUnreadCount: (conversation.buyerUnreadCount ?? 0) + 1 });
    return messageId;
  },
});
