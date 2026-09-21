import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { stallInputValidator } from "./shared";

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

export const getMyStall = query({
  args: {},
  async handler(ctx) {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    const stall = await ctx.db
      .query("stalls")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    return stall ?? null;
  },
});

export const createStall = mutation({
  args: { stall: stallInputValidator },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stalls")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (existing !== null) {
      throw new Error("Stall already exists for this user");
    }

    const now = new Date().toISOString();
    const { idType, idNumber, ...stall } = args.stall;
    const id = await ctx.db.insert("stalls", {
      ownerId: user._id,
      ...stall,
      verification: {
        status: "pending",
        idType: idType.trim() || "Barangay Clearance",
        idNumber: idNumber.trim(),
      },
      rating: 0,
      ratingCount: 0,
      updatedAt: now,
    });

    if (user.role !== "seller") {
      await ctx.db.patch("users", user._id, {
        role: "seller",
        updatedAt: now,
      });
    }

    return await ctx.db.get("stalls", id);
  },
});

export const updateStall = mutation({
  args: {
    stallId: v.id("stalls"),
    stall: stallInputValidator,
  },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx);
    if (user === null) throw new Error("Not authenticated");

    const current = await ctx.db.get("stalls", args.stallId);
    if (current === null || current.ownerId !== user._id) {
      throw new Error("Stall not found");
    }

    await ctx.db.patch("stalls", args.stallId, {
      stallName: args.stall.stallName.trim(),
      description: args.stall.description.trim(),
      photoUrl: args.stall.photoUrl.trim(),
      farmType: args.stall.farmType,
      location: args.stall.location,
      deliveryFeePeso: args.stall.deliveryFeePeso,
      pickupAvailable: args.stall.pickupAvailable,
      verification: {
        ...current.verification,
        idType: args.stall.idType.trim() || current.verification.idType,
        idNumber: args.stall.idNumber.trim(),
      },
      updatedAt: new Date().toISOString(),
    });

    const updated = await ctx.db.get("stalls", args.stallId);
    return updated ?? current;
  },
});