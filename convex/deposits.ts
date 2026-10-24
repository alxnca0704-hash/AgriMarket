import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { DEPOSIT_GRACE_PERIOD_MS, STALL_DEPOSIT_AMOUNT } from "../constants/deposits";
import { ADMIN_EMAIL } from "../constants/roles";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { createNotification } from "./notifications";

const adminStatusValidator = v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("all"));
const normalizeReference = (reference: string) => reference.trim().replace(/\s+/g, " ").toUpperCase();

async function findReference(ctx: QueryCtx | MutationCtx, reference: string, exceptId?: import("./_generated/dataModel").Id<"stallDeposits">) {
  for await (const item of ctx.db.query("stallDeposits")) {
    if (item._id !== exceptId && normalizeReference(item.referenceNumber) === reference) return item;
  }
  return null;
}

async function currentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db.query("users").withIndex("by_token_identifier", q => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();
}

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email || identity.email.toLowerCase() !== ADMIN_EMAIL || identity.emailVerified !== true) throw new Error("Not authorized");
  return identity.email.toLowerCase();
}

async function sumApproved(ctx: QueryCtx | MutationCtx, stallId: import("./_generated/dataModel").Id<"stalls">) {
  let total = 0;
  for await (const item of ctx.db.query("stallDeposits").withIndex("by_stallId", q => q.eq("stallId", stallId))) {
    if (item.status === "approved") total += item.approvedAmount ?? 0;
  }
  return total;
}

function statusFor(total: number) {
  return total >= STALL_DEPOSIT_AMOUNT ? "paid" : total > 0 ? "partial" : "unpaid";
}

async function notifyAdmin(ctx: MutationCtx, title: string, body: string, refId: string) {
  const admin = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", ADMIN_EMAIL)).first();
  if (admin) await createNotification(ctx, { userId: admin._id, role: "admin", refId, type: "deposit_submitted", title, body });
}

export const getSellerDeposit = query({
  args: { now: v.number() }, returns: v.any(),
  async handler(ctx, args) {
    const user = await currentUser(ctx);
    if (!user || user.role !== "seller") return null;
    const stall = await ctx.db.query("stalls").withIndex("by_ownerId", q => q.eq("ownerId", user._id)).first();
    if (!stall) return null;
    const submissions = [];
    for await (const submission of ctx.db.query("stallDeposits").withIndex("by_stallId", q => q.eq("stallId", stall._id)).order("desc")) submissions.push(submission);
    const gcash = await ctx.db.query("gcashSettings").withIndex("by_key", q => q.eq("key", "primary")).first();
    const total = await sumApproved(ctx, stall._id);
    const deadline = stall.depositDeadline ?? stall._creationTime + DEPOSIT_GRACE_PERIOD_MS;
    return { stall: { ...stall, depositPaidAmount: total, depositStatus: statusFor(total), depositDeadline: deadline, overdue: stall.depositOverdue ?? (args.now > deadline && total < STALL_DEPOSIT_AMOUNT) }, submissions, gcash: gcash ? { qrUrl: gcash.qrUrl, number: gcash.number } : null };
  },
});

export const getPublicGcashSettings = query({
  args: {}, returns: v.union(v.null(), v.object({ qrUrl: v.string(), number: v.string() })),
  async handler(ctx) {
    const settings = await ctx.db.query("gcashSettings").withIndex("by_key", q => q.eq("key", "primary")).first();
    return settings ? { qrUrl: settings.qrUrl, number: settings.number } : null;
  },
});

