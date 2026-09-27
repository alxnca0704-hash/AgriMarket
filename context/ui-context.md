# UI Context

## Theme

Light only — there is no dark mode. The design language is a warm,
editorial, farm-market feel: a calm off-white page (`#FAFAF9`), white
content cards separated by background contrast rather than borders, and
a single deep sage green (`#2D6A4F`) as the brand accent. The
type hierarchy does the organizing — Newsreader for display headings,
Geist Sans for everything functional — and whitespace does the
separating. Borders are absent by default; the only dividers that exist
are `border-stone-100` hairlines. The palette is muted and
low-saturation throughout: stone neutrals, sage, a soft amber for
warnings, and a muted brick red for errors. No neon, no gradients
behind content, no glows.

## Colors

Two sources of truth. Do not add a third.

### 1. Tailwind theme tokens — `app/globals.css`

| Role           | Token              | Value     | Used for                                     |
| -------------- | ------------------ | --------- | -------------------------------------------- |
| Page background | `--background`    | `#FAFAF9` | `body`, antd `colorBgLayout`                  |
| Page foreground | `--foreground`    | `#1C1917` | Body text, antd `colorTextBase`               |
| Brand accent    | `--color-sage`    | `#2D6A4F` | Primary actions, active nav, links            |
| Accent surface  | `--color-sage-soft` | `#E9F0EB` | Selected nav item, soft badges, hover fills  |
| Error           | `--color-error`   | `#A64D42` | antd `colorError`, destructive text           |
| Selection       | `::selection`     | `#E7F0EA` | Highlighted text                              |

### 2. antd theme tokens — `components/AntdProvider.tsx`

| Role            | Token                  | Value     |
| --------------- | ---------------------- | --------- |
| Primary         | `colorPrimary`         | `#2D6A4F` |
| Info            | `colorInfo`            | `#2D6A4F` |
| Success         | `colorSuccess`         | `#2D6A4F` |
| Warning         | `colorWarning`         | `#A97C3F` |
| Error           | `colorError`           | `#A64D42` |
| Layout bg       | `colorBgLayout`        | `#FAFAF9` |
| Container bg    | `colorBgContainer`     | `#FFFFFF` |
| Border          | `colorBorder`          | `#E2DDD4` |
| Border secondary| `colorBorderSecondary` | `#EBE7DE` |
| Base text       | `colorTextBase`        | `#1C1917` |
| Font family     | `fontFamily`           | Geist Sans stack |
| Radius          | `borderRadius` / `LG` / `SM` | `8` / `12` / `6` |
| Button height   | `controlHeight` (Input/Select/Button) | `42` |
| Button shadow   | `primaryShadow`        | `none`    |

### 3. Neutral scale

Use Tailwind's `stone` ramp rather than raw hex. `stone-50` page,
`stone-100` hairline dividers, `stone-400` muted/uppercase labels,
`stone-500` secondary text, `stone-600` interactive icons, `stone-800`
/`stone-900` primary text and headings.

**Rule:** no hardcoded hex in components. If a new color is genuinely
needed, add it to `globals.css` `@theme` or to the antd token block —
once — and reference it everywhere else.

## Typography

| Role           | Font            | Variable                | Usage                                        |
| -------------- | --------------- | ----------------------- | -------------------------------------------- |
| UI / body      | Geist Sans      | `--font-sans`           | All interface text, buttons, labels, tables  |
| Display        | Newsreader      | `--font-display`        | Hero headings, section titles, prices on hero |
| Code / mono    | Geist Mono      | `--font-mono`           | Reference numbers, GCash refs, codes         |

Loaded in `app/layout.tsx` via `next/font/google` (Newsreader ships
normal + italic). `h-full antialiased` on `<html>`.

Type scale in use:

| Element        | Classes                                                |
| -------------- | ------------------------------------------------------ |
| Section title  | `text-sm font-semibold text-stone-900`                |
| Card heading   | `text-base font-semibold text-stone-900`               |
| Body           | `text-sm text-stone-600`                               |
| Muted / helper | `text-xs text-stone-400` / `text-stone-500`            |
| Overline label | `text-[11px] font-medium uppercase tracking-wide text-stone-400` |
| Emphasis price | `text-sm font-semibold text-stone-900`                 |

