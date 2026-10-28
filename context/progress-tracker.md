# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Feature-complete MVP. The buyer journey, the seller journey, and the
full Cash-on-Delivery order lifecycle are built and wired to Convex.

## Current Goal

Verify the COD seller-funded refund workflow end-to-end with authenticated
buyer, seller, and admin sessions, including deadlines, masked-number reveal,
repayment proof, admin correction, commission credits, and payout blocking.
The `ys8gxfew` refund-method correction is pending because no matching order
exists in the dev or prod deployment. Stall Accounts replacement verification
and seller verification follow.

## Completed

### COD seller-funded refunds

- Buyer COD refunds now require a GCash account name/number and use a
  seller-funded return workflow: `refund-requested`, seller approve/reject,
  `escalated`, `return-approved`, `return-in-transit`, `return-received`,
  `repayment-submitted`, `buyer-confirmed`/`buyer-disputed`, then `refunded`.
- Added deadline enforcement and hourly reminders for seller response, buyer
  shipping, seller repayment, and buyer confirmation/dispute. Late repayment
  submissions are accepted and flagged as overdue.
- Seller order queries expose only a masked GCash number. Sellers reveal the
  full number only at `return-received`, which writes a refund event. Buyer,
  seller, and admin panels show the timeline and required actions.
- Sellers submit a repayment reference and proof. Duplicate references block
  submission unless an admin supplies an override reason.
- Admin refund review gained a COD tab, escalation/dispute decisions,
  repayment rejection, refund recording, and an audited method-correction
  action. Legacy `completeReturnRefund` now refuses COD orders.
- COD refunds set `refundMethod: "seller-gcash"`, `refundFundedBy: "seller"`,
  and `refundAffectsPlatformGcash: false`.
- Payout requests are blocked while a COD refund is overdue; seller payout
  and attention surfaces show the blocking amount.
- Refunded paid GCash invoices create `commissionCredits`; credits are applied
  before the next invoice is issued, and the seller Platform tab shows
  available refund credit and per-invoice credit applied.
- `npx tsc --noEmit`, `npm run lint` (existing warnings only), and
  `npm run build` pass. The requested `ys8gxfew` correction could not be
  applied because no matching order/refund exists in the dev or prod
  deployment.

### Seller Platform tab and COD accrual consistency

- Renamed the seller stall `Commissions` tab to `Platform` at
  `/seller/stall?tab=platform`; `/seller/commissions` and legacy
  `?tab=commissions` links redirect to the new tab.
- Updated overview attention and activity links, notification routing and
  bodies, tab badge counts, and added the required Platform subtitle.
- Added `convex/commissionAccruals.ts` as the shared resolver for COD
  accruals. It filters removed rows, missing or non-COD orders,
  refunded/cancelled orders, and duplicate accruals while keeping waived rows
  available for history.
- Seller commissions, finance, admin stall finance, admin stall detail, and
  seller/admin sales now use the shared resolver. The Platform Unbilled card
  sums the server-provided unbilled rows, never falls back to a hard-coded
  amount, and shows `0` when there are no eligible orders.
- Added `commissions:repairCommissionAccruals` to mark orphan and duplicate
  rows with `removedAt`/`removedReason` and append
  `commission_accrual_removed` admin audit events. Invoiced rows are skipped
  so invoice math and approval flows are unchanged.
- Build and lint pass. The repair scan found 0 rows because the dev deployment
  currently has no orders or accruals; the live 2.50 fixture check is pending
  restored data.

### Sales commission display

- Seller and admin Sales summaries now show COD commission owed, GCash
  commission, and their total as separate figures. Sales rows show GCash
  commission amounts and ledger status; refunded rows are marked waived or
  reversed.
- Order timestamps use Philippine time explicitly.
- Build passes; lint passes with the existing 10 warnings.

### Seller dashboard sales and commission totals

- Dashboard sales now use the seller sales ledger's server-calculated total,
  so only completed sales count and refunded orders are excluded; it no longer
  sums values from the limited recent-orders list.
- Added COD commission owed as its own figure using the existing seller finance
  query, keeping commissions separate from gross sales and honoring refunded
  or waived accruals.
