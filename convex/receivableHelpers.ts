import type { Id, Doc } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';

export interface ReceivableAllocation {
  status: 'accrued' | 'invoiced' | 'overdue' | 'paid' | 'waived';
  amountPaid: number;
  amountOwed: number;
  paymentReference: string | null;
  paymentId: Id<'commissionPayments'> | null;
  paymentAmount: number | null;
  paidAt: string | null;
}

export interface ReceivableLedger {
  allocations: Map<Id<'commissionAccruals'>, ReceivableAllocation>;
  invoices: Map<Id<'commissionInvoices'>, Doc<'commissionInvoices'>>;
  approvedPayments: Doc<'commissionPayments'>[];
}

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

export async function resolveReceivableLedger(
  ctx: QueryCtx,
  accruals: Doc<'commissionAccruals'>[],
  now: number,
): Promise<ReceivableLedger> {
  const invoiceIds = [...new Set(accruals.flatMap(accrual => accrual.invoiceId ? [accrual.invoiceId] : []))];
  const invoiceDocs = (await Promise.all(invoiceIds.map(id => ctx.db.get('commissionInvoices', id))))
    .filter((invoice): invoice is Doc<'commissionInvoices'> => invoice !== null);
  const invoices = new Map(invoiceDocs.map(invoice => [invoice._id, invoice]));
  const allInvoiceAccruals = new Map<Id<'commissionInvoices'>, Doc<'commissionAccruals'>[]>();
  const paymentGroups = await Promise.all(invoiceDocs.map(async invoice => {
    const [related, payments] = await Promise.all([
      Promise.all(invoice.accrualIds.map(id => ctx.db.get('commissionAccruals', id))),
      ctx.db.query('commissionPayments').withIndex('by_invoiceId', q => q.eq('invoiceId', invoice._id)).take(500),
    ]);
    allInvoiceAccruals.set(invoice._id, related.filter((item): item is Doc<'commissionAccruals'> => item !== null).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || String(a._id).localeCompare(String(b._id))));
    return payments.filter(payment => payment.status === 'approved').sort((a, b) => (a.reviewedAt ?? '').localeCompare(b.reviewedAt ?? '') || String(a._id).localeCompare(String(b._id)));
  }));
  const approvedPayments = paymentGroups.flat();
  const allocations = new Map<Id<'commissionAccruals'>, ReceivableAllocation>();
  for (const accrual of accruals) {
    allocations.set(accrual._id, { status: accrual.status === 'waived' ? 'waived' : 'accrued', amountPaid: 0, amountOwed: accrual.status === 'waived' ? 0 : accrual.amount, paymentReference: null, paymentId: null, paymentAmount: null, paidAt: null });
  }

  for (const invoice of invoiceDocs) {
    const related = (allInvoiceAccruals.get(invoice._id) ?? []).filter(accrual => accrual.status !== 'waived');
    const paidByAccrual = new Map<Id<'commissionAccruals'>, number>();
    const detailsByAccrual = new Map<Id<'commissionAccruals'>, { paymentReference: string; paymentId: Id<'commissionPayments'>; paymentAmount: number; paidAt: string }>();
    let totalApplied = 0;
    const applyAmount = (amount: number, payment?: Doc<'commissionPayments'>) => {
      let remaining = amount;
      for (const accrual of related) {
        if (remaining <= 0) break;
        const alreadyPaid = paidByAccrual.get(accrual._id) ?? 0;
        const applied = Math.min(remaining, Math.max(0, accrual.amount - alreadyPaid));
        if (applied <= 0) continue;
        const nextPaid = roundMoney(alreadyPaid + applied);
        paidByAccrual.set(accrual._id, nextPaid);
        remaining = roundMoney(remaining - applied);
        if (payment?.reviewedAt) detailsByAccrual.set(accrual._id, { paymentReference: payment.referenceNumber, paymentId: payment._id, paymentAmount: payment.approvedAmount ?? payment.amount, paidAt: payment.reviewedAt });
      }
      return roundMoney(amount - remaining);
    };
    const approved = paymentGroups.flat().filter(payment => payment.invoiceId === invoice._id);
    for (const payment of approved) {
      const capacity = Math.max(0, invoice.paidAmount - totalApplied);
      if (capacity <= 0) break;
      totalApplied = roundMoney(totalApplied + applyAmount(Math.min(payment.approvedAmount ?? payment.amount, capacity), payment));
    }
    const untrackedPaid = Math.max(0, roundMoney(invoice.paidAmount - totalApplied));
    if (untrackedPaid > 0) applyAmount(untrackedPaid);

    for (const accrual of related) {
      const amountPaid = Math.min(accrual.amount, paidByAccrual.get(accrual._id) ?? 0);
      const amountOwed = roundMoney(Math.max(0, accrual.amount - amountPaid));
      const fullyPaid = amountOwed <= 0;
      const details = amountPaid > 0 ? detailsByAccrual.get(accrual._id) : undefined;
      allocations.set(accrual._id, {
        status: fullyPaid ? 'paid' : invoice.dueAt <= now ? 'overdue' : 'invoiced',
        amountPaid: roundMoney(amountPaid), amountOwed,
        paymentReference: details?.paymentReference ?? null,
        paymentId: details?.paymentId ?? null,
        paymentAmount: details?.paymentAmount ?? null,
        paidAt: details?.paidAt ?? null,
      });
    }
  }
  return { allocations, invoices, approvedPayments };
}

export function receivablePeriodStarts(now: number) {
  const offset = 8 * 60 * 60 * 1000;
  const day = new Date(now + offset);
  day.setHours(0, 0, 0, 0);
  const today = new Date(day.getTime() - offset).toISOString();
  const week = new Date(day);
  week.setDate(week.getDate() - ((week.getDay() + 6) % 7));
  const thisWeek = new Date(week.getTime() - offset).toISOString();
  const month = new Date(day);
  month.setDate(1);
  const thisMonth = new Date(month.getTime() - offset).toISOString();
  return { today, thisWeek, thisMonth };
}