export const submit = mutation({
  args: { amount: v.number(), referenceNumber: v.string() }, returns: v.id("stallDeposits"),
  async handler(ctx, args) {
    const user = await currentUser(ctx);
    if (!user || user.role !== "seller") throw new Error("Seller account required");
    const stall = await ctx.db.query("stalls").withIndex("by_ownerId", q => q.eq("ownerId", user._id)).first();
    if (!stall) throw new Error("Create your stall before submitting a deposit");
    const records = [];
    for await (const record of ctx.db.query("stallDeposits").withIndex("by_stallId", q => q.eq("stallId", stall._id)).order("desc")) records.push(record);
    if (records.some(item => item.status === "pending")) throw new Error("You already have a deposit awaiting review");
    const paid = await sumApproved(ctx, stall._id);
    const remaining = Math.max(0, STALL_DEPOSIT_AMOUNT - paid);
    if (!Number.isFinite(args.amount) || args.amount <= 0 || args.amount > remaining) throw new Error(`Amount must be greater than zero and no more than the remaining ${remaining.toLocaleString("en-PH")}.`);
    const referenceNumber = normalizeReference(args.referenceNumber);
    if (referenceNumber.length < 3 || referenceNumber.length > 100) throw new Error("Enter a valid GCash reference number.");
    const existing = await findReference(ctx, referenceNumber);
    if (existing) throw new Error("This GCash reference number has already been submitted. Check the number or use a different reference.");
    const now = new Date().toISOString();
    const attemptNumber = records.reduce((max, item) => Math.max(max, item.attemptNumber ?? 1), 0) + 1;
    const id = await ctx.db.insert("stallDeposits", {
      stallId: stall._id, sellerId: user._id, amount: args.amount, referenceNumber, status: "pending",
      attemptNumber, submittedAt: now,
      events: [{ type: "submitted", actorId: user._id, actorRole: "seller", amount: args.amount, at: now }], createdAt: now,
    });
    await createNotification(ctx, { userId: user._id, role: "seller", refId: id, type: "deposit_submitted", title: "Deposit submitted", body: "Your stall deposit is awaiting admin review." });
    await notifyAdmin(ctx, "New stall deposit submission", `${stall.stallName}: ${args.amount.toLocaleString("en-PH")} · reference ${referenceNumber}`, id);
    return id;
  },
});

export const listAdmin = query({
  args: {
    status: adminStatusValidator, search: v.string(), from: v.union(v.string(), v.null()), to: v.union(v.string(), v.null()),
    paginationOpts: paginationOptsValidator,
  }, returns: v.any(),
  async handler(ctx, args) {
    await requireAdmin(ctx);
    const page = args.status === "all"
      ? await ctx.db.query("stallDeposits").order("desc").paginate(args.paginationOpts)
      : await ctx.db.query("stallDeposits").withIndex("by_status", q => q.eq("status", args.status as "pending" | "approved" | "rejected")).order("desc").paginate(args.paginationOpts);
    const needle = args.search.trim().toLowerCase();
    const rows = await Promise.all(page.page.map(async item => {
      const [stall, seller] = await Promise.all([ctx.db.get("stalls", item.stallId), ctx.db.get("users", item.sellerId)]);
      const approvedTotal = await sumApproved(ctx, item.stallId);
      return { ...item, stallName: stall?.stallName ?? "Stall", sellerName: seller?.fullName ?? "Seller", approvedTotal, remaining: Math.max(0, STALL_DEPOSIT_AMOUNT - approvedTotal), reviewedAt: item.reviewedAt ?? null, reviewedBy: item.reviewedBy ?? null };
    }));
    const fromTime = args.from ? Date.parse(`${args.from}T00:00:00.000Z`) : null;
    const toTime = args.to ? Date.parse(`${args.to}T23:59:59.999Z`) : null;
    return { ...page, page: rows.filter(row => {
      const submitted = Date.parse(row.submittedAt ?? row.createdAt);
      return (!needle || row.referenceNumber.toLowerCase().includes(needle) || row.stallName.toLowerCase().includes(needle)) && (fromTime === null || submitted >= fromTime) && (toTime === null || submitted <= toTime);
    }) };
  },
});

export const getAdminSummary = query({
  args: { now: v.number() }, returns: v.any(),
  async handler(ctx, args) {
    await requireAdmin(ctx);
    const now = args.now;
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    let approvedTotal = 0, pendingAmount = 0, approvedToday = 0, approvedWeek = 0, approvedMonth = 0;
    const count = { unpaid: 0, partial: 0, paid: 0 };
    const paidByStall = new Map<string, number>();
    let pendingCount = 0;
    for await (const record of ctx.db.query("stallDeposits")) {
      const stallKey = String(record.stallId);
      if (record.status === "pending") { pendingCount++; pendingAmount += record.amount; }
      if (record.status === "approved") {
        const amount = record.approvedAmount ?? 0;
        approvedTotal += amount;
        paidByStall.set(stallKey, (paidByStall.get(stallKey) ?? 0) + amount);
        const reviewed = Date.parse(record.reviewedAt ?? record.createdAt);
        if (reviewed >= todayStart.getTime()) approvedToday += amount;
        if (reviewed >= weekStart.getTime()) approvedWeek += amount;
        if (reviewed >= monthStart.getTime()) approvedMonth += amount;
      }
    }
    let totalExpected = 0;
    for await (const stall of ctx.db.query("stalls")) {
      const amount = paidByStall.get(String(stall._id)) ?? 0;
      count[statusFor(amount) as keyof typeof count]++;
      totalExpected += Math.max(0, STALL_DEPOSIT_AMOUNT - amount);
    }
    return { approvedTotal, unpaid: count.unpaid, partial: count.partial, paid: count.paid, pendingCount, pendingAmount, totalExpected, approvedToday, approvedWeek, approvedMonth };
  },
});