- Build and lint pass with existing warnings.

### Seller delivery tracking

- Sellers must enter a courier and tracking number when marking an order as
  to receive. The dispatch mutation validates and saves both fields with the
  status transition, and the buyer notification includes the tracking details.
- Buyer and seller order details display the saved delivery tracking;
  delivery tracking remains separate from return shipment details.
- Build passes; lint passes with existing warnings.

### Admin payment search

- Payment verification search now matches buyer, stall, reference number, and
  payment note without unmounting the search input while results refresh.
- Input state is isolated and server queries are debounced; the results area
  shows its loading state in place.
- Build passes; lint passes with existing warnings.

### Refund review records

- Reworked `/admin/refunds` into Pending and Refund records sections, with
  desktop tables, mobile cards, and a detail drawer modeled on payment
  verification.
- The drawer shows order/payment identifiers, buyer and seller details, reason,
  evidence, return progress, and the existing approve, reject, and refund actions.
- Added the verified-admin `admin:listRecordedRefunds` query for closed refunds,
  including amount, disbursement method, reference, and date.
- Stall details now include completed refunds in the refund total and order
  history, with recorded method/reference, and link directly to the Refund
  records section.
- Added search across pending and recorded refunds by order ID, buyer, stall,
  payment/refund reference, courier, and courier tracking number.
- Build passes; lint passes with existing warnings.

### Platform admin dashboard (implemented)

- `/admin` is now the first sidebar and mobile drawer item, with GCash balance
  ownership groups, reconciliation history/form, income metrics, action queues,
  7/30/90-day trend tabs, top stall balances, and recent platform activity.
- Added the verified-admin `finance:getAdminDashboard` read model. Expected
  balance includes approved buyer payments, approved deposits, and approved
  COD commission payments, less recorded payouts and GCash refunds. The
  reconciliation mutation and append-only table remain in place.
- Removed reconciliation from Stall Accounts and linked back to the dashboard.
- Shared GCash seller owed projections include unpaid, non-refunded orders
  outside an active return hold, keeping dashboard and stall/seller views aligned.
- Buyer obligations include paid cancelled orders and returns still in the
  refund workflow across both payment methods, so a pending COD refund also
  appears in the buyer owed figure.
- `npm run build` passes. `npm run lint` passes with existing warnings. A live
  transaction walkthrough and signed-in responsive browser check remain release
  follow-up because no authenticated browser session is available here.

### Stall security deposit ledger (implemented)

- Added the separate `stallDeposits` submission ledger with normalized unique
  references, attempt numbers, submit/review events, actual approved amounts,
  required rejection reasons, and verified-admin audit entries.
- Signup supports a full or partial GCash deposit or skip-for-now; seller stall
  page shows balance, due date, countdown/overdue state, and submission history.
- Admin deposit review includes verified-email checks on every query/mutation,
  summary totals, status/date/search filters, server pagination, CSV export,
  per-stall balances, duplicate-reference override, and event timeline.
- Seller notifications cover submit, approval, rejection, reminders, and
  overdue. Admin receives a live submission notification and pending badge.
- Deposit totals are derived server-side from submission records. The ledger
  stays separate from sales, order acceptance, payout eligibility/requests,
  and commission. Overdue deposits do not hide or suspend stalls.
- `npm run build` and `npm run lint` pass. Authenticated browser walkthrough
  and deployment sync remain release follow-up.

### GCash payout commission (implemented)

- Completed GCash orders snapshot their 5% items-subtotal commission and net payout; COD orders remain unchanged.
- Added the idempotent `platformCommissions` ledger with pending, collected, and reversed statuses and append-only events. Legacy completed orders backfill once when sellers open earnings; a legacy order refunded during an active return is backfilled as reversed at refund closeout.
- Payout requests snapshot per-order items subtotal, delivery fee, commission, net payout, and completion time. The server calculates request totals from those snapshots.
- Seller earnings and payout history show the full breakdown, transfer reference, and decision date. Admin payout review shows request and per-order breakdowns.
- Admin payout reads and decisions recheck the verified allowlisted email. Payout actions use keyed `usePendingAction` guards.
- COD commissions now use the shared 5% rate and ₱50 invoice minimum; deposit and offset behavior is unchanged. `npm run build` and `npm run lint` pass; authenticated walkthrough remains release follow-up.

