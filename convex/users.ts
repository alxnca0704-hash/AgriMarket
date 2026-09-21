import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { addressValidator } from "./shared";

const roleValidator = v.union(v.literal("buyer"), v.literal("seller"));

async function getIdentity(ctx: QueryCtx | MutationCtx) {
  return await ctx.auth.getUserIdentity();
}

async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
  identityTokenIdentifier: string
): Promise<Doc<"users"> | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identityTokenIdentifier)
    )
    .first();
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

async function clearDefaultAddresses(ctx: MutationCtx, userId: Id<"users">) {
  const addresses = await ctx.db
    .query("addresses")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  for (const address of addresses) {
    if (address.isDefault) {
      await ctx.db.patch("addresses", address._id, { isDefault: false });
    }
  }
}

export const getCurrent = query({
  args: {},
  async handler(ctx) {
    const identity = await getIdentity(ctx);
    if (identity === null) return null;
    const user = await getCurrentUser(ctx, identity.tokenIdentifier);
    if (user === null) return null;
    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("asc")
      .take(100);
    const stall = await ctx.db
      .query("stalls")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    return {
      user,
      addresses,
      stall: stall ?? null,
      email: identity.email ?? null,
    };
  },
});

export const completeOnboarding = mutation({
  args: {
    role: roleValidator,
    fullName: v.string(),
    mobileNumber: v.string(),
    address: v.optional(addressValidator),
  },
  async handler(ctx, args) {
    const identity = await getIdentity(ctx);
    if (identity === null) throw new Error("Not authenticated");

    const now = new Date().toISOString();
    const trimmedName = args.fullName.trim();
    const { firstName, lastName } = splitFullName(trimmedName);
    const basePatch = {
      role: args.role,
      fullName: trimmedName,
      firstName,
      lastName,
      mobileNumber: args.mobileNumber.trim(),
      updatedAt: now,
    };
    let user = await getCurrentUser(ctx, identity.tokenIdentifier);
    if (user === null) {
      const id = await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        clerkId: identity.subject,
        role: args.role,
        fullName: trimmedName,
        firstName,
        lastName,
        mobileNumber: args.mobileNumber.trim(),
        ...(identity.email ? { email: identity.email } : {}),
        ...(identity.pictureUrl ? { photoUrl: identity.pictureUrl } : {}),
        updatedAt: now,
      });
      user = await ctx.db.get("users", id);
    } else {
      await ctx.db.patch("users", user._id, {
        ...basePatch,
        ...(identity.email ? { email: identity.email } : {}),
        ...(identity.pictureUrl ? { photoUrl: identity.pictureUrl } : {}),
      });
    }

    if (user === null) throw new Error("Failed to create user");

    let addressId: Id<"addresses"> | null = null;
    if (args.address) {
      const existing = await ctx.db
        .query("addresses")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      const shouldDefault = args.address.isDefault || existing === null;
      if (shouldDefault) {
        await clearDefaultAddresses(ctx, user._id);
      }
      addressId = await ctx.db.insert("addresses", {
        userId: user._id,
        ...args.address,
        isDefault: shouldDefault,
      });
    }

    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("asc")
      .take(100);

    return {
      user,
      addresses,
      defaultAddressId: addressId,
    };
  },
});

export const updateProfile = mutation({
  args: {
    fullName: v.string(),
    mobileNumber: v.string(),
  },
  async handler(ctx, args) {
    const identity = await getIdentity(ctx);
    if (identity === null) throw new Error("Not authenticated");
    const user = await getCurrentUser(ctx, identity.tokenIdentifier);
    if (user === null) throw new Error("Profile not found");

    const trimmedName = args.fullName.trim();
    const { firstName, lastName } = splitFullName(trimmedName);
    await ctx.db.patch("users", user._id, {
      fullName: trimmedName,
      firstName,
      lastName,
      mobileNumber: args.mobileNumber.trim(),
      updatedAt: new Date().toISOString(),
    });
    return null;
  },
});

