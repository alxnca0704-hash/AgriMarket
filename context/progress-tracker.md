# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Feature-complete MVP. The buyer journey, the seller journey, and the
full Cash-on-Delivery order lifecycle are built and wired to Convex.

## Current Goal

Support COD and GCash checkout, including buyer-submitted payment proof,
while maintaining the seller order lifecycle and responsive buyer experience.

## Completed

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
- Checkout: address selection / inline add / inline edit, PSGC cascade
  fetching, per-seller note, confirmation modal, success screen.
- Orders list with status tabs, order detail with an event timeline and
  a stepper, cancel, confirm receipt (which completes the order), and
  refund request.
- Profile: edit profile, address book with a single default address,
  address form modal.
- Buyer order list and details redesigned with four grouped filters,
  no summary dashboard, product summaries, muted status badges, visible
  progress, and clearer payment, delivery, and return sections.

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
- Buyer and seller order details show the GCash reference and payment
  review state. Buyer resubmission requires a new reference number only.
- Reviews with 1–5 stars, an optional product reference, and a single
  seller reply.
- Admin sign-in promotes the verified, allowlisted Clerk account and
  routes to `/admin`, with a server-guarded admin shell and sidebar links
  for GCash account management, payment verification, payout approval,
  return review, and seller verification. GCash account management,
  payment review, and the full audited return workflow through refund
  closeout are implemented. Payout and seller verification remain
  unimplemented.

### Reliability

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

## Next Up

- Implement payout handling that excludes orders with an active return
  hold; define payout records and audit requirements first.
- Implement seller verification after its data and audit requirements
  are specified.
- Move seller earnings and notifications off the mock layer in lib/ onto Convex.
- Add an actor that moves stall verification status to verified.
- Replace the demo/mock session layer with Convex-only reads for signed-in users.

## Open Questions

- How canceled GCash orders with a submitted transfer should be
  reconciled still needs a defined refund process.

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