### Finance ledger (implemented)

- Added `/admin/finance` with three server-derived sections: COD commission owed to the platform, GCash held for stalls, and platform commission earned. Admin queries recheck the verified allowlisted email.
- Section A derives unbilled, invoiced, overdue, collected, and waived amounts from `commissionAccruals`, `commissionInvoices`, and approved `commissionPayments` through `resolveReceivableLedger`; paid orders can be partially collected without being marked paid.
- Section B derives total GCash received, in-return-window, payout-ready, payout-requested, paid-out, on-hold, refunded, needs-refund, owed-to-sellers, commission-kept, and expected GCash balance from paid GCash orders, payout requests, and `platformCommissions`.
- Section C derives pending, collected, and reversed GCash commission plus collected COD commission; today/week/month/all-time collection figures use collection timestamps independently of the selected order-date range.
- Added date-range filtering, per-stall grouped columns with drill-down, section record drawers, and CSV exports for each section, per-stall totals, and reconciliations.
- Added the append-only `financeReconciliations` table and verified-admin mutation to record actual GCash balance, server-derived expected balance, difference, period, admin email, and timestamp. The finance page shows reconciliation history.
- Seller earnings and commissions now reuse the same `finance:getSellerFinance` calculations for funds held, payout readiness, and COD commission totals.
- Added `finance:getAdminFinance`, `finance:getAdminFinanceStall`, `finance:recordReconciliation`, and `finance:getSellerFinance`. `npx convex codegen` updated the generated API bindings.
- `npm run build` and `npm run lint` pass. Authenticated deployment walkthrough and production reconciliation validation remain.

### Foundation

- Next.js 16 App Router scaffold, TypeScript strict, Tailwind CSS 4,
  ESLint 9.
- Global providers wired in `app/layout.tsx`: `ClerkProvider` →
  `ConvexClientProvider` → `AntdProvider` (antd 6 + `AntdRegistry`).
- Route guard in `proxy.ts`; only `/`, `/signin`, `/signup`, and the
  listed `/api` routes are public.
- Fonts loaded via `next/font/google`: Geist Sans, Geist Mono,
  Newsreader.
- Design tokens in `app/globals.css` (`@theme`) and the antd token
  block in `components/AntdProvider.tsx`.

### Auth and roles

- Clerk sign-in and sign-up with a role choice (buyer / farmer).
- Multi-step sign-up wizard: auth → profile → stall (sellers) → review.
- `POST /api/clerk/role` writes `publicMetadata.role` on Clerk.
- Convex `users` table mirrors Clerk identity; `useConvexUserSync`
  reconciles the session with the `users` document.
- Onboarding persistence via `convex/users.completeOnboarding` and
  `convex/users.setRole`.

### Buyer surface

- Landing page, home feed, shops directory, shop detail, product detail
  with gallery, reviews, and related items.
- Category chips, filter sheet, sort bar, and text search
  (`lib/search.ts`).
- Server-backed cart grouped by seller, with per-seller delivery fee
  and a cart badge in the shell.
- Cart item selection for checkout: per-item and per-seller checkboxes
  plus a select-all toggle. Cart subtotal, delivery fee (only for
  sellers with selected items), and total count selected items only.
  Checkout lists only selected items, and `orders.placeOrders` accepts
  the selected product IDs, orders just those, and removes only those
  from the cart (unselected items stay for later). The nav badge keeps
  showing the full cart count; new items default to selected.
- Checkout: address selection / inline add / inline edit, PSGC cascade
  fetching, per-seller note, confirmation modal, success screen.
- Cart line quantity on mobile uses a touch-friendly stepper
  (44px − / + buttons, disabled at 1 and max stock) instead of the
  compact `InputNumber`; larger screens keep the numeric input.
- Orders list with status tabs, order detail with an event timeline and
  a stepper, cancel, confirm receipt (which completes the order), and
  refund request.
