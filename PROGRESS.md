# Progress

The source-of-truth work queue is [`context/progress-tracker.md`](context/progress-tracker.md). This file is a short handoff summary.

## Current Phase

Feature-complete MVP. Buyer, seller, COD, GCash payments, payouts, refunds, commissions, receivables, stall deposits, sales, and finance are implemented.

## Current Goal

Implement and verify Stall Accounts. The initial read-only list/detail routes
and server aggregation are in progress; filters, summary cards, pagination,
reconciliation form, exports, full detail tabs, seller parity, and the
authenticated walkthrough remain. Keep the legacy finance, receivables, and
sales page components and shared queries until parity is verified. Their
sidebar/drawer links are removed and old URLs redirect to `/admin/stalls`.

## Just Completed

### Refund review records

- `/admin/refunds` now has Pending and Refund records sections with desktop
  tables, mobile cards, and detail drawers. Recorded refunds show amount,
  disbursement method, reference, and date through a verified-admin query.
- Stall details now show recorded refund totals and refund order rows, with a
  direct link to Refund records.
- Build and lint pass with existing lint warnings.

### Platform admin dashboard

- `/admin` is the first admin navigation item and now shows the platform
  balance, obligations split, income, action counts, trends, top stall
  balances, recent activity, and the only reconciliation form.
- Added `finance:getAdminDashboard` with verified allowlisted admin checks.
  Expected GCash includes approved buyer payments, deposits, and COD commission
  payments, less paid payouts and recorded GCash refunds.
- Removed the reconciliation card from Stall Accounts. Build and lint pass;
  signed-in browser sizing and transaction walkthrough remain release follow-up.

### Admin finance ledger

- `/admin/finance` with three sections:
  - COD commission owed to the platform.
  - GCash held for stalls, owed to sellers, and expected GCash balance.
  - Platform commission earned from GCash and COD.
- All figures are derived server-side from orders, `commissionAccruals`, `commissionInvoices`, `commissionPayments`, `platformCommissions`, and `payoutRequests`.
- Added date-range filtering, per-stall grouped totals, stall drill-down, section record drawers, and CSV exports.
- Added append-only `financeReconciliations` with actual balance, expected balance, difference, period, admin, and timestamp.
- Seller earnings and commissions now reuse `finance:getSellerFinance` for matching figures.
- `npx convex codegen` completed; generated API bindings include `finance`.
- `npm run build` and `npm run lint` pass.

### Stall security deposit ledger

- Implemented full and partial deposit submissions during seller signup or
  later from the seller stall page, using the configured GCash QR and account
  number. Skipping signup deposit preserves the seven-day deadline.
- Added normalized unique references, attempt tracking, append-only submit and
  review events, approval amounts, rejection reasons, and verified-admin audit
  records. Reviewed submissions cannot be reviewed again or edited.
- Seller stall page shows required, paid, remaining, deadline countdown or
  overdue state, pending review, and submission history. Earnings shows
  “Security deposit held” as not withdrawable.
- `/admin/deposits` has summary totals, paginated status tabs, date and search
  filters, CSV export, per-stall balance table, event timeline, duplicate
  reference warning/override, and approve/reject actions.
- Server derives financial totals from submission records. Deposit stays
  separate from sales, payout eligibility/requests, and commission. Overdue
  deposits do not hide or suspend stalls. Deadline reminders and overdue flags
  run hourly; seller and admin receive live notifications.
- New schema fields are optional, preserving legacy rows. Build and lint pass.

## Next Up

1. Complete Stall Accounts and compare figures with the existing finance,
   receivables, and sales pages.
2. Run the authenticated finance/refund/deposit/payout/reconciliation and
   seller-ownership walkthrough, then remove and redirect replaced routes.
3. Walk through deposit signup, partial top-up, rejection/resubmission,
   duplicate override, over-remaining rejection, and overdue behavior.
4. Continue seller verification work from `context/progress-tracker.md`.

## Open Questions

- Whether or when the stall deposit is refundable remains undecided; refunds,
  commission offsets, and penalties were intentionally excluded from this
  implementation.
- The authenticated browser walkthrough and Convex deployment sync remain
  release follow-up.
- Finance reconciliation still needs confirmation against the actual admin
  GCash account.

## Verification

- `npm run build` — passing.
- `npm run lint` — passing with existing warnings only.
- No test script exists; do not claim test verification.
