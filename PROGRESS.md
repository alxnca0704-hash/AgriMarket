# Progress

The source-of-truth work queue is [`context/progress-tracker.md`](context/progress-tracker.md). This file is a short handoff summary.

## Current Phase

Feature-complete MVP. Buyer, seller, COD, GCash payments, payouts, refunds, commissions, receivables, stall deposits, sales, and finance are implemented.

## Current Goal

Stall security deposit tracking is implemented. Next up is the authenticated
deposit walkthrough and the remaining seller verification work in
`context/progress-tracker.md`.

## Just Completed

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

1. Walk through deposit signup, skip-and-pay-later, partial top-up, rejection/resubmission, duplicate override, over-remaining rejection, and deadline overdue behavior with authenticated seller/admin accounts.
2. Sync the schema and functions to the intended Convex deployment, then check admin totals against the per-stall rows.
3. Continue seller verification work from `context/progress-tracker.md`.

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