- Profile: edit profile, address book with a single default address,
  address form modal.
- Buyer order list and details redesigned with four grouped filters,
  no summary dashboard, product summaries, muted status badges, visible
  progress, and clearer payment, delivery, and return sections.
- Product and shop detail pages no longer show a duplicate back arrow in
  the mobile buyer shell header; the in-page back control is the single
  mobile back affordance on those routes.
- Buyer home now opens with a responsive carousel (`HomeCarousel`) above
  the search bar. Three slides cover fruits & vegetables, system
  features, and about the system, each with imagery, copy, and a CTA into
  the shops directory. Slide content lives in `constants/homeSlides.ts`;
  the carousel autoplays, supports drag, and uses custom dot controls.
  The home skeleton reserves a matching carousel placeholder.
- Buyer home is mobile-first: on screens below `lg` the category
  selection is a horizontally scrollable chip row (edge-to-edge, hidden
  scrollbar, same pill style as the desktop sidebar) instead of a
  cramped dropdown, and `SortFilterBar` stacks it above a full-width
  sort select plus filters button. The now-unused `CategorySelect`
  dropdown component was removed.

### Seller surface

- Seller shell with 8 sections and a mobile drawer.
- Onboarding: stall creation with farm type, full address, delivery
  fee, pickup availability, and government ID for verification.
- Dashboard with today's orders, pending, in-transit, completed,
  cancelled, and total sales.
- Product management: list, create, edit, archive/delete, mark out of
  stock, with Cloudinary multi-image upload.
- Order management: confirm, reject with a reason, dispatch, complete;
  order list and details now open without summary dashboards and use
  grouped filters, muted status badges, product summaries, and a clear
  fulfilment progress display.
- Stall profile editing, earnings view, reviews view with reply,
  notifications view, settings.
- `/seller/sales` shows completed COD and GCash orders from immutable
  order snapshots, filtered server-side with paginated rows and CSV export.

### Orders, stock, and payments (COD)

- `orders.placeOrders` splits the cart into one order per seller with
  per-seller delivery fees and notes, validates stock, and clears the
  cart atomically.
- Full status machine with `assertStatus` guards and an append-only
  `events` log: `pending → confirmed → to-receive → delivered →
  completed`. Buyer confirmation records delivery and completion
  together; with the return branch `refund-requested` →
  `return-approved` → `return-in-transit` → `return-received` →
  `refunded`, or rejection back to the prior delivered/completed state.
- Stock decremented on seller confirm, restored on cancel/reject. A
  return does not automatically restock goods.
- Buyers can request a return within 24 hours of delivery or completion,
  with the order ID, required reason, and 1–5 Cloudinary photo/video
  evidence files (5 MB each). Admins review the order ID, payment
  reference, reason and evidence; approve with the seller return address
  or reject with a reason. The buyer records courier/tracking details,
  the seller confirms returned-goods receipt, and the admin records the
  refund reference before releasing the payout hold. The admin review
  also shows the buyer's saved phone/GCash number for sending the refund.
  Refund closeout records the disbursement method, full order amount, and
  GCash transfer or cash receipt reference. COD is treated as a separate
  outgoing payment after cash was collected on delivery.
- COD `paymentStatus` flips to `paid` when the buyer confirms delivery.
- GCash checkout is in scope: select the method, download the configured
  QR, copy the configured account number, view the expected total, and
  submit the unique payment note and transaction reference number only.
- Live admin payment notifications, approval, rejection with a reason,
  seller fulfilment unlock, and buyer resubmission are implemented.
- Checkout payment records retain submission, resubmission, approval, and
  rejection events with actor, reference, expected total, timestamp, and
  reason. Review decisions record reviewer and time; admin approval confirms
  GCash history verification, blocks previously approved duplicate references
  unless a written override is supplied, and appends an admin audit log.
- `/admin/payments` has Pending, Approved, Rejected, and All tabs, live
  pending count, server pagination, search and date filters, summary amounts,
  a detail drawer with order/payout breakdown and timeline, and filtered CSV
  export. Paid cancelled orders show a Needs refund flag.
