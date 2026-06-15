# Plan 003: "My Day" personal agenda with conflict detection

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 9f0b076..HEAD -- src/lib src/components/NotesOverview.tsx src/pages/notes.astro src/layouts/main.astro`
> If any referenced file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: soft on 001 (page title should read `event.shortName`; if 001
  hasn't landed, hardcode `FUN26` and 001's drift check will catch it later).
- **Category**: direction (personal-agenda feature)
- **Planned at**: commit `9f0b076`, 2026-06-15

## Why this matters

Favorites are stored as a flat list of slugs (`$favorites` in
`src/lib/stores.ts:17-21`). With up to 5 parallel stages, two favorited sessions
can run at the same time — and nothing tells the attendee. "My schedule" today
is just a filter over the grid/list; there is no chronological, conflict-aware
"here's your day" view. This plan adds a dedicated `/my-day` page that lists the
user's favorited sessions in time order, grouped by day, and flags time
conflicts ("you've favorited two things at once"). It mirrors the existing
`/notes` page almost exactly, so it's low-risk and consistent, and it stays
fully client-side (favorites already live in localStorage).

## Current state

The codebase already has the precise pattern to copy — the notes overview:

- `src/pages/notes.astro` (the whole file — copy its shape for `/my-day`):
  ```astro
  ---
  import { NotesOverview } from "@/components/NotesOverview"
  import Layout from "@/layouts/main.astro"
  import { getSessionsLite } from "@/lib/sessions"
  const sessions = await getSessionsLite()
  ---
  <Layout title="My notes – FUN26">
    <div class="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 class="text-2xl leading-tight font-bold">My notes</h1>
      <p class="mt-1 mb-6 text-sm text-muted-foreground">…</p>
      <NotesOverview client:load sessions={sessions} />
    </div>
  </Layout>
  ```
- `src/components/NotesOverview.tsx` — a `client:load` island that reads a
  nanostore via `useStore`, gates on `useMounted()` to avoid SSR mismatch,
  filters `sessions` to the relevant subset, renders cards, and shows an `Empty`
  state when there's nothing. Key bits to reuse:
  - mount gate: `const mounted = useMounted()` (`:38`), then build the list only
    when `mounted` (`:41-45`) — **required**, because favorites come from
    localStorage and must not differ between SSR and first client render.
  - card markup with day/time/stage line (`:88-108`): uses
    `fmtDay(dayKey(session.start))`, `fmtTime(session.start)`, `session.stage`.
  - `Empty`/`EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription` from
    `@/components/ui/empty` (`:5-11`, `:47-62`).

- Session model (`src/lib/types.ts:6-17`): has `start`, `end` as ISO strings,
  `stage`, `kind`, `speakers`. `speakerNames(session)` joins names.
- Time/day helpers (`src/lib/time.ts`): `dayKey(iso)` → `"2026-06-11"`,
  `fmtDay(key)` → `"Thu, June 11"`, `fmtTime(iso)` → `"14:00"`,
  `minutesBetween(a,b)`.
- Favorites store + helpers (`src/lib/stores.ts:16-39`): `$favorites`
  (string[]), `toggleFavorite`, `addFavorites`, `replaceFavorites`.
- `getSessionsLite()` (`src/lib/sessions.ts:6-26`) returns all sessions sorted by
  `start` then `stageOrder`.
- The header in `src/layouts/main.astro:65-91` has the brand, an `unofficial`
  badge, a date pill (`:84-88`), and `<ThemeToggle />`. There is **no** nav link
  to `/notes` or `/speakers` in this header today (despite `docs/content.md`
  mentioning one) — confirm by reading the file before Step 4.

**Conventions:** Prettier (no semicolons, double quotes); prefer `size-8` over
`w-8 h-8`. Icons from `lucide-react` (already a dep).

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0, `0 errors`  |
| Lint      | `pnpm lint`      | exit 0              |
| Build     | `pnpm build`     | exit 0              |
| Preview   | `pnpm preview`   | manual smoke test   |

## Scope

**In scope** (create/modify):
- `src/lib/agenda.ts` (create) — conflict-detection helper.
- `src/components/MyDay.tsx` (create) — the agenda island.
- `src/pages/my-day.astro` (create) — the page.
- `src/layouts/main.astro` (modify) — add one header link to `/my-day`.

**Out of scope** (do NOT touch):
- `src/lib/stores.ts` — read `$favorites`; do not change its shape. Do **not**
  add per-session conflict state to storage; conflicts are derived at render.
- The grid/list components — do not add inline conflict badges there in this
  plan (a possible follow-up; keep scope to the dedicated page).
- `src/content/**`, backend, anything else.

## Git workflow

- Branch: `advisor/003-my-day`
- Conventional commit, e.g. `feat: My Day agenda with favorite-conflict detection`.
  Do not mention any AI tool in the message.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Create the conflict helper `src/lib/agenda.ts`

Pure functions, no React. Two sessions conflict if their `[start, end)` ranges
overlap (touching end-to-start does **not** count as a conflict). Conflict
detection is over the favorited set only and ignores `break` sessions (a coffee
break overlapping a talk is not a clash worth warning about).

```ts
import type { SessionLite } from "./types"

/** True if two sessions overlap in time (end-exclusive). Breaks never conflict. */
export function sessionsOverlap(a: SessionLite, b: SessionLite): boolean {
  if (a.kind === "break" || b.kind === "break") return false
  const aStart = new Date(a.start).getTime()
  const aEnd = new Date(a.end).getTime()
  const bStart = new Date(b.start).getTime()
  const bEnd = new Date(b.end).getTime()
  return aStart < bEnd && bStart < aEnd
}