export const listStalls = query({
  args: { status: v.union(v.literal("all"), v.literal("unpaid"), v.literal("partial"), v.literal("paid")), now: v.number() }, returns: v.any(),
  async handler(ctx, args) {
    await requireAdmin(ctx);
    const stalls = await ctx.db.query("stalls").take(10000);
    const paidByStall = new Map<string, number>();
    for await (const record of ctx.db.query("stallDeposits")) if (record.status === "approved") paidByStall.set(String(record.stallId), (paidByStall.get(String(record.stallId)) ?? 0) + (record.approvedAmount ?? 0));
    return stalls.map(stall => { const paid = paidByStall.get(String(stall._id)) ?? 0; const deadline = stall.depositDeadline ?? stall._creationTime + DEPOSIT_GRACE_PERIOD_MS; return { stallId: stall._id, stallName: stall.stallName, paid, remaining: Math.max(0, STALL_DEPOSIT_AMOUNT - paid), status: statusFor(paid), deadline, overdue: stall.depositOverdue ?? (args.now > deadline && paid < STALL_DEPOSIT_AMOUNT) }; }).filter(item => args.status === "all" || item.status === args.status).sort((a, b) => a.deadline - b.deadline);
  },
});

export const getAdminDetail = query({
  args: { depositId: v.id("stallDeposits") }, returns: v.any(),
  async handler(ctx, args) {
    await requireAdmin(ctx);
    const deposit = await ctx.db.get("stallDeposits", args.depositId);
    if (!deposit) return null;
    const [stall, seller, attempts] = await Promise.all([
      ctx.db.get("stalls", deposit.stallId), ctx.db.get("users", deposit.sellerId),
      (async () => { const records = []; for await (const item of ctx.db.query("stallDeposits").withIndex("by_stallId", q => q.eq("stallId", deposit.stallId)).order("asc")) records.push(item); return records; })(),
    ]);
    const duplicate = await findReference(ctx, normalizeReference(deposit.referenceNumber), deposit._id);
    const duplicateApproved = duplicate?.status === "approved";
    const paid = await sumApproved(ctx, deposit.stallId);
    return { deposit, stall: stall ? { ...stall, depositPaidAmount: paid, depositStatus: statusFor(paid) } : null, seller, attempts, duplicateApproved };
  },
});

export const approve = mutation({
  args: { depositId: v.id("stallDeposits"), approvedAmount: v.number(), overrideReason: v.optional(v.string()) }, returns: v.null(),
  async handler(ctx, args) {
    const actor = await requireAdmin(ctx);
    const deposit = await ctx.db.get("stallDeposits", args.depositId);
    if (!deposit || deposit.status !== "pending") throw new Error("Deposit is no longer awaiting review");
    const stall = await ctx.db.get("stalls", deposit.stallId);
    if (!stall) throw new Error("The seller stall is unavailable");
    const balance = await sumApproved(ctx, stall._id);
    const remaining = Math.max(0, STALL_DEPOSIT_AMOUNT - balance);
    if (!Number.isFinite(args.approvedAmount) || args.approvedAmount <= 0 || args.approvedAmount > remaining) throw new Error("Confirmed amount must be positive and no more than the remaining balance");
    let duplicateApproved = false;
    for await (const item of ctx.db.query("stallDeposits")) if (item._id !== deposit._id && normalizeReference(item.referenceNumber) === normalizeReference(deposit.referenceNumber) && item.status === "approved") { duplicateApproved = true; break; }
    const overrideReason = args.overrideReason?.trim();
    if (duplicateApproved && (!overrideReason || overrideReason.length < 5)) throw new Error("This reference was already approved. A written override reason is required.");
    const now = new Date().toISOString();
    const newTotal = balance + args.approvedAmount;
    const status = statusFor(newTotal);
    const nextEvents = [...deposit.events, { type: "approved", actorId: actor, actorRole: "admin" as const, amount: args.approvedAmount, ...(overrideReason ? { reason: overrideReason } : {}), at: now }];
    await ctx.db.patch(deposit._id, { status: "approved", approvedAmount: args.approvedAmount, reviewedBy: actor, reviewedAt: now, events: nextEvents });
    await ctx.db.patch(stall._id, { depositPaidAmount: newTotal, depositStatus: status, depositOverdue: status !== "paid" && stall.depositDeadline !== undefined && Date.parse(now) > stall.depositDeadline, ...(status === "paid" ? { depositPaidAt: now } : {}), updatedAt: now });
    await ctx.db.insert("adminAuditLog", { actorEmail: actor, action: "deposit_approved", depositId: deposit._id, ...(overrideReason ? { reason: overrideReason } : {}), createdAt: now });
    const remainingAfter = Math.max(0, STALL_DEPOSIT_AMOUNT - newTotal);
    await createNotification(ctx, { userId: deposit.sellerId, role: "seller", refId: deposit._id, type: "deposit_approved", title: status === "paid" ? "Deposit complete" : "Deposit approved", body: status === "paid" ? "Your stall deposit is complete." : `Approved. You still need ${remainingAfter.toLocaleString("en-PH")} to complete your deposit.` });
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
    if (reason.length < 5 || reason.length > 500) throw new Error("Enter a rejection reason between 5 and 500 characters");
    const now = new Date().toISOString();
    await ctx.db.patch(deposit._id, { status: "rejected", rejectionReason: reason, reviewedBy: actor, reviewedAt: now, events: [...deposit.events, { type: "rejected", actorId: actor, actorRole: "admin", reason, at: now }] });
    await ctx.db.insert("adminAuditLog", { actorEmail: actor, action: "deposit_rejected", depositId: deposit._id, reason, createdAt: now });
    await createNotification(ctx, { userId: deposit.sellerId, role: "seller", refId: deposit._id, type: "deposit_rejected", title: "Deposit rejected", body: `Please submit again with a new reference. Reason: ${reason}` });
    return null;
  },
});