- Buyer order details show payment attempts and rejection reasons; seller
  order details show GCash approval date without displaying the buyer's
  reference. Buyer resubmission still requires a new reference number only.
- Reviews with 1–5 stars, an optional product reference, and a single
  seller reply.
- Admin sign-in promotes the verified, allowlisted Clerk account and
  routes to `/admin`, with a server-guarded admin shell and sidebar links
  for GCash account management, payment verification, payout approval,
  return review, and seller verification. GCash account management,
  payment review, and the full audited return workflow through refund
  closeout are implemented. Seller verification remains unimplemented.
- `/admin/sales` shows platform totals and per-stall totals, with verified
  admin authorization in the Convex query, stall drill-down, filters,
  pagination, and CSV export. Refunded orders remain visible and are
  excluded from totals on both seller and admin views.
- Seller earnings now use paid Convex orders and distinguish GCash from COD.
  The earnings page shows separate GCash and COD sales; COD cash is handed
  directly to the seller on delivery, so COD orders never enter the payout
  queue. Only completed GCash orders can be selected for payout, after the
  24-hour return window. All sales totals exclude orders whose return has been
  refunded. The order list shows dates and payout status. Sellers select
  specific ready GCash orders; requests snapshot
  each selected order and its amount. Multiple requests can be pending when
  they contain different orders. Orders with a pending refund remain on hold.
  Eligibility starts after the 24-hour buyer return window and excludes
  already reserved orders.
- Admin payout review shows stall identity, location, verification status,
  submitted ID details, GCash destination, requested amount, and selected
  order dates, payment methods, and amounts.
  Admins can reject with a reason or record a sent transfer with its
  reference. Paid/rejected actions are written to the admin audit log, and
  rejected requests release their orders.

### Reliability

- Buyer must confirm in a second step before marking an order received. The
  prompt explains that confirmation completes the order and stays open if the
  mutation fails.
- Return-request eligibility is now enforced in the UI as well as the server.
  A shared `RETURN_REQUEST_WINDOW_MS` and `RETURN_WINDOW_CLOSED_MESSAGE`
  live in `constants/refunds.ts` and are reused by `convex/orders.ts` and
  `OrderActions`. Once 24 hours have elapsed since `deliveredAt`, the buyer
  sees a disabled "Return window closed" button instead of a working
  "Request refund" button, so a closed window no longer surfaces only as a
  mutation error.
- All seven active order mutations are double-submit safe. `usePendingAction`
  (`hooks/usePendingAction.ts`) keys in-flight calls by
  `ORDER_ACTION_KEYS` (`constants/orders.ts`) and blocks same-tick
  duplicate calls with a synchronous ref, so a rapid double click on
  "Confirm received" can no longer send a second `confirmDelivery` for
  an order the first call already moved to `delivered`. Action buttons
  and modal OK buttons show antd `loading`/`disabled` while in flight,
  and modals now close only when the call reports `success`.
  `assertStatus` in `convex/orders.ts` remains the authoritative
  server-side guard.

### Buyer and seller messaging

- Added persistent buyer/seller conversations and text messages in Convex.
  Buyers can open a conversation from the shops directory and buyer order
  details; either participant can open the thread from order details.
- Added Messages tabs for both roles, with live conversation lists and replies.
  Messages are limited to 2,000 characters and reads/sends verify participant
  access on the server.
- Added per-participant unread counts and unread message count badges in
  both navigation sidebars. Seller-authored messages display the stall name,
  not the stall owner's personal name.
- Redesigned the messaging experience with cleanly separated Inbox and Chat Room views:
  - **Dedicated Inbox View**: Spacious card layout with instant search bar, filter tabs (All, Unread, Orders), conversation counters, role tags, attached order tags, last message snippet with timestamps, unread badges, and role-tailored empty states with CTAs.
  - **Dedicated Chat Room View**: Focused full-width conversation area with prominent "Back to Inbox" navigation, header with contact details, quick conversation switcher drawer for desktop multitasking, linked order context card with live order status and direct link, message history grouped by date, auto-scrolling message stream, role-specific quick reply suggestion chips (buyer & seller), and composer with keyboard shortcuts and character counter.
  - **Type & Constant Architecture**: Created `types/message.ts` and `constants/messages.ts` for clean type safety and centralized configuration. Updated `convex/messages.ts` to hydrate order summaries reactively.

