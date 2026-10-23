import { v } from "convex/values";
import { DEPOSIT_GRACE_PERIOD_MS, SELLER_DEPOSIT_AMOUNT } from "../constants/deposits";
import { ADMIN_EMAIL } from "../constants/roles";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { createNotification } from "./notifications";

async function currentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db.query("users").withIndex("by_token_identifier", q => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
}

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || identity.email?.toLowerCase() !== ADMIN_EMAIL || identity.emailVerified !== true) throw new Error("Not authorized");
  return identity.email.toLowerCase();
}

function approvedTotal(deposits: Array<{ status: string; approvedAmount?: number }>) {
  return deposits.reduce((sum, deposit) => sum + (deposit.status === "approved" ? deposit.approvedAmount ?? 0 : 0), 0);
}

export const getSellerDeposit = query({
  args: {},
  returns: v.union(v.null(), v.object({ stall: v.any(), submissions: v.array(v.any()), gcash: v.union(v.null(), v.object({ qrUrl: v.string(), number: v.string() })) })),
  async handler(ctx) {
    const user = await currentUser(ctx);
    if (!user) return null;
    const stall = await ctx.db.query("stalls").withIndex("by_ownerId", q => q.eq("ownerId", user._id)).first();
    if (!stall) return null;
    const submissions = await ctx.db.query("stallDeposits").withIndex("by_stallId", q => q.eq("stallId", stall._id)).order("desc").take(100);
    const gcash = await ctx.db.query("gcashSettings").withIndex("by_key", q => q.eq("key", "primary")).first();
    const total = stall.depositPaidAmount ?? approvedTotal(submissions);
    const status = total >= SELLER_DEPOSIT_AMOUNT ? "paid" : total > 0 ? "partial" : "unpaid";
    const deadline = stall.depositDeadline ?? Date.now() + 7 * 24 * 60 * 60 * 1000;
    return { stall: { ...stall, depositPaidAmount: total, depositStatus: status, depositDeadline: deadline, suspended: Date.now() > deadline && status !== "paid" }, submissions, gcash: gcash ? { qrUrl: gcash.qrUrl, number: gcash.number } : null };
  },
});

export const getPublicGcashSettings = query({
  args: {},
  returns: v.union(v.null(), v.object({ qrUrl: v.string(), number: v.string() })),
  async handler(ctx) {
    const settings = await ctx.db.query("gcashSettings").withIndex("by_key", q => q.eq("key", "primary")).first();
    return settings ? { qrUrl: settings.qrUrl, number: settings.number } : null;
  },
});

export const submit = mutation({
  args: { amount: v.number(), referenceNumber: v.string() },
  returns: v.id("stallDeposits"),
  async handler(ctx, args) {
    const user = await currentUser(ctx);
    if (!user || user.role !== "seller") throw new Error("Seller account required");
    const stall = await ctx.db.query("stalls").withIndex("by_ownerId", q => q.eq("ownerId", user._id)).first();
    if (!stall) throw new Error("Create your stall before submitting a deposit");
    const submissions = await ctx.db.query("stallDeposits").withIndex("by_stallId", q => q.eq("stallId", stall._id)).take(200);
    if ((await ctx.db.query("stallDeposits").withIndex("by_status", q => q.eq("status", "pending")).take(1000)).some(item => item.stallId === stall._id)) throw new Error("You already have a deposit awaiting review");
    const remaining = Math.max(0, SELLER_DEPOSIT_AMOUNT - (stall.depositPaidAmount ?? approvedTotal(submissions)));
    if (!Number.isFinite(args.amount) || args.amount <= 0 || args.amount > remaining) throw new Error(`Amount must be greater than zero and no more than ₱${remaining.toLocaleString()}.`);
    const referenceNumber = args.referenceNumber.trim();
    if (referenceNumber.length < 3 || referenceNumber.length > 100) throw new Error("Enter a valid GCash reference number.");
    if (await ctx.db.query("stallDeposits").withIndex("by_referenceNumber", q => q.eq("referenceNumber", referenceNumber)).first()) throw new Error("This reference number has already been submitted.");
    const now = new Date().toISOString();
    const id = await ctx.db.insert("stallDeposits", { stallId: stall._id, sellerId: user._id, amount: args.amount, referenceNumber, status: "pending", events: [{ status: "pending", label: "Deposit submitted", at: now }], createdAt: now });
    await createNotification(ctx, { userId: user._id, role: "seller", refId: id, type: "deposit_submitted", title: "Deposit submitted", body: "Your stall deposit is awaiting admin review." });
    return id;
  },
});

export const listPending = query({
  args: {},
  returns: v.array(v.any()),
  async handler(ctx) {
    await requireAdmin(ctx);
    const deposits = await ctx.db.query("stallDeposits").withIndex("by_status", q => q.eq("status", "pending")).order("desc").take(200);
    return Promise.all(deposits.map(async deposit => {
      const [stall, seller, all] = await Promise.all([ctx.db.get("stalls", deposit.stallId), ctx.db.get("users", deposit.sellerId), ctx.db.query("stallDeposits").withIndex("by_stallId", q => q.eq("stallId", deposit.stallId)).take(200)]);
      const paid = stall?.depositPaidAmount ?? approvedTotal(all);
      return { ...deposit, stallName: stall?.stallName ?? "Stall", sellerName: seller?.fullName ?? "Seller", approvedTotal: paid, remaining: Math.max(0, SELLER_DEPOSIT_AMOUNT - paid) };
    }));
  },
});