export const pendingCount = query({
  args: {}, returns: v.number(),
  async handler(ctx) {
    await requireAdmin(ctx);
    let count = 0;
    for await (const record of ctx.db.query("stallDeposits").withIndex("by_status", q => q.eq("status", "pending"))) { void record; count++; }
    return count;
  },
});

export const expireStalls = internalMutation({
  args: { paginationOpts: paginationOptsValidator }, returns: v.null(),
  async handler(ctx, args) {
    const page = await ctx.db.query("stalls").order("desc").paginate(args.paginationOpts);
    const now = Date.now();
    for (const stall of page.page) {
      if (stall.depositDeadline === undefined) {
        const paid = await sumApproved(ctx, stall._id);
        const status = statusFor(paid);
        await ctx.db.patch(stall._id, { depositStatus: status, depositPaidAmount: paid, depositDeadline: now + DEPOSIT_GRACE_PERIOD_MS, depositOverdue: false, ...(status === "paid" ? { depositPaidAt: new Date(now).toISOString() } : {}) });
        continue;
      }
      const paid = stall.depositPaidAmount ?? await sumApproved(ctx, stall._id);
      const overdue = stall.depositDeadline < now && paid < STALL_DEPOSIT_AMOUNT;
      if (stall.depositOverdue !== overdue) await ctx.db.patch(stall._id, { depositOverdue: overdue });
      if (overdue) {
        const notices = await ctx.db.query("notifications").withIndex("by_userId", q => q.eq("userId", stall.ownerId)).order("desc").take(200);
        if (!notices.some(item => item.type === "deposit_deadline_passed" && item.refId === stall._id)) await createNotification(ctx, { userId: stall.ownerId, role: "seller", refId: stall._id, type: "deposit_deadline_passed", title: "Deposit deadline passed", body: "Your stall deposit is overdue. Submit the remaining amount from your stall page." });
      } else if (paid < STALL_DEPOSIT_AMOUNT) {
        const daysLeft = Math.ceil((stall.depositDeadline - now) / 86400000);
        if (daysLeft === 3 || daysLeft === 1) {
          const notices = await ctx.db.query("notifications").withIndex("by_userId", q => q.eq("userId", stall.ownerId)).order("desc").take(200);
          const type = `deposit_${daysLeft}_days_left`;
          if (!notices.some(item => item.type === type && item.refId === stall._id)) await createNotification(ctx, { userId: stall.ownerId, role: "seller", refId: stall._id, type, title: `${daysLeft} days left to complete your deposit`, body: `Your ${STALL_DEPOSIT_AMOUNT.toLocaleString("en-PH")} deposit is due in ${daysLeft} days.` });
        }
      }
    }
    if (!page.isDone) await ctx.scheduler.runAfter(0, internal.deposits.expireStalls, { paginationOpts: { numItems: 100, cursor: page.continueCursor } });
    return null;
  },
});
