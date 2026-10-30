# Progress

The source-of-truth work queue is [`context/progress-tracker.md`](context/progress-tracker.md). This file is a short handoff summary.

## Current Phase

Feature-complete MVP. Buyer, seller, COD, GCash payments, payouts, refunds, commissions, receivables, stall deposits, sales, and finance are implemented.

## Current Goal

Complete the product variant rollout by running the idempotent migration and
the authenticated seller-to-buyer checkout and stock walkthrough. Implementation
and local build/lint are complete; deployment verification remains.

## Completed

- Implemented per-product types with their own names, descriptions, prices,
  stock, ordering, and archival. Buyers select a type; cart lines are keyed by
  product and variant; checkout prices and order snapshots are server-derived.
- Added legacy default-type reads and an idempotent paginated migration. Product
  forms and displays no longer show harvest or expiry dates. `npm run build`
  and `npm run lint` pass.

- Fixed admin stall order history GCash net payouts to include delivery fee via shared `getGcashNetToSeller`; rows and the GCash balance card now match.

### Stall verification

- New stalls are auto-verified. Seller onboarding no longer collects or submits
  an ID, existing stalls were migrated to verified, and the pending-ID admin
  surfaces, payout ID details, route, and navigation entry were removed.

### COD seller-funded refunds

- Buyer COD refund requests collect the refund GCash name/number and move
  through seller approval, return shipping, goods receipt, and seller repayment
  with proof. Buyer confirmation immediately records the refund and closes the
  order as `refunded`; disputes and buyer non-response still require admin review.
- Seller review has no deadline or escalation. Approval uses the stall
  address automatically, then the buyer chooses the courier and ships the
  return. Deadlines and hourly reminders cover buyer shipping, seller
  repayment, and buyer response. Late repayment is accepted and flagged as
  overdue.
- Sellers see only a masked GCash number; the full number is revealed only
  after goods are received, with a refund event recorded.
- Admin review gained a COD tab with escalation/dispute resolution,
  repayment rejection, refund recording, and audited method correction.
  Legacy `completeReturnRefund` now rejects COD orders.
- COD refunds record `seller-gcash` / `seller` / platform-GCash `false`.
  Overdue refunds block payout requests, and the seller surfaces show the
  blocking amount.
- COD commission is waived when the buyer confirms receiving the refund, and
  that confirmation records the refund without an extra admin step. Refunded
  paid GCash invoices create commission credits applied before the next invoice;
  the Platform tab shows available credit and per-invoice credit applied.
- TypeScript, lint (existing warnings), and build pass. The `ys8gxfew`
  correction remains pending because no matching order/refund exists in dev
  or prod.

### Seller Platform tab and COD accrual consistency

- Renamed the seller stall `Commissions` tab to `Platform`; the canonical tab
  key is now `platform`, the label is `Platform`, and `/seller/commissions`
  plus legacy `?tab=commissions` links redirect to `?tab=platform`.
- Updated notification routes, overview attention/activity links, invoice
  notification bodies, the tab badge count, and the tab content subtitle.
- Added shared `commissionAccruals.ts` resolution for COD accruals: removed
  rows, missing/non-COD orders, refunded/cancelled orders, and duplicate
  accruals are excluded from outstanding totals while preserving waived
  history.
- Seller commissions, finance, admin stall finance, admin stall detail, and
  seller/admin sales now use the shared resolver. The Platform Unbilled card
  sums the same server rows shown under Unbilled orders, so it has no fallback
  amount and shows `0` with no eligible orders.
- Added internal `commissions:repairCommissionAccruals` to mark orphan and
  duplicate accruals with `removedAt`/`removedReason` and append
  `commission_accrual_removed` admin audit events. It skips invoiced rows so
  invoice math and payment approval flows are untouched.
- `npm run build` and `npm run lint` pass; lint has 10 existing warnings.
- The repair mutation scanned 0 rows because the dev deployment currently has
  no orders or commission accruals. The live `₱2.50` fixture check remains
  unavailable until that data is restored.

### Sales commission display

- Sales summaries split COD commission owed, active GCash commission, and
  total commission. GCash sale rows now read their stored commission and
  pending/collected/reversed ledger status; refunded COD/GCash rows display
  waived/reversed.
- Order timestamps now explicitly format in Philippine time.
- `npm run build` passes. `npm run lint` passes with 10 existing warnings.

### Seller dashboard totals

- Total sales now match the server-side seller sales ledger (completed orders,
  refunded orders excluded) instead of summing the limited recent order list.
- COD commission owed is shown separately through the seller finance query;
  it is not subtracted from gross sales.
- Build and lint pass with existing warnings.

### Seller delivery tracking

- Sellers provide a courier and tracking number when marking an order as to
  receive. The mutation validates and saves both, and notifies the buyer with
  the details.
- Buyer and seller order details show delivery tracking, distinct from return
  shipment tracking.
- `npm run build` passes. `npm run lint` passes with existing warnings.

### Admin payment search

- Search by buyer, stall, payment reference, or payment note no longer loses
  focus as the server results update. Search is isolated and debounced, with
  inline loading feedback.
- Build and lint pass with existing warnings.

### Refund review records

- `/admin/refunds` now has Pending and Refund records sections with desktop
  tables, mobile cards, and detail drawers. Recorded refunds show amount,
  disbursement method, reference, and date through a verified-admin query.
- Stall details now show recorded refund totals and refund order rows, with a
  direct link to Refund records.
- Refund search covers pending and recorded entries by order ID, buyer, stall,
  payment/refund reference, courier, and tracking number.
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

## Architecture Decisions

- **Variants with per-type price and stock** — product display price derives
  from the lowest active type price and total stock from active type stock.
  Legacy products read as one default type while an idempotent migration fills
  the optional `variants` field.
- **Cart keyed by product and variant** — one product in two types creates two
  lines; checkout reads current type price and stock from Convex and snapshots
  the chosen type on the order.

## Next Up

1. Complete Stall Accounts and compare figures with the existing finance,
   receivables, and sales pages.
2. Run the authenticated finance/refund/deposit/payout/reconciliation and
   seller-ownership walkthrough, then remove and redirect replaced routes.
3. Walk through deposit signup, partial top-up, rejection/resubmission,
   duplicate override, over-remaining rejection, and overdue behavior.
4. Restore or reseed the dev COD fixture and verify the Platform Unbilled
   figure against the actual `finance:getSellerFinance` and
   `commissions:getSellerCommissions` responses.

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
