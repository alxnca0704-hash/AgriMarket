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
  status/event log), `reviews` (rating, comment, seller reply).
- **Clerk** (identity): user id, session, and `publicMetadata.role`.
  `users.tokenIdentifier` and `users.clerkId` are the join keys.
- **Cloudinary**: all product and stall images, uploaded through
  `app/api/uploads/*`, transformed to `width: 1200, quality: auto`.
  Convex stores only the resulting `secure_url`.
- **In-memory demo layer** (`lib/mockSession.ts`, `lib/mockCatalog.ts`,
  `lib/mockEarnings.ts`, `lib/mockNotifications.ts`, `lib/demoSeed.ts`):
  backs the landing page and any unauthenticated or not-yet-migrated
  view. Not persisted.

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
   been confirmed (`restoreStock` early-returns otherwise). Cancel,
   reject, and refund approval restore the exact quantities.
3. **Orders are point-in-time snapshots.** `sellerName`,
   `sellerLocation`, `items[].name`, `items[].price`,
   `items[].unit`, and `items[].imageUrl` are copied at checkout and
   never re-read from the product or stall documents afterwards.
4. **Status transitions are guarded.** Every mutation calls
   `assertStatus(order, expected)` and appends to `order.events`.
   Illegal transitions throw and never mutate.
5. **COD is the only implemented payment.** `orders.paymentMethod` is
   `v.literal("cod")` and `paymentStatus` becomes `paid` only in
   `confirmDelivery`. GCash is specified but unbuilt — see
   `project-overview.md` and the open questions in
   `progress-tracker.md`.
6. **Images never enter the database as bytes.** Cloudinary holds the
   file; Convex holds a `secure_url` string.
7. **Timestamps are ISO 8601 strings** from `new Date().toISOString()`,
   not epoch numbers, in both Convex documents and the app types.
8. **The cart is emptied only as part of a successful order.** All cart
   deletions happen after every order has been inserted, and the whole
   mutation is atomic.
9. **Layers do not leak.** Convex calls and `fetch` live in `hooks/`
   only; JSX lives in `components/` only; page files only compose a hook
   with components.
10. **No raw paths outside `constants/routes.ts`.** Every `<Link>`,
    `router.push`, and `fetch` target comes from `APP_ROUTES`,
    `API_ROUTES`, or `ASSET_ROUTES`.
