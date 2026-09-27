# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Feature-complete MVP. The buyer journey, the seller journey, and the
full Cash-on-Delivery order lifecycle are built and wired to Convex.
The next phase is online payments, starting with GCash.

## Current Goal

Design (not yet implement) GCash as a second payment method on top of
COD. The context files describe the target behavior; no code exists for
it. The open questions below must be answered before the first
implementation step.

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
  a stepper, cancel, confirm receipt, and refund request.
- Profile: edit profile, address book with a single default address,
  address form modal.

### Seller surface

- Seller shell with 8 sections and a mobile drawer.
- Onboarding: stall creation with farm type, full address, delivery
  fee, pickup availability, and government ID for verification.
- Dashboard with today's orders, pending, in-transit, completed,
  cancelled, and total sales.
- Product management: list, create, edit, archive/delete, mark out of
  stock, with Cloudinary multi-image upload.
- Order management: confirm, reject with a reason, dispatch, complete.
- Stall profile editing, earnings view, reviews view with reply,
  notifications view, settings.

### Orders, stock, and payments (COD)

- `orders.placeOrders` splits the cart into one order per seller with
  per-seller delivery fees and notes, validates stock, and clears the
  cart atomically.
- Full status machine with `assertStatus` guards and an append-only
  `events` log: `pending → confirmed → to-receive → delivered →
  completed`, with `cancelled` off `pending` and the refund branch
  (`refund-requested` → `refunded` or back to `delivered`) off
  `delivered`.
- Stock decremented on seller confirm, restored on cancel, reject, and
  refund approval.
- COD only: `paymentStatus` flips to `paid` when the buyer confirms
  delivery.
- Reviews with 1–5 stars, an optional product reference, and a single
  seller reply.

## In Progress

- None. The GCash work is specified in `project-overview.md` and
  blocked on the open questions below.

## Next Up

### 1. GCash payment method (specified, not built)

Order of work — each step is its own unit:

1. **Schema and constants** — widen `orders.paymentMethod` to
   `v.union(v.literal("cod"), v.literal("gcash"))` in
   `convex/schema.ts` and `convex/shared.ts`; add `PAYMENT_METHOD.GCASH`
   to `constants/orders.ts`; add the GCash payment fields to
   `types/order.ts` and the Convex → app mapping in
   `lib/convexSync.ts`. Include a migration plan for existing rows
   (`@convex-dev/migrations`).
2. **Order state machine** — decide and implement where "buyer sent the
   transfer" and "seller confirmed receipt" sit in the status graph, add
   the guard helpers, and append to `events`.
3. **Checkout selection** — turn `PaymentMethodCard` into a real
   selector, thread the choice through `useCheckout` into
   `placeOrders`, and validate server-side.
4. **Buyer GCash instructions + reference** — per-order reference
   number and amount, an explicit "I have sent the payment" action, and
   a pending-payment state in the order detail and timeline.
5. **Seller verification** — a "confirm GCash received" action that
   sets `paymentStatus: "paid"` and advances the order, plus a
   "pending GCash verification" bucket on the earnings view.
6. **Copy and states** — empty, error, and pending states for every new
   surface, and the muted token treatment for a GCash option (no
   saturated brand blue).

### 2. After GCash

- Move seller earnings and notifications off the mock layer in `lib/`
  onto Convex.
- An actor that moves `stall.verification.status` to `verified`
  (admin review or an auto-approval rule).
- Replace the demo/mock session layer with Convex-only reads for signed
  in users.

## Open Questions

- **Payment timing for GCash.** Should the seller be able to confirm
  (reserve stock) before the transfer is verified, or must GCash
  verification come first? This changes the status graph.
- **Status graph.** Do "payment sent" and "payment verified" become new
  `OrderStatus` values, or a separate `paymentStatus` field
  (`unpaid` / `sent` / `paid` / `failed`) with the order status
  unchanged? A separate field is probably cleaner but it means
  `PaymentStatus` in `types/order.ts` needs its own timeline surface.
- **Seller GCash account.** Where is the receiving GCash number stored —
  on the stall, on the seller profile, or in Convex env config? Per
  seller is almost certainly right, but it is a new field on two
  possible documents.
- **Reference number format.** Should the buyer send using a unique
  per-order reference (derived from the order id) or the plain order id?
  A derived reference prevents mismatched transfers but needs a defined
  algorithm and a collision check.
- **Multiple sellers in one checkout.** One checkout creates one order
  per seller, so GCash means N separate transfers for N sellers. Confirm
  this is acceptable, or whether GCash orders must be limited to a single
  seller per checkout.
- **Fee and rounding.** Does the GCash transfer amount include the
  per-seller delivery fee? Are transfer fees absorbed by the seller or
  added to the buyer total?
- **Failed or reversed transfers.** What happens when a buyer claims to
  have sent a transfer that never arrived, and who resolves it? Is a
  dispute status needed, or does the seller simply never confirm?
- **Refunds for GCash.** Approving a refund currently restores stock and
  marks the order `refunded`; for GCash the money has to go back out via
  a transfer. Who initiates it, and is a `refund-paid` event needed?
- **Offline / feature-flagged rollout.** Should GCash ship behind a flag
  so COD remains available everywhere?

## Architecture Decisions

- **Convex over a traditional API + ORM** — reactive queries give live
  cart, order, and review updates with no polling, and the entire
  backend is type-safe end to end.
- **One order per seller, created at checkout** — a cart spanning three
  stalls becomes three orders, each with its own delivery fee. Keeps
  fulfilment, stock, and payment independent per seller. Consequence:
  online payments must be per order, not per checkout.
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
- **COD as the first payment method** — no payment integration is needed
  to launch, and it is how most produce is sold locally.
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

- The GCash feature is **specified only**. Nothing about it is
  implemented: `orders.paymentMethod` is still `v.literal("cod")`,
  `constants/orders.ts` has only `PAYMENT_METHOD.COD`, and
  `components/checkout/PaymentMethodCard.tsx` hardcodes the COD copy.
  Start from "Next Up → 1" and settle the open questions first.
- Verification for this project is `npm run build` + `npm run lint`
  plus a manual walkthrough — there is no test script.
- `convex/_generated/ai/guidelines.md` must be read before touching any
  Convex code; it overrides training-data knowledge of Convex.
- The `nextjs-agent-rules` block at the top of `AGENTS.md` is
  regenerated by `next dev`. Commit it with your work instead of
  removing it from the diff.
