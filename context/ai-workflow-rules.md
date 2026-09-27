# AI Workflow Rules

## Approach

This project is built spec-first. The six documents in `context/` are
the source of truth; `AGENTS.md` is the rule set. Read the relevant
context file before writing code, implement only what those files
describe, and update them when the implementation changes. Do not infer
or invent product behavior from scratch.

Two documents gate any Convex change: `convex/_generated/ai/guidelines.md`
overrides anything learned from training data, and
`context/architecture.md` lists the invariants that must not break.

Order of work per unit:

1. `project-overview.md` — confirm the feature is in scope.
2. `architecture.md` — confirm the boundaries, storage, and invariants.
3. `ui-context.md` — confirm the visual language if UI is involved.
4. `code-standards.md` — confirm the conventions.
5. `progress-tracker.md` — pick the unit from "Next Up".
6. Implement.
7. Update the context files, then verify.

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in one step. A change that
  touches a Convex mutation, a page, and a new upload route is three
  units.
- Do not refactor working code that the current unit does not require.
- If a unit needs more than roughly one new hook, one new surface
  directory of components, and one Convex domain file, split it.

## When to Split Work

Split an implementation step if it combines:

- A schema change with a UI change.
- More than one Convex domain (`orders` + `reviews`, `users` + `stalls`).
- A buyer-facing surface with a seller-facing surface.
- A new page with new shared components.
- A payment or order-state change with a cosmetic change.
- Behavior that is not clearly defined in the context files.

If a change cannot be verified end to end quickly, the scope is too
broad — split it.

## Handling Missing Requirements

- Do not invent product behavior that is not defined in the context
  files.
- If a requirement is ambiguous, resolve it in the relevant context file
  **before** implementing.
- If a requirement is missing entirely, add it to "Open Questions" in
  `progress-tracker.md`, state the assumption you are proceeding under,
  and continue.
- Never silently widen the data model. A new field on an existing table
  is a design decision — record the reason in "Architecture Decisions".

## Protected Files

Do not modify without explicit instruction:

- `convex/_generated/**` — generated types and runtime.
- `next-env.d.ts`, `tsconfig.tsbuildinfo` — generated.
- The `<!-- BEGIN:nextjs-agent-rules -->` … `<!-- END -->` block in
  `AGENTS.md` and the `<!-- convex-ai-start -->` … `<!-- convex-ai-end -->`
  blocks in `AGENTS.md` and `CLAUDE.md`. Both are re-written by tooling
  (`next dev` and `npx convex ai-files install`); editing them only
  re-creates an uncommitted change.
- `components/AntdProvider.tsx` theme tokens and the `@theme` block in
  `app/globals.css` — these are the global design system. Change them
  once, globally, rather than restyling a page.
- `.env.local` and any secret-bearing file.
- The `<!-- BEGIN:nextjs-agent-rules -->` block must be committed with
  your work, not stripped from a diff.

## Keeping Docs in Sync

Update the relevant context file whenever the implementation changes:

- System architecture, boundaries, or storage model → `architecture.md`
  and `context/ui-context.md` if the visual language moved.
- Code conventions or standards → `code-standards.md`
- Feature scope, goals, or success criteria → `project-overview.md`
- Current state, next unit, open questions → `progress-tracker.md`
- Design tokens, layout patterns → `ui-context.md`
- Rules for how to work → `ai-workflow-rules.md` or `AGENTS.md`

Spec-first means the docs change *with* the code in the same unit, not
in a follow-up commit.

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope.
2. No invariant in `architecture.md` was violated — re-read them, do not
   assume.
3. `progress-tracker.md` reflects the completed work.
4. `npm run build` passes.
5. `npm run lint` passes.
6. New/changed views render a `Skeleton` while loading and an
   `Alert`/`Result` on error.
7. New/changed layouts were checked at 375px, 768px, and 1280px.
8. No raw path strings, no API calls in components, no `any`.

## Commands

| Purpose         | Command          |
| --------------- | ---------------- |
| Dev server      | `npm run dev`    |
| Production gate | `npm run build`  |
| Lint            | `npm run lint`   |

There is no test script. Do not claim a change is verified by tests;
`npm run build` plus `npm run lint` is the gate, plus manually walking
the affected flow in the browser.
