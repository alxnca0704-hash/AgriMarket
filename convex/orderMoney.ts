import type { Doc } from "./_generated/dataModel";
import { COD_REFUND_METHOD_LABEL } from "../constants/refunds";

type OrderMoneyShape = Pick<
  Doc<"orders">,
  "paymentMethod" | "status" | "refundMethod" | "refundFundedBy" | "refundAffectsPlatformGcash" | "refundOverdue" | "refundClosedAt" | "refundAmount" | "total"
>;

export function isSellerFundedCodRefund(order: OrderMoneyShape): boolean {
  return order.paymentMethod === "cod"
    && (order.refundFundedBy === "seller"
      || order.refundMethod === "seller-gcash"
      || order.refundAffectsPlatformGcash === false);
}

export function refundReducesPlatformGcash(order: OrderMoneyShape): boolean {
  return order.status === "refunded"
    && order.refundAffectsPlatformGcash !== false
    && order.refundMethod !== "seller-gcash";
}

export function refundAmountForOrder(order: OrderMoneyShape): number {
  return order.refundAmount ?? order.total;
}

export function refundMethodLabel(method: OrderMoneyShape["refundMethod"]): string {
  if (method === "seller-gcash") return COD_REFUND_METHOD_LABEL;
  if (method === "cash") return "Cash";
  if (method === "gcash") return "GCash";
  return "Not recorded";
}

export function isCodRefundOverdue(order: OrderMoneyShape): boolean {
  return order.paymentMethod === "cod"
    && order.refundOverdue === true
    && order.status !== "refunded"
    && order.status !== "cancelled"
    && order.refundClosedAt === undefined;
}
