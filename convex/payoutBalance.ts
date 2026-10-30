import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { RETURN_REQUEST_WINDOW_MS } from "../constants/refunds";
import { getNetPayoutAmount } from "../constants/payouts";

type Ctx = QueryCtx | MutationCtx;
type BalanceGroup = { amount: number; orderCount: number };
export type StallPayoutBalance = {
  availableBalance: BalanceGroup;
  rollingBalance: BalanceGroup;
  requestedBalance: BalanceGroup;
  paidOut: BalanceGroup;
};

const round = (amount: number) => Math.round(amount * 100) / 100;
const refundActive = (order: Doc<"orders">) => order.refundPayoutHold === true || [
  "refund-requested", "return-approved", "return-in-transit", "return-received",
  "repayment-submitted", "buyer-confirmed", "buyer-disputed", "escalated",
].includes(order.status);

export async function getStallPayoutBalance(
  ctx: Ctx,
  stallId: Id<"stalls">,
  now = Date.now(),
  suppliedOrders?: Doc<"orders">[],
  suppliedRequests?: Doc<"payoutRequests">[],
): Promise<StallPayoutBalance> {
  const [orders, allRequests] = await Promise.all([
    suppliedOrders ? Promise.resolve(suppliedOrders) : ctx.db.query("orders").withIndex("by_stallId", q => q.eq("stallId", stallId)).collect(),
    suppliedRequests ? Promise.resolve(suppliedRequests) : ctx.db.query("payoutRequests").withIndex("by_stallId", q => q.eq("stallId", stallId)).collect(),
  ]);
  const requests = allRequests.filter(request => request.stallId === stallId);
  const requestById = new Map(requests.map(request => [String(request._id), request]));
  const totals = {
    availableBalance: { amount: 0, orderCount: 0 },
    rollingBalance: { amount: 0, orderCount: 0 },
    requestedBalance: { amount: 0, orderCount: 0 },
    paidOut: { amount: 0, orderCount: 0 },
  } satisfies StallPayoutBalance;
  for (const order of orders.filter(item => item.stallId === stallId)) {
    const completedOrReturning = order.status === "completed" || order.returnFromStatus === "completed";
    if (order.paymentMethod !== "gcash" || order.paymentStatus !== "paid" || !completedOrReturning || order.status === "refunded") continue;
    const amount = getNetPayoutAmount({ subtotal: order.subtotal, deliveryFee: order.deliveryFee, commissionAmount: order.commissionAmount, netPayoutAmount: order.netPayoutAmount });
    const request = order.payoutRequestId ? requestById.get(String(order.payoutRequestId)) : undefined;
    const status = request?.statusV2 ?? (request?.status === "pending" ? "requested" : request?.status);
    const group = status === "paid" ? totals.paidOut
      : status === "requested" || status === "on-hold" ? totals.requestedBalance
      : refundActive(order) || !order.deliveredAt || now - Date.parse(order.deliveredAt) < RETURN_REQUEST_WINDOW_MS ? totals.rollingBalance
      : totals.availableBalance;
    group.amount += amount;
    group.orderCount += 1;
  }
  for (const group of Object.values(totals)) group.amount = round(group.amount);
  return totals;
}