### Buyer and seller notifications

- Added persistent buyer and seller notification queries and read mutations in Convex, with unread counts in both navigation sidebars.
- Kept legacy notification records valid during schema rollout by making `role` optional and accepting the existing `refId` field. The development deployment is synced with the public notification queries.

### Admin access foundation

- The initial admin account is `carbonellalex955@gmail.com`. After a
  successful Clerk sign-in, the authenticated user is promoted to the
  admin role only when that exact primary email matches.
- `/admin/*` is protected by Clerk and performs a server-side email and
  role check in the shared layout. The responsive admin shell provides
  desktop sidebar navigation and a mobile drawer.
- The GCash account page lets the verified allowlisted admin upload a QR
  image to Cloudinary and save it with a Philippine mobile number in
  Convex. Reads and writes recheck the verified admin email in Convex;
  each update appends an audit entry with prior and new values. The
  settings screen uses a responsive account form beside a portrait QR preview
  sized to 720 × 1256 pixels, with Geist Sans typography throughout.

## In Progress

- Buyer profile and seller settings both sign out through Clerk and return
  to the landing page.
- Sign-in uses the landing page's role check so seller accounts reach the
  seller dashboard and buyer accounts reach buyer home.
- Sign-in supports password or one-time email code, including email
  code verification when Clerk requires an extra factor. Password sign-in
  uses Clerk's factor-specific method and reports incomplete states clearly.
- Redesigned the admin stalls page (`/admin/stalls`) and stall detail page
  (`/admin/stalls/[stallId]`) into dashboards with balance cards, attention
  lists, and records navigation for better UX.

## Next Up

- Complete and compare Stall Accounts against finance, receivables, and sales;
  the legacy admin routes now redirect to `/admin/stalls`, and their sidebar
  and mobile drawer links have been removed. The old page components and
  shared queries remain until parity verification is complete.
- Add server-filtered pagination/sorting, reconciliation form and exports,
  detailed order/ledger tabs, and the authenticated refund/deposit/payout flow.
- Verify seller parity and server-side ownership, then remove and redirect the
  replaced admin routes.
- Run the authenticated finance walkthrough against real orders, payouts,
  refunds, and reconciliations; verify expected GCash against the admin account.
- Implement seller verification after its data and audit requirements
  are specified.
- Add an actor that moves stall verification status to verified.
- Replace the demo/mock session layer with Convex-only reads for signed-in users.
- Restore or reseed the dev COD fixture and verify the Platform Unbilled
  amount against the actual seller finance and commissions responses.

### COD commissions (implemented)

- Added commission accrual, invoice, and payment ledgers with indexes; completed COD deliveries create an idempotent commission accrual at the shared 5% `COMMISSION_RATE`, rounded to two decimals per order. Legacy accrual amounts are not recalculated; new accruals store an optional rate snapshot.
- Added weekly invoice issuance at the ₱50 minimum, reminders, seller notifications, payment submission, verified-admin review, and seller/admin page surfaces.
- Added `/admin/receivables` and a per-accrual receivables panel to seller commissions. Both use the same server query; admin authorization checks the verified allowlisted email. Status and totals are derived from source accruals, invoices, and approved payments, including oldest-accrual-first handling of partial payments. Waived accruals remain listed and do not count as owed.
- Receivable filters, indexed date/stall reads, server pagination, stall summaries and drill-down, linked invoice/payment details, and filtered CSV export are available to admin. Seller summaries include unbilled, invoiced, overdue, paid, and waived amounts.
- Seller and admin sales pages now show commission amount, status, invoice number, and filtered-range commission accrued/collected totals for COD orders; GCash rows show n/a.
- `npm run build` and `npm run lint` pass. Authenticated deployment walkthrough remains.
- Scenario verification: a ₱1,000 COD order accrues ₱50; ₱1,000, ₱2,400, and ₱600 orders accrue ₱50, ₱120, and ₱30, respectively, then qualify together for one ₱200 invoice. Existing accruals retain their stored amount and are skipped by the idempotent accrual path. GCash still skips COD receivable accrual.

