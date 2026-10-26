import { COMMISSION_RATE } from "../constants/commissions";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

export type CodCommissionAccrual = {
  accrual: Doc<"commissionAccruals">;
  order: Doc<"orders">;
  amount: number;
  eligible: boolean;
};

export function codCommissionAmountForOrder(order: Pick<Doc<"orders">, "subtotal">) {
  return roundMoney(order.subtotal * COMMISSION_RATE);
}

function isCountable(order: Doc<"orders">, accrual: Doc<"commissionAccruals">) {
  return accrual.status !== "waived" && order.status !== "refunded" && order.status !== "cancelled";
}

/** Resolves accruals against real COD orders, drops removed/orphan rows, and keeps the oldest accrual per order. */
export async function resolveCodCommissionAccruals(
  ctx: QueryCtx,
  accruals: Doc<"commissionAccruals">[],
): Promise<CodCommissionAccrual[]> {
  const resolved = await Promise.all(accruals.filter(accrual => !accrual.removedAt).map(async accrual => {
    const order = await ctx.db.get("orders", accrual.orderId);
    if (!order || order.paymentMethod !== "cod") return null;
    const amount = codCommissionAmountForOrder(order);
    if (amount <= 0) return null;
    return { accrual, order, amount, eligible: isCountable(order, accrual) } satisfies CodCommissionAccrual;
  }));

  const canonical = new Map<Id<"orders">, CodCommissionAccrual>();
  for (const row of resolved) {
    if (!row) continue;
    const current = canonical.get(row.order._id);
    const isOlder = !current || row.accrual._creationTime < current.accrual._creationTime
      || row.accrual._creationTime === current.accrual._creationTime && row.accrual._id < current.accrual._id;
    if (isOlder) canonical.set(row.order._id, row);
  }
  return [...canonical.values()];
}

export async function loadCodCommissionAccrualsForOrders(
  ctx: QueryCtx,
  orders: Doc<"orders">[],
) {
  const accrualGroups = await Promise.all(orders
    .filter(order => order.paymentMethod === "cod")
    .map(order => ctx.db.query("commissionAccruals").withIndex("by_orderId", q => q.eq("orderId", order._id)).collect()));
  return resolveCodCommissionAccruals(ctx, accrualGroups.flat());
}