Never use pure black text. The darkest ink is `stone-900` /
`#1C1917`.

## Border Radius

| Context             | Class          | antd token  | Used for                             |
| ------------------- | -------------- | ----------- | ------------------------------------ |
| Inline / small UI   | `rounded-lg`   | `6`         | Icon buttons, inputs, chips, tabs    |
| antd default        | `borderRadius` | `8`         | Buttons, inputs, selects, cards      |
| Cards / list rows   | `rounded-xl`   | `12`        | Product cards, order cards, panels   |
| Panels / sheets     | `rounded-2xl`  | `borderRadiusLG` | Sections, modals, mobile sheets |
| Pills / avatars     | `rounded-full` | —           | Badges, avatars, category chips      |

## Component Library

Ant Design 6, wired through `components/AntdProvider.tsx` and wrapped
by `AntdRegistry` from `@ant-design/nextjs-registry` for SSR style
extraction. Use it for Table, Form, Modal, Drawer, Steps, Menu, Select,
Input, Skeleton, Alert, Result, Tag, Badge, Switch, Checkbox, Layout,
Sider, and Tabs.

- Tailwind is for **layout, spacing, and responsiveness only**. Never
  override antd internals with Tailwind utilities; change the token in
  `AntdProvider` instead.
- Notable component overrides: `Card` borders are transparent,
  `Button` has no primary shadow and a 42px control height, `Menu` items
  are 44px with a 10px radius, sage selected background, and no active
  bar, `Badge` is compact.
- Shells use `Layout` + `Sider` from antd, with the sidebar's border
  removed via `!border-none !bg-transparent`.
- Toast and confirm feedback uses `App.useApp()` so it reads antd
  context.
- Icons: `@ant-design/icons` only. Outline style. `text-base` inline,
  `text-lg` for section accents, `w-8 h-8` tappable icon buttons.

## Layout Patterns

- **App shell** — `BuyerShell` / `CheckoutShell` / `SellerShell` own
  the chrome. One shell per route group, set in the group's
  `layout.tsx`.
- **Desktop (≥ `lg`)** — sticky `Sider` (248px, `height: 100vh`,
  `top: 0`) with a `Menu`, brand mark at the top, and an "Account"
  block pinned to the bottom. The content column is `min-w-0` inside a
  `max-w-6xl mx-auto px-4 sm:px-6` container.
- **Mobile (< `lg`)** — no sidebar. A `sticky top-0 z-30 h-14` bar with
  a hamburger, optional back button, brand mark, and avatar; the nav
  moves into a left `Drawer` (`size={248}`, `padding: 0`) that reuses
  the exact same sidebar markup.
- **Navigation** — 5 buyer tabs (Home, Shops, Cart, Orders, Profile)
  and 8 seller tabs (Dashboard, Products, Orders, My stall, Earnings,
  Reviews, Notifications, Settings). Active state comes from
  `usePathname()` with `startsWith` prefix matching for nested routes.
- **Cards** — `rounded-2xl bg-white shadow-sm p-4 sm:p-6`. Interior
  blocks that need separation use `rounded-xl bg-stone-50/80 p-4`
  rather than a border.
- **Checkout** — stacked single-column sections on mobile
  (`grid grid-cols-1 md:grid-cols-2 gap-4` inside forms), each section
  its own white card, with a sticky action bar at the bottom.
- **Overlays** — antd `Modal` for confirmations (`width="90%"` on
  mobile) and `Drawer` for navigation and filter sheets.
- **Filter/sort** — chips and a select in a bar on desktop, a
  bottom-sheet `Drawer` on mobile.
- **Empty and error states** — a centered icon, a short line of copy,
  and one action. Never a blank region.
- **Dividers** — `border-stone-100` / `divide-stone-100` only, and only
  where grouping genuinely needs a line.

## Loading, Empty, and Feedback States

- Loading: `Skeleton` shaped like the content (`Skeleton active` for a
  card, `Skeleton.Input` rows for a list, `Skeleton.Button` in a
  header). No spinners over content areas.
- Error: `Alert` inline for a section, `Result` for a full page, always
  with a retry action when the operation is retryable.
- Success and warnings: `App.useApp()` `message` / `notification`.
- Never leave a screen blank while data is in flight or has failed.
