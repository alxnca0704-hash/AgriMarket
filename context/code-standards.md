# Code Standards

`AGENTS.md` is the authoritative rule set for this repository. This file
records the conventions those rules imply, plus the patterns already
established in the codebase. When the two disagree, `AGENTS.md` wins.

## General

- One page = one hook = one thin `page.tsx`. The page calls the hook and
  renders components; it holds no state and no markup of its own.
- Logic lives in `hooks/`, UI lives in `components/`. This boundary is
  not negotiable: no `useMutation`/`useQuery`/`fetch` in a component, no
  JSX in a hook.
- Fix root causes. Do not layer a workaround on top of a wrong data
  model.
- Keep modules single-purpose. A hook that both fetches and renders is
  two modules.
- Prefer small verifiable increments over large speculative refactors.

## TypeScript

- `strict: true` and `noEmit: true` in `tsconfig.json`. No `any`,
  `@ts-ignore`, or non-null assertions to silence the compiler.
- Type every hook return value explicitly and every component's props as
  `<ComponentName>Props`. Export the props interface from the component
  file.
- Use `Doc<"table">` / `Id<"table">` from `convex/_generated/dataModel`
  in Convex code; use the interfaces in `types/` in app code.
- Map Convex documents to app types at the boundary in
  `lib/convexSync.ts` (`toOrder`, `toDeliveryAddress`, …) rather than
  sprinkling optional chaining through components.
- Types are `PascalCase` with no `I` prefix. Union types for statuses and
  enums, interfaces for object shapes.
- Constants that back a union type are declared `as const` and the type
  is derived from them: `export type PaymentMethod = (typeof
  PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD]`.

## Next.js

- App Router only. Page files under `app/` export metadata and a default
  component; interactive pieces are `"use client"`.
- Route groups `(buyer)` and `(checkout)` plus the `seller/` segment
  each own a `layout.tsx` that renders `BuyerShell`, `CheckoutShell`, or
  `SellerShell`. Add new pages inside the correct group so they inherit
  the right shell.
- `proxy.ts` is the auth guard. When adding a route, decide explicitly
  whether it is public; if not, it is protected by default.
- Prefer server components for static shells and client components for
  anything with state, effects, or Convex reactivity.
- Images come from Cloudinary URLs stored in the database; use
  `next/image` with a sensible `sizes` hint for the 1200px-wide
  transforms already applied server-side.

## Convex

- Read `convex/_generated/ai/guidelines.md` before writing any Convex
  code. It overrides anything learned from training data.
- Use the new object form: `export const name = query({ args, handler })`
  / `mutation({ args, handler })`. Never the deprecated positional
  form.
- Every arg is validated with a validator from `convex/values`.
  Composite shapes live in `convex/shared.ts` and are spread into
  `defineTable` so the schema and the mutation args cannot drift.
- Authenticate first: `getCurrentUser` for queries, `requireUser` for
  mutations. Then authorize: check `buyerId` / `sellerId` / `ownerId`
  inside the function.
- Query through indexes (`.withIndex(...)`) — never `.filter()` on a
  full table scan, and never accept a client-supplied id without an
  ownership check.
- Guard state transitions with a small `assertStatus(order, expected)`
  helper and append to `order.events` on every change so the timeline
  stays complete.
- All writes are inside the mutation; there is no post-hoc cleanup. If
  something must happen after a write, do it before the mutation
  returns.
- Never edit anything under `convex/_generated/`.

## Ant Design and Tailwind

- Use antd for Table, Form, Modal, Drawer, Select, Input, Steps, Menu,
  Skeleton, Alert, Result, Tag, Badge, Switch, Checkbox, and so on.
- Use Tailwind for layout only: flex/grid, `gap-*`, `p-*`, width/height,
  `hidden md:block`, container widths, and responsive visibility.
- Do not restyle antd internals with Tailwind utilities. Change the look
  once in `components/AntdProvider.tsx` via `theme.token` or
  `theme.components`.
- Every view that renders data handles `isLoading` with a `Skeleton`
  that matches the content shape, and `error` with an `Alert` (or
  `Result` for a full page) plus a retry action.
- `App.useApp()` for `message` / `notification` / `Modal` so antd
  context is respected. Do not use the static `message.success` import.
- Mobile-first Tailwind: base classes are the 375px layout, then `sm:`,
  `md:`, `lg:`, `xl:` add complexity. Never design desktop-first.
- Cards and lists stack on mobile; a `Table` that must survive small
  screens goes in an `overflow-x-auto` wrapper.
- Modals use a responsive width (`width="90%"` or a `max-w-*` wrapper)
  and form fields use `grid grid-cols-1 md:grid-cols-2 gap-4`.
