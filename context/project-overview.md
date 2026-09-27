# AgriMarket

## Overview

AgriMarket is a two-sided marketplace that connects smallholder farmers
and local producers in the Philippines directly with buyers — no
middlemen. A seller creates a stall, lists farm goods with per-kilo /
per-bundle pricing and stock, and sets a delivery fee. A buyer browses
shops and products, fills a cart, checks out with a per-seller delivery
fee and Cash on Delivery, and follows the order through
`pending → confirmed → to-receive → delivered → completed`, with a
refund branch off `delivered`. Sellers manage the catalogue, orders,
earnings, and reviews from a dedicated seller area.

The product is Philippine-first: addresses are full PSGC
region/province/city/barangay cascades, prices are in PHP peso, mobile
numbers are validated as `+63 9XXXXXXXXX`, and delivery is
courier-handled with per-stall fees.

## Goals

1. A buyer can go from landing page to a placed order in under two
   minutes on a 375px-wide phone.
2. A seller can onboard (profile + stall + ID verification), list a
   product with photos, and fulfil an order without leaving the app.
3. Order state is always consistent: stock, payment status, and the
   buyer's/seller's order lists never disagree with the order document.
4. Money flows stay offline and auditable in v1 — Cash on Delivery with
   an explicit `unpaid → paid` transition recorded in the order event
   log.

## Core User Flow

### Buyer

1. Lands on `/`, chooses **Buy** or **Sell**.
2. Signs up via Clerk with a role, completes a 3-step profile step
   (name, birthday, mobile).
3. Browses `/home` (featured + recent) or `/shops` → `/shops/[id]` →
   `/products/[id]`.
4. Adds items to the cart; the cart groups line items by seller.
5. Goes to `/checkout`: picks a delivery address (from the address book
   or inline), adds a per-seller note, reviews the summary.
6. Confirms → `orders.placeOrders` splits the cart into **one order per
   seller**, each with that seller's delivery fee.
7. Tracks the order in `/orders` → `/orders/[id]`, confirms receipt,
   then leaves a review.

### Seller

1. Signs up with the **seller** role and completes the onboarding wizard.
2. Creates a stall: name, description, photo, farm type, full address,
   delivery fee, pickup availability, and government ID for
   verification.
3. Lists products: name, category (fruits/vegetables/grains), price,
   unit (kg/bundle/piece), stock, harvest + expiry dates, description,
   and up to multiple images uploaded to Cloudinary.
4. Accepts or rejects incoming orders (`pending`), then dispatches
   (`confirmed → to-receive`) and completes after delivery.
5. Reviews earnings, buyer reviews, and notifications; edits stall and
   settings.

## Features

### Identity and access

- Clerk authentication with `buyer` / `seller` roles mirrored into
  Convex `users.role` and Clerk `publicMetadata`.
- Route protection in `proxy.ts` — everything is authenticated except
  `/`, `/signin`, `/signup`, and the listed `/api` routes.
- Multi-step seller onboarding (profile → stall → review) with a
  persisted draft in `hooks/useSellerOnboarding.ts`.
- Profile editing and a delivery address book with a single default
  address.

### Catalog and discovery

- Stalls with photo, farm type, location, rating, rating count,
  delivery fee, and pickup availability.
- Products with category, unit, price, stock, harvest/expiry dates, and
  an image gallery.
- Category chips, a filter sheet, sort options, and text search across
  stalls and products.
- Public seller profile at `/sellers/[id]`.

### Cart and checkout

- Server-backed cart (`cartItems` table) with per-user quantity edits
  and removal.
- Cart grouped by seller, each group carrying its own delivery fee.
- Checkout validates the full delivery address (name, `+63` mobile,
  region/province/city/barangay, street, 4-digit postal code) before
  the order can be placed.
- Per-seller note attached to the resulting order.
- Confirmation modal, then a success screen listing the created orders.

### Orders

- Status tabs across all eight order statuses, an event timeline, and
  a stepper.
- Buyer actions: cancel (`pending`), confirm receipt (`to-receive`),
  request refund (`delivered`, reason 10–500 chars).
- Seller actions: confirm, reject, dispatch, complete, approve refund,
  reject refund.
- Stock is reserved on seller confirm and restored on cancel, reject,
  and refund approval.

### Payments

- **Cash on Delivery** only. `orders.paymentMethod` is
  `v.literal("cod")` and `paymentStatus` is `unpaid` until the buyer
  confirms delivery, which flips it to `paid`.
- Delivery fee is per seller and is copied onto each order at checkout.

### Reviews and trust

- One review per order (optionally per product), 1–5 stars plus a
  comment.
- Sellers can reply to a review once; the reply is timestamped.
- Stall rating and rating count are maintained on the stall document.

### Seller area

- Dashboard with today's orders, pending, in-transit, completed,
  cancelled, and total sales.
- Earnings view (currently mock-backed in `lib/mockEarnings.ts`).
- Notifications view (currently mock-backed in
  `lib/mockNotifications.ts`).

### GCash (planned — not built)

Documented here as the next payment feature. **No code exists for it
yet** — the schema, `constants/orders.ts`, and
`components/checkout/PaymentMethodCard.tsx` are still COD-only. See
"Next Up" in `progress-tracker.md` and the open questions below before
implementing.

Target behavior:

- The buyer chooses **Cash on Delivery** or **GCash** at checkout.
- With GCash, the order is created as `paymentMethod: "gcash"`,
  `paymentStatus: "unpaid"`, and the buyer is shown a per-order GCash
  reference (checkout reference derived from the order id) plus a
  QR / instruction to send the exact total.
- The buyer marks the order as **"I have sent the payment"**, which
  moves the order to a `payment-pending` review state visible to the
  seller.
- The seller confirms receipt of the transfer, which sets
  `paymentStatus: "paid"` and advances the order to `confirmed`.
- Every GCash transition is appended to the same `events` log the
  existing lifecycle uses, so the order timeline stays uniform.
- Seller earnings gain a "pending GCash verification" bucket so
  transfers that were never confirmed are visible.

## Scope

### In Scope

- Philippines-only marketplace, PHP pricing, PSGC address cascade.
- Buyer and seller roles with a full order lifecycle on COD.
- Cloudinary-hosted product and stall imagery.
- Reviews, ratings, per-seller delivery fees, and seller earnings.
- GCash as a second payment method on top of COD (planned).

### Out of Scope

- Payments other than COD and GCash (no cards, no bank transfer, no
  wallets such as Maya).
- Admin panel, vendor admin review, and manual stall verification
  approval — `stall.verification.status` exists but no actor currently
  moves it to `verified`.
- Multi-vendor consolidated shipping or a single combined payment
  across sellers; one checkout deliberately produces one order per
  seller.
- Real-time chat or messaging between buyer and seller.
- Push notifications — the seller notification center is in-app only.
- Delivery tracking maps, courier integration, and driver apps.

## Success Criteria

1. An unauthenticated visitor sees the landing page; every other route
   redirects to sign-in.
2. A signed-in buyer can add a product to the cart, check out with a
   saved address, and land on a success screen showing exactly one
   order per seller in the cart, each with that seller's delivery fee.
3. A seller can create a stall, publish a product with an uploaded
   image, and see it appear on `/home` and in `/shops` for buyers.
4. `npm run build` and `npm run lint` pass with no errors, and the
   order status machine rejects every illegal transition with a
   user-readable message.
5. Every screen that renders remote data shows a `Skeleton` while
   loading and an `Alert`/`Result` on error — no blank states.
