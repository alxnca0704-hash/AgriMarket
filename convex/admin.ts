import { v } from "convex/values";
import { ADMIN_EMAIL } from "../constants/roles";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const settingsValidator = v.union(
  v.null(),
  v.object({
    qrUrl: v.string(),
    number: v.string(),
    updatedAt: v.string(),
  })
);

async function requireAdminEmail(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || identity.email?.toLowerCase() !== ADMIN_EMAIL || identity.emailVerified !== true) {
    throw new Error("Not authorized");
  }
  return identity.email.toLowerCase();
}

export const getGcashSettings = query({
  args: {},
  returns: settingsValidator,
  async handler(ctx) {
    await requireAdminEmail(ctx);
    const settings = await ctx.db
      .query("gcashSettings")
      .withIndex("by_key", (q) => q.eq("key", "primary"))
      .first();
    return settings
      ? { qrUrl: settings.qrUrl, number: settings.number, updatedAt: settings.updatedAt }
      : null;
  },
});

export const updateGcashSettings = mutation({
  args: { qrUrl: v.string(), number: v.string() },
  returns: v.null(),
  async handler(ctx, args) {
    const actorEmail = await requireAdminEmail(ctx);
    const number = args.number.trim();
    const normalizedNumber = number.replace(/[\s-]/g, "");
    if (!/^(\+?63|0)?9\d{9}$/.test(normalizedNumber)) {
      throw new Error("Enter a valid Philippine mobile number.");
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(args.qrUrl);
    } catch {
      throw new Error("Upload a valid QR image before saving.");
    }
    if (parsedUrl.protocol !== "https:") {
      throw new Error("The QR image must use a secure URL.");
    }

    const current = await ctx.db
      .query("gcashSettings")
      .withIndex("by_key", (q) => q.eq("key", "primary"))
      .first();
    const now = new Date().toISOString();
    if (current) {
      await ctx.db.patch("gcashSettings", current._id, {
        qrUrl: args.qrUrl,
        number,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("gcashSettings", {
        key: "primary",
        qrUrl: args.qrUrl,
        number,
        updatedAt: now,
      });
    }
    await ctx.db.insert("adminAuditLog", {
      actorEmail,
      action: "gcash_settings_updated",
      ...(current ? { previousNumber: current.number, previousQrUrl: current.qrUrl } : {}),
      nextNumber: number,
      nextQrUrl: args.qrUrl,
      createdAt: now,
    });
    return null;
  },
});