export const pendingCount = query({ args: {}, returns: v.number(), async handler(ctx) { await requireAdmin(ctx); return (await ctx.db.query("stallDeposits").withIndex("by_status", q => q.eq("status", "pending")).take(200)).length; } });

export const approve = mutation({
  args: { depositId: v.id("stallDeposits"), approvedAmount: v.number() }, returns: v.null(),
  async handler(ctx, args) {
    const actor = await requireAdmin(ctx);
    const deposit = await ctx.db.get("stallDeposits", args.depositId);
    if (!deposit || deposit.status !== "pending") throw new Error("Deposit is no longer awaiting review");
    const stall = await ctx.db.get("stalls", deposit.stallId);
    if (!stall) throw new Error("The seller stall is unavailable.");
    const all = await ctx.db.query("stallDeposits").withIndex("by_stallId", q => q.eq("stallId", deposit.stallId)).take(200);
    const remain = Math.max(0, SELLER_DEPOSIT_AMOUNT - (stall.depositPaidAmount ?? approvedTotal(all)));
    if (!Number.isFinite(args.approvedAmount) || args.approvedAmount <= 0 || args.approvedAmount > remain) throw new Error("Confirmed amount must be positive and no more than the remaining balance.");
    const now = new Date().toISOString();
    await ctx.db.patch(deposit._id, { status: "approved", approvedAmount: args.approvedAmount, reviewedBy: actor, reviewedAt: now, events: [...deposit.events, { status: "approved", label: "Admin approved deposit", at: now, actor, amount: args.approvedAmount }] });
    const total = Math.min(SELLER_DEPOSIT_AMOUNT, (stall.depositPaidAmount ?? approvedTotal(all)) + args.approvedAmount);
    await ctx.db.patch(deposit.stallId, { depositPaidAmount: total, depositStatus: total >= SELLER_DEPOSIT_AMOUNT ? "paid" : "partial", updatedAt: now });
    await ctx.db.insert("adminAuditLog", { actorEmail: actor, action: "deposit_approved", depositId: deposit._id, createdAt: now });
    await createNotification(ctx, { userId: deposit.sellerId, role: "seller", refId: deposit._id, type: "deposit_approved", title: total >= SELLER_DEPOSIT_AMOUNT ? "Stall activated" : "Deposit approved", body: total >= SELLER_DEPOSIT_AMOUNT ? "Your stall is now active and visible to buyers." : `Approved. Your remaining deposit balance is ₱${(SELLER_DEPOSIT_AMOUNT - total).toLocaleString()}.` });
    return null;
  },
});

export const reject = mutation({
  args: { depositId: v.id("stallDeposits"), reason: v.string() }, returns: v.null(),
  async handler(ctx, args) {
    const actor = await requireAdmin(ctx);
    const deposit = await ctx.db.get("stallDeposits", args.depositId);
    if (!deposit || deposit.status !== "pending") throw new Error("Deposit is no longer awaiting review");
    const reason = args.reason.trim();
    if (reason.length < 5 || reason.length > 500) throw new Error("Enter a rejection reason between 5 and 500 characters.");
    const now = new Date().toISOString();
    await ctx.db.patch(deposit._id, { status: "rejected", rejectionReason: reason, reviewedBy: actor, reviewedAt: now, events: [...deposit.events, { status: "rejected", label: "Admin rejected deposit", at: now, actor, reason }] });
    await ctx.db.insert("adminAuditLog", { actorEmail: actor, action: "deposit_rejected", depositId: deposit._id, reason, createdAt: now });
    await createNotification(ctx, { userId: deposit.sellerId, role: "seller", refId: deposit._id, type: "deposit_rejected", title: "Deposit rejected", body: `Please submit again with a new reference. Reason: ${reason}` });
    return null;
  },
});

export const expireStalls = internalMutation({
  args: {}, returns: v.null(),
  async handler(ctx) {
    const stalls = await ctx.db.query("stalls").take(500);
    const now = Date.now();
    for (const stall of stalls) {
      if (stall.depositDeadline === undefined) {
        await ctx.db.patch(stall._id, { depositStatus: "unpaid", depositPaidAmount: 0, depositDeadline: now + DEPOSIT_GRACE_PERIOD_MS });
        continue;
      }
      if (stall.depositDeadline < now && (stall.depositPaidAmount ?? 0) < SELLER_DEPOSIT_AMOUNT) {
        const notifications = await ctx.db.query("notifications").withIndex("by_userId", q => q.eq("userId", stall.ownerId)).take(100);
        const notified = notifications.some(item => item.type === "stall_suspended" && item.refId === stall._id);
        if (!notified) await createNotification(ctx, { userId: stall.ownerId, role: "seller", refId: stall._id, type: "stall_suspended", title: "Stall suspended", body: "Your deposit deadline passed. Complete the deposit to reactivate your stall." });
      } else if ((stall.depositPaidAmount ?? 0) < SELLER_DEPOSIT_AMOUNT) {
        const daysLeft = Math.ceil((stall.depositDeadline - now) / 86400000);
        if (daysLeft === 3 || daysLeft === 1) {
          const notifications = await ctx.db.query("notifications").withIndex("by_userId", q => q.eq("userId", stall.ownerId)).take(100);
          const type = `deposit_${daysLeft}_days_left`;
          if (!notifications.some(item => item.type === type && item.refId === stall._id)) await createNotification(ctx, { userId: stall.ownerId, role: "seller", refId: stall._id, type, title: `${daysLeft} days left to complete your deposit`, body: `Your ₱${SELLER_DEPOSIT_AMOUNT.toLocaleString()} deposit is due in ${daysLeft} days. Complete it to keep your stall visible to buyers.` });
        }
      }
    }
    return null;
  },
});