/**
 * Slugs of sessions that overlap at least one other session in the same list.
 * Pass the favorited sessions; O(n²) is fine (favorites are a handful).
 */
export function conflictingSlugs(sessions: SessionLite[]): Set<string> {
  const out = new Set<string>()
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      if (sessionsOverlap(sessions[i], sessions[j])) {
        out.add(sessions[i].slug)
        out.add(sessions[j].slug)
      }
    }
  }
  return out
}
```

**Verify**: `pnpm typecheck` → exit 0 (file compiles; unused for now).

### Step 2: Create the agenda island `src/components/MyDay.tsx`

Model it on `src/components/NotesOverview.tsx`. Requirements:
- Props: `{ sessions: SessionLite[] }`.
- `const mounted = useMounted()`, `const favorites = useStore($favorites)`.
- Build `mine = mounted ? sessions.filter((s) => favorites.includes(s.slug)) : []`.
  `getSessionsLite` already sorts by start, so `mine` stays in time order.
- Compute `const conflicts = conflictingSlugs(mine)` (from `@/lib/agenda`).
- Group by day with `dayKey` (a session can be on June 11 or 12); render a
  `fmtDay(dayKey(...))` heading per day, like `NotesOverview` shows the
  day/time line. Within a day, sessions are already time-ordered.
- Each row: link to `/schedule/${slug}`, show time range
  `fmtTime(start) – fmtTime(end)`, stage, and speakers (`speakerNames`). When
  `conflicts.has(slug)`, render a clear warning badge, e.g.:
  ```tsx
  <Badge variant="outline" className="border-destructive/50 text-destructive gap-1">
    <TriangleAlert className="size-3.5" /> Overlaps
  </Badge>
  ```
  (`Badge` from `@/components/ui/badge`; `TriangleAlert` from `lucide-react` —
  verify the icon name exists, otherwise use `AlertTriangle`.)
- A summary line at the top: `{mine.length} favorited · {conflicts.size} in conflict`
  (only show the conflict count when `> 0`).
- `Empty` state when `mine.length === 0`, reusing the `Empty*` components, with
  copy like: "No favorites yet — tap the heart on any session to plan your day."
  and a `Heart` icon.

Keep all styling consistent with `NotesOverview` (same card classes:
`rounded-xl border bg-card p-4`, muted-foreground meta line, etc.).

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Create the page `src/pages/my-day.astro`

Copy `src/pages/notes.astro` and adapt:

```astro
---
import { MyDay } from "@/components/MyDay"
import Layout from "@/layouts/main.astro"
import { getSessionsLite } from "@/lib/sessions"
import { event } from "@/event.config" // only if plan 001 has landed; else inline "FUN26"
const sessions = await getSessionsLite()
---
<Layout title={`My Day – ${event.shortName}`}>
  <div class="mx-auto w-full max-w-2xl px-4 py-6">
    <h1 class="text-2xl leading-tight font-bold">My Day</h1>
    <p class="mt-1 mb-6 text-sm text-muted-foreground">
      Your favorited sessions in order, with clashes flagged. Saved only on this device.
    </p>
    <MyDay client:load sessions={sessions} />
  </div>
