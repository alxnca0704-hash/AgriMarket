import { ADMIN_EMAIL } from "../constants/roles";
import {
  isValidGcashNumber,
  maskGcashNumber,
  normalizeGcashNumber,
} from "../constants/refunds";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { createNotification } from "./notifications";

export type RefundActorRole = "buyer" | "seller" | "admin" | "system";

export async function requireIdentityUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .first();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || identity.email?.toLowerCase() !== ADMIN_EMAIL || identity.emailVerified !== true) {
    throw new Error("Not authorized");
  }
  return identity.email.toLowerCase();
}

export async function getBuyerOwnedOrder(
  ctx: QueryCtx | MutationCtx,
  orderId: Id<"orders">
): Promise<Doc<"orders">> {
  const user = await requireIdentityUser(ctx);
  const order = await ctx.db.get("orders", orderId);
  if (!order || order.buyerId !== user._id) throw new Error("Order not found");
  return order;
}

export async function getSellerOwnedOrder(
  ctx: QueryCtx | MutationCtx,
  orderId: Id<"orders">
): Promise<Doc<"orders">> {
  const user = await requireIdentityUser(ctx);
  const order = await ctx.db.get("orders", orderId);
  if (!order || order.sellerId !== user._id) throw new Error("Order not found");
  return order;
}

export function normalizedReference(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function validateBuyerRefundNumber(value: string): string {
  const normalized = normalizeGcashNumber(value);
  if (!isValidGcashNumber(normalized)) {
    throw new Error("Enter a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX).");
  }
  return normalized;
}

export function validateGcashAccountName(value: string): string {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 100) {
    throw new Error("Enter the GCash account name between 2 and 100 characters.");
  }
  return name;
}

export function maskedNumber(value: string | undefined): string {
  return maskGcashNumber(value);
}

export function makeRefundEvent(
  type: string,
  label: string,
  actorRole: RefundActorRole,
  at: string,
  reason?: string
): { type: string; label: string; actorRole: RefundActorRole; at: string; reason?: string } {
  return { type, label, actorRole, at, ...(reason ? { reason } : {}) };
}

export function sellerReturnAddress(stall: Doc<"stalls">): string {
  const location = stall.location;
  return [
    stall.stallName,
    location.streetBuilding,
    location.barangay,
    location.cityMunicipality,
    location.province,
    location.region,
    location.postalCode,
  ].filter(Boolean).join(", ");
}

export async function notifyAdmin(
  ctx: MutationCtx,
  type: string,
  title: string,
  body: string,
  orderId?: Id<"orders">
): Promise<void> {
  const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", ADMIN_EMAIL)).first();
  if (!user) return;
  await createNotification(ctx, {
    userId: user._id,
    role: "admin",
    orderId,
    type,
    title,
    body,
  });
}

export async function findDuplicateRepaymentReference(
  ctx: QueryCtx | MutationCtx,
  reference: string,
  excludeOrderId?: Id<"orders">
): Promise<Doc<"orders"> | null> {
  const normalized = normalizedReference(reference);
  if (!normalized) return null;
  const indexed = await ctx.db
    .query("orders")
    .withIndex("by_refundRepaymentReference", (q) => q.eq("refundRepaymentReference", normalized))
    .take(20);
  const match = indexed.find((order) => order._id !== excludeOrderId);
  if (match) return match;
  const fallback = await ctx.db.query("orders").take(4000);
  return fallback.find((order) =>
    order._id !== excludeOrderId
    && (
      normalizedReference(order.refundRepaymentReference ?? "") === normalized
      || (order.status === "refunded" && normalizedReference(order.refundReference ?? "") === normalized)
    )
  ) ?? null;
}

export function isActiveCodRefundStatus(status: Doc<"orders">["status"]): boolean {
  return status === "refund-requested"
    || status === "seller-rejected"
    || status === "escalated"
    || status === "return-approved"
    || status === "return-in-transit"
    || status === "return-received"
    || status === "repayment-submitted"
    || status === "buyer-confirmed"
    || status === "buyer-disputed";
}

export function codRefundIsOverdue(order: Doc<"orders">): boolean {
  return order.paymentMethod === "cod"
    && order.refundOverdue === true
    && order.refundClosedAt === undefined
    && order.status !== "refunded";
}

export function orderLabel(orderId: string): string {
  return `#${orderId.slice(-6).toUpperCase()}`;
}