## Open Questions

- Stall Accounts still needs an authenticated scenario walkthrough covering
  refunds, held returns, unpaid COD invoices, partial deposits, and
  reconciliation history before legacy admin pages can be removed.

- The refund process for cancelled GCash orders with an approved payment is
  still undefined; the admin queue flags these as Needs refund for follow-up.
- Whether and when the seller deposit is refunded, and what it can be
  deducted for, is undecided.
- Deposit overpayments are blocked by the remaining-balance cap.
- Deducting overdue commission from a security deposit is out of scope.
- Whether commission applies to the delivery fee is out of scope; current behavior excludes it and uses items subtotal only.
- Blocking overdue sellers from accepting new COD orders is out of scope.

## Session Notes

- Deposit ledger fields are optional for legacy stalls and submission rows;
  the hourly worker backfills deadlines, tracks overdue status, and sends
  seller deadline reminders. Status and all financial totals are derived
  from approved submission records.
- Authenticated end-to-end walkthrough and syncing the schema/functions to
  the intended Convex deployment remain release follow-up.

## Architecture Decisions

- **Convex over a traditional API + ORM** — reactive queries give live
  cart, order, and review updates with no polling, and the entire
  backend is type-safe end to end.
- **One order per seller, created at checkout** — a cart spanning three
  stalls becomes three orders, each with its own delivery fee. Keeps
  fulfilment, stock, and payment independent per seller.
- **Immutable line-item snapshots on the order** — `sellerName`,
  `sellerLocation`, and every item's name, price, unit, and image are
  copied at checkout so a later product edit or stall rename never
  rewrites history.
- **Stock reserved on seller confirm, not on order placement** — lets a
  buyer cancel freely while still preventing oversell once a seller has
  committed. Restoration is a no-op unless `confirmedAt` is set.
- **Append-only `events` array on the order** — a single audit trail
  that powers the timeline, the status tabs, and future notifications
  without a separate history table.
- **COD and manual GCash proof as payment methods** — COD becomes paid
  when delivery is confirmed; GCash uses one payment per checkout, linked
  to each seller order with a unique payment note. Submission awaits
  admin review; approval marks it paid and unlocks fulfilment. Rejection
  is reasoned and resubmittable.
- **Cloudinary for media, Convex for URLs** — keeps documents small and
  lets images be transformed and cached at the CDN.
- **Clerk `publicMetadata.role` mirrored into `users.role`** — Clerk
  metadata is convenient in middleware, the Convex copy is queryable and
  survives a Clerk metadata reset.
- **Mock/demo layer alongside Convex** — the landing page and
  unauthenticated browse work with no backend, and a hook can fall back
  to mock data until its Convex counterpart lands.
- **Tailwind for layout, antd for components, tokens in one place** —
  avoids fighting antd's internals with utility overrides and keeps the
  visual system changeable from a single file.

## Session Notes

- GCash checkout reuses the admin-configured account and QR; buyers submit
  a reference number only. Admins compare it and the displayed expected
  amount against their GCash transaction history. A unique payment note
  and append-only review history link the seller orders. Admin payment
  status changes appear in the buyer's reactive order view.
- GCash proof collection was simplified: no buyer-entered amount, sender
  identity, receipt upload, or receipt image is collected. Admins see the
  expected amount calculated from grouped order totals and verify the
  submitted reference manually.
- Verification for this project is `npm run build` + `npm run lint`
  plus a manual walkthrough — there is no test script.
- `convex/_generated/ai/guidelines.md` must be read before touching any
  Convex code; it overrides training-data knowledge of Convex.
- The `nextjs-agent-rules` block at the top of `AGENTS.md` is
  regenerated by `next dev`. Commit it with your work instead of
  removing it from the diff.






### Signup stall GCash info (implemented)
- Seller signup stall step now displays the platform GCash QR and account number (fetched via `deposits:getPublicGcashSettings`) with copy/download actions, alongside the required deposit amount.
