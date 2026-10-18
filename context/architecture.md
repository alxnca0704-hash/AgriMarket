# Architecture Context

## Stack

| Layer            | Technology                                          | Role                                                              |
| ---------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| Framework        | Next.js 16 App Router, React 19, TypeScript 5        | Routing, server/client components, build                          |
| UI kit           | Ant Design 6 + `@ant-design/nextjs-registry`        | Reusable components, SSR style extraction, theming                |
| Styling          | Tailwind CSS 4 (`@theme` tokens in `globals.css`)    | Layout, spacing, responsiveness only                              |
| Icons            | `@ant-design/icons`                                 | Single icon set across the app                                    |
| Auth             | Clerk (`@clerk/nextjs` 7)                          | Sessions, sign-in/up UI, JWT identity for Convex                  |
| Backend / DB     | Convex 1.x                                          | Reactive database, queries, mutations, optimistic updates          |
| Media            | Cloudinary v2                                       | Product and stall image storage                                   |
| Addresses        | `phil-address` + `constants/phLocations.ts`         | PSGC region → province → city → barangay cascade                  |
| Route guard      | `proxy.ts` (`clerkMiddleware` + `createRouteMatcher`) | Blocks unauthenticated access to every non-public route          |

## System Boundaries

- `app/` — Next.js route tree only. Route groups: `(buyer)`,
  `(checkout)`, and `seller/` each own a `layout.tsx` that renders the
  matching shell. `app/api/**/route.ts` holds the only server-side
  handlers (Clerk role write, PSGC lookup, Cloudinary uploads).
- `components/` — `"use client"` presentational components, grouped by
  surface: `buyer/`, `seller/`, `checkout/`, `orders/`, `profile/`, plus
  root providers (`AntdProvider`, `ConvexClientProvider`,
  `CartProvider`).
- `hooks/` — one hook per page/feature. Owns all data fetching, local
  state, validation, and mutations. Returns plain data + handlers plus
  `isLoading` and `error`.
- `lib/` — framework-agnostic helpers: money/date formatting
  (`format.ts`), Convex ↔ app type mapping (`convexSync.ts`), PH address
  fetching (`phAddress.ts`), and the in-memory demo layer
  (`mock*.ts`, `demoSeed.ts`).
- `constants/` — fixed values. `routes.ts` is the single source of
  truth for app paths, API paths, and asset paths; the rest hold roles,
  categories, units, farm types, order statuses, and PSGC data.
- `types/` — shared TypeScript interfaces (`auth`, `order`, `product`,
  `profile`, `review`, `seller`). No runtime logic.
- `convex/` — the backend. `schema.ts` (tables + indexes), `shared.ts`
  (validators), then one file per domain: `users`, `stalls`, `products`,
  `cart`, `orders`, `reviews`, `market` (public reads).
- `context/` — the six spec documents that define what to build and
  how. Not imported by any code.
- `public/` — static assets only (`AgriMarketLogo.png`, placeholder
  product SVGs).

## Storage Model

- **Convex** (system of record): `users` (Clerk identity mirror + role
  + profile), `addresses` (buyer delivery address book),
  `stalls` (seller storefront + location + verification + rating),
  `products` (catalogue, stock, sold count), `cartItems` (buyer cart
  keyed by user), `orders` (immutable line-item snapshot plus a mutable
  status/event log), `reviews` (rating, comment, seller reply),
  `conversations` (buyer/seller threads), and `messages` (text messages).
- **Clerk** (identity): user id, session, and `publicMetadata.role`.
  `users.tokenIdentifier` and `users.clerkId` are the join keys.
- **Cloudinary**: all product and stall images, uploaded through
  `app/api/uploads/*`, transformed to `width: 1200, quality: auto`.
  Convex stores only the resulting `secure_url`.
- **Admin GCash configuration**: the singleton `gcashSettings` document
  stores the QR Cloudinary URL and mobile number. `adminAuditLog` records
  each change with the verified allowlisted admin email and before/after
  values. GCash orders store a unique checkout payment note, reference,
  submission status, and review events. The expected amount is derived from
  stored order totals and checked manually in GCash; buyers submit no amount,
  sender details, or receipt. The checkout's seller orders update atomically; only
  admin approval marks payment paid. COD remains unpaid until delivery
  confirmation.
- **Admin return review**: within 24 hours of delivery, a buyer can
  submit a 10–500 character reason plus 1–5 Cloudinary photo/video URLs.
  The server enforces the cutoff using `deliveredAt`. The order records
  `refundPayoutHold: true` atomically with `refund-requested`. Admins
  receive a live queue showing the specific order ID and its payment
  reference, plus the buyer's reason and evidence. Admins approve or
  reject with an audit entry. Approval snapshots the seller return
  address; the buyer submits courier/tracking details; the seller
  confirms receipt; then the admin records the actual refund reference
  and disbursement method (GCash to the buyer's saved number or cash
  handoff) and releases the hold. COD refunds are separate outgoing
  payments because the original payment was collected in cash on delivery.
  Payout eligibility must exclude held orders. Returned goods are not
  automatically restocked.
- **In-memory demo layer** (`lib/mockSession.ts`, `lib/mockCatalog.ts`,
  `lib/mockEarnings.ts`, `lib/mockNotifications.ts`, `lib/demoSeed.ts`):
  backs the landing page and any unauthenticated or not-yet-migrated
  view. Not persisted.

