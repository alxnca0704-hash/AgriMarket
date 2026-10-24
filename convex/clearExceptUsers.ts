import { internalMutation } from "./_generated/server";

export const clearAllExceptUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tablesToClear = [
      "addresses",
      "stalls",
      "products",
      "cartItems",
      "orders",
      "reviews",
      "conversations",
      "messages",
      "gcashSettings",
      "payoutRequests",
      "platformCommissions",
      "stallDeposits",
      "commissionAccruals",
      "commissionInvoices",
      "commissionPayments",
      "financeReconciliations",
      "adminAuditLog",
      "notifications",
    ] as const;

    let totalDeleted = 0;

    for (const table of tablesToClear) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
        totalDeleted++;
      }
    }

    return {
      ok: true,
      deletedFrom: tablesToClear,
      totalDeleted,
    };
  },
});
