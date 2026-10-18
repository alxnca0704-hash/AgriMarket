import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

const DEFAULT_NOTIFICATION_LIMIT = 50;
const MAX_UNREAD_SCAN = 100;

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

/**
 * Internal helper to create a persistent notification in the database.
 * Used by order and admin mutations to notify buyers and sellers.
 */
export async function createNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    role: "buyer" | "seller";
    orderId?: Id<"orders">;
    type: string;
    title: string;
    body: string;
  }
): Promise<Id<"notifications">> {
  const now = new Date().toISOString();
  return await ctx.db.insert("notifications", {
    userId: args.userId,
    role: args.role,
    orderId: args.orderId,
    type: args.type,
    title: args.title,
    body: args.body,
    read: false,
    createdAt: now,
  });
}

/**
 * List the current user's notifications ordered newest first.
 */
export const listMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
    role: v.optional(v.union(v.literal("buyer"), v.literal("seller"))),
  },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) return [];

    const limit = args.limit ?? DEFAULT_NOTIFICATION_LIMIT;
    const items = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit * 2);

    if (args.role !== undefined) {
      return items.filter((item) => item.role === args.role).slice(0, limit);
    }
    return items.slice(0, limit);
  },
});

/**
 * Get count of unread notifications for current user.
 */
export const getUnreadNotificationCount = query({
  args: {
    role: v.optional(v.union(v.literal("buyer"), v.literal("seller"))),
  },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .take(MAX_UNREAD_SCAN);

    if (args.role !== undefined) {
      return unread.filter((item) => item.role === args.role).length;
    }
    return unread.length;
  },
});

/**
 * Mark a single notification as read.
 */
export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const notification = await ctx.db.get("notifications", args.notificationId);
    if (notification === null || notification.userId !== user._id) {
      return null;
    }
    if (!notification.read) {
      await ctx.db.patch("notifications", notification._id, { read: true });
    }
    return null;
  },
});

/**
 * Mark all notifications as read for current user.
 */
export const markAllNotificationsRead = mutation({
  args: {
    role: v.optional(v.union(v.literal("buyer"), v.literal("seller"))),
  },
  async handler(ctx, args) {
    const user = await requireUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .take(MAX_UNREAD_SCAN);

    const targets =
      args.role !== undefined
        ? unread.filter((item) => item.role === args.role)
        : unread;

    for (const item of targets) {
      await ctx.db.patch("notifications", item._id, { read: true });
    }
    return null;
  },
});