export const setRole = mutation({
  args: { role: roleValidator },
  async handler(ctx, args) {
    const identity = await getIdentity(ctx);
    if (identity === null) throw new Error("Not authenticated");
    let user = await getCurrentUser(ctx, identity.tokenIdentifier);
    if (user === null) {
      const trimmedName = identity.name?.trim() || "";
      const { firstName, lastName } = splitFullName(trimmedName);
      const id = await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        clerkId: identity.subject,
        role: args.role,
        fullName: trimmedName,
        firstName,
        lastName,
        mobileNumber: "",
        ...(identity.email ? { email: identity.email } : {}),
        ...(identity.pictureUrl ? { photoUrl: identity.pictureUrl } : {}),
        updatedAt: new Date().toISOString(),
      });
      user = await ctx.db.get("users", id);
    } else {
      await ctx.db.patch("users", user._id, {
        role: args.role,
        updatedAt: new Date().toISOString(),
      });
    }
    return user?._id ?? null;
  },
});

export const addAddress = mutation({
  args: { address: addressValidator },
  async handler(ctx, args) {
    const identity = await getIdentity(ctx);
    if (identity === null) throw new Error("Not authenticated");
    const user = await getCurrentUser(ctx, identity.tokenIdentifier);
    if (user === null) throw new Error("Profile not found");

    const existing = await ctx.db
      .query("addresses")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    const shouldDefault = args.address.isDefault || existing === null;
    if (shouldDefault) {
      await clearDefaultAddresses(ctx, user._id);
    }
    return await ctx.db.insert("addresses", {
      userId: user._id,
      ...args.address,
      isDefault: shouldDefault,
    });
  },
});

export const updateAddress = mutation({
  args: {
    addressId: v.id("addresses"),
    address: addressValidator,
  },
  async handler(ctx, args) {
    const identity = await getIdentity(ctx);
    if (identity === null) throw new Error("Not authenticated");
    const user = await getCurrentUser(ctx, identity.tokenIdentifier);
    if (user === null) throw new Error("Profile not found");

    const current = await ctx.db.get("addresses", args.addressId);
    if (current === null || current.userId !== user._id) {
      throw new Error("Address not found");
    }

    if (args.address.isDefault && !current.isDefault) {
      await clearDefaultAddresses(ctx, user._id);
    }
    await ctx.db.patch("addresses", args.addressId, args.address);
    return null;
  },
});

export const removeAddress = mutation({
  args: { addressId: v.id("addresses") },
  async handler(ctx, args) {
    const identity = await getIdentity(ctx);
    if (identity === null) throw new Error("Not authenticated");
    const user = await getCurrentUser(ctx, identity.tokenIdentifier);
    if (user === null) throw new Error("Profile not found");

    const current = await ctx.db.get("addresses", args.addressId);
    if (current === null || current.userId !== user._id) {
      throw new Error("Address not found");
    }

    if (!current.isDefault) {
      await ctx.db.delete("addresses", args.addressId);
      return null;
    }

    await ctx.db.delete("addresses", args.addressId);
    const remaining = await ctx.db
      .query("addresses")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("asc")
      .take(1);
    if (remaining.length > 0) {
      await ctx.db.patch("addresses", remaining[0]._id, { isDefault: true });
    }
    return null;
  },
});

export const setDefaultAddress = mutation({
  args: { addressId: v.id("addresses") },
  async handler(ctx, args) {
    const identity = await getIdentity(ctx);
    if (identity === null) throw new Error("Not authenticated");
    const user = await getCurrentUser(ctx, identity.tokenIdentifier);
    if (user === null) throw new Error("Profile not found");

    const current = await ctx.db.get("addresses", args.addressId);
    if (current === null || current.userId !== user._id) {
      throw new Error("Address not found");
    }

    await clearDefaultAddresses(ctx, user._id);
    await ctx.db.patch("addresses", args.addressId, { isDefault: true });
    return null;
  },
});