- No fixed pixel widths on containers — `w-full`, `max-w-*`, `flex-1`,
  `min-w-0`.
- Default to no visible borders. Separate with background contrast
  (`bg-white` cards on a `bg-stone-50` page), spacing, or `shadow-sm`.
  When a divider is genuinely needed use `border-stone-100`.
- No neon or highly saturated colors. Muted, low-saturation palette
  only.

## Styling and tokens

- Colors come from the `stone` neutral scale plus the `--color-sage`
  (`#2D6A4F`), `--color-sage-soft` (`#E9F0EB`), and `--color-error`
  (`#A64D42`) tokens defined in `app/globals.css`.
- The antd token set lives in `components/AntdProvider.tsx`; see
  `ui-context.md` for the full table.
- Radii: `rounded-lg` for inline controls, `rounded-xl` for cards and
  list rows, `rounded-2xl` for panels and sheets, `rounded-full` for
  avatars and badges.
- Typography: Geist Sans for UI, Newsreader for editorial/display
  headings, Geist Mono for codes and reference numbers.
- Money always goes through `formatPrice` in `lib/format.ts`. Never
  interpolate a raw peso amount.

## API Routes

- Live under `app/api/**/route.ts` and are referenced through
  `API_ROUTES` in `constants/routes.ts`.
- Check auth first (`await auth()` from `@clerk/nextjs/server`) and
  return `401` before touching any input.
- Parse the body defensively (`await request.json().catch(() => null)`)
  and validate against a known allowlist — the role route does this with
  `VALID_ROLES`.
- Enforce a size limit on uploads (`MAX_BYTES`, 5 MB) and return `400`
  with a user-readable message.
- Never leak a secret or a stack trace in the response body. Log the
  detail server-side with `console.error` and return a generic message.
- Return `NextResponse.json({ ... })` consistently; error responses use
  `{ error: string }`.

## Data and Storage

- Metadata, ownership, and relationships live in Convex. Images live in
  Cloudinary and Convex stores only the URL.
- Never store a base64 data URI or a file buffer in a Convex document.
- Denormalize display fields onto a document when it is created
  (`orders.sellerName`, `reviews.buyerName`) so historical records stay
  readable after the source changes.
- Use `v.optional(...)` for genuinely optional fields and spread
  conditionally (`...(note ? { note } : {})`) instead of writing
  `undefined`.
- To clear an optional field, patch it to `undefined` explicitly.

## Validation

- Client-side validation in the hook, mirroring server-side validators
  in `convex/shared.ts`. The server is always authoritative.
- Address rules: region, province, city/municipality, and barangay are
  all required; street is required; postal code is exactly 4 digits.
- Mobile numbers match `/^(\+?63|0)?9\d{9}$/` after stripping spaces and
  dashes.
- Free-text reasons (refund, cancel) are trimmed and length-bounded —
  the refund reason is 10–500 characters.
- Surface field errors next to the field and clear a field's error as
  soon as the user edits it.

## Naming

- Hooks: `use<PageName>.ts`, function name matches the file.
- Components: `PascalCase.tsx`, named export matching the filename.
- Props: `<ComponentName>Props`.
- Constants: `UPPER_SNAKE_CASE` values, `camelCase.ts` filenames.
- Route objects are named exactly `APP_ROUTES`, `API_ROUTES`,
  `ASSET_ROUTES` so intent is obvious at the call site.
- Convex functions are `camelCase` verbs: `placeOrders`, `confirmOrder`,
  `submitReview`, `listSellerOrders`.
- Table names are plural nouns: `users`, `stalls`, `products`,
  `cartItems`, `orders`, `reviews`, `addresses`.

## File Organization

- `app/` — routes and route handlers only.
- `app/(buyer)/`, `app/(checkout)/`, `app/seller/` — route trees grouped
  by shell.
- `components/<surface>/` — `"use client"` UI, grouped as `buyer/`,
  `seller/`, `checkout/`, `orders/`, `profile/`; root-level components
  are providers and shared shell pieces.
- `hooks/` — one hook per page, plus cross-cutting hooks such as
  `useCart`, `useConvexUserSync`, and `useLocationCascade`.
- `types/` — shared interfaces, one file per domain.
- `constants/` — fixed values, one concern per file, routes in
  `routes.ts`.
- `lib/` — pure helpers and the Convex ↔ app mapping layer.
- `convex/` — backend by domain, shared validators in `shared.ts`.
- `context/` — the six spec documents; never imported by code.
- `public/` — static assets.

## Before Committing

1. `npm run build` passes.
2. `npm run lint` passes.
3. No new `any`, no raw path strings, no API calls in components.
4. `progress-tracker.md` reflects the change.