- **Seller payouts**: only completed, paid GCash orders can be included in
  seller payout requests. COD is a direct buyer-to-seller cash handoff on
  delivery, so it is recorded as a sale and never enters the payout queue.
  Payout requests snapshot the seller's GCash name and number, the
  seller-selected eligible order IDs with order dates and amounts, and the
  request total. Multiple requests may be pending
  at once when they contain different orders; each order is reserved by one
  request at most. Eligibility begins 24 hours after
  delivery (the buyer return window), requires `completed` and paid status,
  and excludes any active `refundPayoutHold`. The admin queue includes the
  stall's current identity, location, and verification details for review. Admins may
  reject with a reason (releasing reserved orders) or mark paid after
  recording a GCash transfer reference. The app does not execute transfers.
- **Buyer/seller messages**: one conversation is shared by each buyer and
  seller pair. An optional order reference marks the latest order context that
  opened the thread. Reads and sends require membership; message text is
  trimmed and limited to 2,000 characters. Per-participant unread counters
  update atomically with sends and clear when read; seller-authored message
  labels use the stall name.

## Auth and Access Model

- `proxy.ts` runs Clerk middleware for every request. Only `/`,
  `/signin(.*)`, `/signup(.*)`, `/api/locations`, `/api/clerk/role`, and
  `/__clerk(.*)` are public; everything else calls `auth.protect()`.
- `convex/auth.config.ts` trusts a single Clerk JWT issuer domain and
  issues the `convex` application id, so `ctx.auth.getUserIdentity()`
  resolves inside Convex.
- Every Convex function starts from `getCurrentUser(ctx)`, which looks
  the caller up by the `by_token_identifier` index. Mutations escalate to
  `requireUser(ctx)`, which throws `"Not authenticated"` when there is
  no identity. Queries return `null`/`[]` instead of throwing.
- Role lives in two places and must agree: Clerk `publicMetadata.role`
  (written by `app/api/clerk/role`) and `users.role` (written by
  `convex/users.setRole` and `completeOnboarding`).
- The initial admin account is allowlisted by its primary Clerk email
  (`carbonellalex955@gmail.com`) and receives Clerk `publicMetadata.role`
  only after a successful authenticated sign-in. `/admin` checks both
  the allowlisted primary email and admin metadata server-side. GCash
  settings, payment review, and return request queue functions also
  check the allowlisted, verified email inside Convex. Seller verification
  remains unimplemented.
- Ownership is always checked inside the function, never inferred from
  the caller: `getBuyerOrder` (`order.buyerId === buyerId`),
  `requireSellerOrder` (`order.sellerId === sellerId`),
  `products.getMyProduct`, `stalls.getMyStall` (`ownerId`).
- Public reads (`convex/market.ts` — `listStalls`, `listActiveProducts`,
  `getPublicProduct`, `getPublicStall`) are the only functions that serve
  unauthenticated callers, and they return only active, published data.

## Invariants

1. **One order per seller per checkout.** `placeOrders` groups cart
   items by `stallId` and inserts one order per group. Never merge
   sellers into a single order or a single payment.
2. **Stock moves only on seller confirm.** `stockQty` decreases and
   `soldCount` increases in `confirmOrder`, and only if the order had
   been confirmed (`restoreStock` early-returns otherwise). Cancel and
   reject restore exact quantities. A return/refund never restores stock
   automatically; the seller inspects returned goods first.
3. **Orders are point-in-time snapshots.** `sellerName`,
   `sellerLocation`, `items[].name`, `items[].price`,
   `items[].unit`, and `items[].imageUrl` are copied at checkout and
   never re-read from the product or stall documents afterwards.
4. **Status transitions are guarded.** Every mutation calls
   `assertStatus(order, expected)` and appends to `order.events`.
   Illegal transitions throw and never mutate.
5. **Payment state is server-authoritative.** COD orders start `unpaid`
   and become `paid` when the buyer confirms receipt; that same action
   completes the order. GCash orders start
   `pending` after the buyer submits a reference, exact total, sender
   identity, and receipt; only admin approval may mark them paid or
   unlock seller confirmation. Rejected submissions retain a reason and
   can be resubmitted by the buyer.
6. **Images never enter the database as bytes.** Cloudinary holds the
   file; Convex holds a `secure_url` string.
7. **Return requests block seller payouts.** The order's
   `refundPayoutHold` is set in the same transaction as the request and
   stays set throughout approval and return transit, until the request is
   rejected or the admin records the completed refund. Payout requests and
   payments exclude orders with this hold. Orders become eligible only after
   the full 24-hour return window passes. A pending request reserves its
   order IDs so another request cannot claim them.
8. **Timestamps are ISO 8601 strings** from `new Date().toISOString()`,
   not epoch numbers, in both Convex documents and the app types.
9. **The cart is emptied only as part of a successful order.** All cart
   deletions happen after every order has been inserted, and the whole
   mutation is atomic.
10. **Layers do not leak.** Convex calls and `fetch` live in `hooks/`
   only; JSX lives in `components/` only; page files only compose a hook
   with components.
11. **No raw paths outside `constants/routes.ts`.** Every `<Link>`,
    `router.push`, and `fetch` target comes from `APP_ROUTES`,
    `API_ROUTES`, or `ASSET_ROUTES`.
12. **Messages are participant scoped.** Only a conversation's buyer and
    seller can read or send its messages. Buyers start shop conversations;
    either order participant can open the pair's existing conversation.