</Layout>
```

If plan 001 has **not** landed yet (`src/event.config.ts` does not exist), drop
the `event` import and use the literal `title="My Day – FUN26"` instead.

**Verify**: `pnpm build` → exit 0; confirm the route exists:
`ls dist/my-day/index.html` → file present.

### Step 4: Add a header link to `/my-day`

In `src/layouts/main.astro`, add a compact link to `/my-day` in the header
(`:65-91`). Place it before the date pill or `<ThemeToggle />`. Keep it
unobtrusive and match the existing header link style (the brand link uses
`no-underline`). Example, inserted in the right-aligned cluster:

```astro
<a href="/my-day" class="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground no-underline hover:text-foreground">
  My Day
</a>
```

Do not restructure the header; add only this one anchor. (Routing is plain
links; no client JS needed.)

**Verify**: `pnpm typecheck && pnpm lint` → both exit 0. `pnpm build` → exit 0.

### Step 5: Manual smoke test

`pnpm preview`, then:
- With no favorites: `/my-day` shows the empty state.
- Favorite two sessions on the same day in **different** stages that overlap in
  time → both show an "Overlaps" badge and the summary shows "… 2 in conflict".
- Favorite a session and a coffee break that overlap it → **no** conflict badge
  (breaks are excluded).
- Favorite sessions across both June 11 and June 12 → they appear under two day
  headings, each time-ordered.
- The header "My Day" link navigates to the page; back navigation returns to the
  schedule.

## Done criteria

ALL must hold:

- [ ] `src/lib/agenda.ts`, `src/components/MyDay.tsx`, `src/pages/my-day.astro`
      exist.
- [ ] `pnpm typecheck` exits 0, `0 errors`.
- [ ] `pnpm lint` exits 0.
- [ ] `pnpm build` exits 0 and `dist/my-day/index.html` exists.
- [ ] Overlapping favorites across different stages are flagged; overlapping
      breaks are not (verified manually).
- [ ] `git diff 9f0b076 -- src/lib/stores.ts` is empty (favorites store
      unchanged).
- [ ] Only the in-scope files appear in `git status`.
- [ ] `plans/README.md` status row for 003 updated.

## STOP conditions

Stop and report (do not improvise) if:

- The "Current state" excerpts don't match live code (drift since `9f0b076`) —
  e.g. `NotesOverview.tsx` / `notes.astro` have been refactored away, or a
  `/my-day` route already exists.
- `useMounted` or `$favorites` no longer exist at the cited paths.
- The conflict logic would require changing the favorites store shape to work
  (it should not — derive at render).

## Maintenance notes

- The conflict rule is end-exclusive and break-excluding; if "overlap" semantics
  ever change, `sessionsOverlap` in `src/lib/agenda.ts` is the single source of
  truth — reuse it anywhere conflicts are shown.
- A natural follow-up (deliberately **out of scope** here): surface the same
  `conflictingSlugs` result inline in the grid/list favorites view so clashes
  are visible without leaving the schedule. Reuse `@/lib/agenda` when doing it.
- If cross-device favorite sync ever lands (see
  `docs/decisions/0001-…`), this page automatically benefits — it just reads
  `$favorites`.
- Reviewer should confirm the `useMounted()` gate is present so the page doesn't
  hydrate-mismatch on favorites loaded from localStorage.
