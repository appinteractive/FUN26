# Plan 002: Search + language/kind filtering for the schedule

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 9f0b076..HEAD -- src/components/schedule/ScheduleApp.tsx src/components/schedule/ScheduleList.tsx src/components/schedule/ScheduleGrid.tsx`
> If any in-scope file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch, treat
> it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: soft on 001 (uses `@/event.config` only if you choose to label
  things by event; not required). Can run standalone.
- **Category**: direction (discovery feature)
- **Planned at**: commit `9f0b076`, 2026-06-15

## Why this matters

The schedule has 69 sessions across up to 5 parallel stages per day, and the
content is mixed German/English. A `language` tag already exists on every talk
and is _displayed_ (a `DE`/`EN` badge), but there is **no way to filter or
search**. The only controls today are the day switcher and a "My schedule"
(favorites-only) toggle. An attendee deciding "which of these five rooms, in a
language I follow, is about X" has to eyeball the whole grid. This plan adds a
free-text search (title + speaker names) and a language filter, reusing the
exact dim-in-grid / hide-in-list pattern the favorites toggle already uses, so
it feels native and stays a pure client-side feature (no backend).

## Current state

`src/components/schedule/ScheduleApp.tsx` is the island that owns the controls
and renders either the grid or the list. Relevant facts (at `9f0b076`):

- It computes the active day and `daySessions`
  (`src/components/schedule/ScheduleApp.tsx:51-60`):
  ```tsx
  const daySessions = sessions.filter((s) => dayKey(s.start) === day)
  const stages = stagesOf(daySessions)
  ```
- The controls row holds the view tabs + the favorites toggle
  (`:64-116`). The favorites toggle is plain component-driven state via the
  `$favoritesOnly` nanostore (`:86-101`).
- It renders the two views (`:138-157`), passing `favorites` and `favoritesOnly`
  to both:
  ```tsx
  <ScheduleGrid sessions={daySessions} stages={stages} favorites={favorites} favoritesOnly={favoritesOnly} notedSlugs={notedSlugs} />
  …
  <ScheduleList sessions={daySessions} favorites={favorites} favoritesOnly={favoritesOnly} notedSlugs={notedSlugs} />
  ```

How filtering already works in each view (this is the pattern to mirror):

- **List** hides non-matches (`src/components/schedule/ScheduleList.tsx:204-206`):
  ```tsx
  const visible = favoritesOnly
    ? sessions.filter((s) => favorites.includes(s.slug))
    : sessions
  ```
  and shows an `Empty` state when `visible.length === 0` (`:208-222`).
- **Grid** keeps every session (the time axis needs them) and _dims_ non-matches
  (`src/components/schedule/ScheduleGrid.tsx:288`):
  ```tsx
  dimmed={favoritesOnly && !favorites.includes(session.slug)}
  ```

Session shape (`src/lib/types.ts:6-17`): `{ slug, title, start, end, stage,
stageOrder, kind: "talk"|"workshop"|"break", language?: "de"|"en", speakers:
{name, image}[] }`. `speakerNames(session)` (`src/lib/types.ts:19-21`) joins
speaker names with `", "`.

**UI primitives available** (match these exemplars):

- `src/components/ui/input.tsx` — `Input` (Base UI input), already styled `h-8`.
- `src/components/ui/toggle-group.tsx` — `ToggleGroup` / `ToggleGroupItem`. See
  it used for the reminder lead choices in
  `src/components/NotificationSettings.tsx:93-108`:
  ```tsx
  <ToggleGroup value={[String(settings.leadMinutes)]} onValueChange={(value: unknown[]) => { … }} variant="outline">
    {LEAD_CHOICES.map((m) => (<ToggleGroupItem key={m} value={String(m)}>{m} min</ToggleGroupItem>))}
  </ToggleGroup>
  ```
  (Note Base UI's `ToggleGroup` value is an **array**; read the selected item as
  `value[0]`.)
- Icons come from `lucide-react` (e.g. `Search`, `X`). Confirm an icon exists
  before importing — `lucide-react` is already a dependency.

**Conventions:** Prettier (no semicolons, double quotes). Per the global
project rule, prefer `size-8` over `w-8 h-8` for square sizing.

## Commands you will need

| Purpose   | Command          | Expected on success |
| --------- | ---------------- | ------------------- |
| Typecheck | `pnpm typecheck` | exit 0, `0 errors`  |
| Lint      | `pnpm lint`      | exit 0              |
| Build     | `pnpm build`     | exit 0              |
| Preview   | `pnpm preview`   | manual smoke test   |

(No `test` script exists — do not add one.)

## Scope

**In scope** (modify):

- `src/components/schedule/ScheduleApp.tsx`
- `src/components/schedule/ScheduleList.tsx`
- `src/components/schedule/ScheduleGrid.tsx`

**Out of scope** (do NOT touch):

- `src/lib/stores.ts` — the filter state is **ephemeral** (component state),
  intentionally not persisted. Do not add a nanostore for it.
- `src/content/**` — the `language` tags already exist; do not edit content.
- The favorites/`favoritesOnly` behavior — leave it working exactly as is; the
  new filter is _additive_ and composes with it (a session shows only if it
  matches the search/language filter AND passes the favorites filter).
- Server/backend anything.

## Git workflow

- Branch: `advisor/002-schedule-filters`
- Conventional commit, e.g. `feat: search and language filter for the schedule`.
  Do not mention any AI tool in the message.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Add a shared match predicate + filter state in `ScheduleApp.tsx`

In `ScheduleApp`, add ephemeral state and a pure predicate. Use `useState` from
React (add the import).

```tsx
const [query, setQuery] = useState("")
const [language, setLanguage] = useState<"all" | "de" | "en">("all")

const q = query.trim().toLowerCase()
const filtersActive = q !== "" || language !== "all"

function matchesFilter(s: SessionLite): boolean {
  // Breaks are structural, not chooseable sessions: hide them whenever a
  // filter is active so results aren't padded with coffee breaks.
  if (filtersActive && s.kind === "break") return false
  if (language !== "all" && s.language !== language) return false
  if (q === "") return true
  const haystack =
    `${s.title} ${s.speakers.map((sp) => sp.name).join(" ")}`.toLowerCase()
  return haystack.includes(q)
}

const matchedSlugs = new Set(
  daySessions.filter(matchesFilter).map((s) => s.slug)
)
```

Pass `matchedSlugs` and `filtersActive` to both views (added props in Steps 2–3):

```tsx
<ScheduleGrid … matchedSlugs={matchedSlugs} filtersActive={filtersActive} />
<ScheduleList … matchedSlugs={matchedSlugs} filtersActive={filtersActive} />
```

**Verify**: `pnpm typecheck` will fail until Steps 2–3 add the props — that's
expected; do not consider this step done until after Step 4's typecheck passes.

### Step 2: Make the list hide non-matches and gain a "no results" empty state

In `src/components/schedule/ScheduleList.tsx`:

- Extend `ScheduleListProps` with `matchedSlugs: Set<string>` and
  `filtersActive: boolean`.
- Change the `visible` computation (`:204-206`) to compose favorites + filter:
  ```tsx
  const visible = sessions.filter(
    (s) =>
      matchedSlugs.has(s.slug) && (!favoritesOnly || favorites.includes(s.slug))
  )
  ```
- The existing empty state (`:208-222`) assumes "no favorites." Make it
  context-aware: when `filtersActive` and nothing matched, show a "No matching
  sessions" message instead. Keep using the existing `Empty*` components
  (imported at `:6-12`); pick a sensible lucide icon already imported or add one
  (e.g. `SearchX`). Example:
  ```tsx
  if (visible.length === 0) {
    const title = filtersActive ? "No matching sessions" : "No favorites yet"
    const description = filtersActive
      ? "Try a different search term or language."
      : "Tap the heart on a session to build your personal schedule."
    return (<Empty …>{/* swap title/description; keep markup */}</Empty>)
  }
  ```

**Verify**: after Step 4, `pnpm typecheck` → exit 0.

### Step 3: Make the grid dim non-matches

In `src/components/schedule/ScheduleGrid.tsx`:

- Extend `ScheduleGridProps` (`:20-25`) with `matchedSlugs: Set<string>` and
  `filtersActive: boolean`.
- Update the `dimmed` prop where `SessionBlock` is rendered (`:288`) to also dim
  filtered-out sessions:
  ```tsx
  dimmed={
    (favoritesOnly && !favorites.includes(session.slug)) ||
    (filtersActive && !matchedSlugs.has(session.slug))
  }
  ```
  Leave the rest of the grid (geometry, now-line, scroll memory) untouched — the
  grid must keep rendering all `daySessions` so the time axis stays correct.

**Verify**: after Step 4, `pnpm typecheck` → exit 0.

### Step 4: Render the filter controls in `ScheduleApp.tsx`

Add a second controls row inside the existing sticky header
(`src/components/schedule/ScheduleApp.tsx:64-136`), below the view/favorites
row and above the day tabs (so it sits with the other controls and stays
sticky). Use `Input` for search and `ToggleGroup` for language:

```tsx
<div className="mt-2 flex items-center gap-2">
  <div className="relative flex-1">
    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      type="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search talks or speakers…"
      aria-label="Search sessions"
      className="pl-8"
    />
  </div>
  <ToggleGroup
    value={[language]}
    onValueChange={(value: unknown[]) => {
      const pick = String(value[0] ?? "all")
      setLanguage(pick === "de" || pick === "en" ? pick : "all")
    }}
    variant="outline"
  >
    <ToggleGroupItem value="all">All</ToggleGroupItem>
    <ToggleGroupItem value="de">DE</ToggleGroupItem>
    <ToggleGroupItem value="en">EN</ToggleGroupItem>
  </ToggleGroup>
</div>
```

Add the imports: `Input` from `@/components/ui/input`, `ToggleGroup`,
`ToggleGroupItem` from `@/components/ui/toggle-group`, and `Search` from
`lucide-react`. Guard against SSR/hydration mismatch the same way the rest of
this component does: filter state is local `useState` initialized to constants
(`""`, `"all"`), so it is identical on server and first client render — no extra
`mounted` gating needed for the inputs themselves.

> Optional nicety (keep only if it stays simple): when `filtersActive`, show a
> small count like `{matchedSlugs.size} match(es)` or a clear-(X) button that
> resets `query`/`language`. Do not over-build it.

**Verify**: `pnpm typecheck` → exit 0, `0 errors`. `pnpm lint` → exit 0.

### Step 5: Build + manual smoke test

**Verify (automated)**: `pnpm build` → exit 0.

**Verify (manual)**: `pnpm preview`, then in the browser:

- Type a speaker surname present in the schedule → list shows only their
  session(s); grid dims everything else.
- Type a word in a talk title → matching session(s) shown/highlighted.
- Click `EN` → only English talks remain (German talks hidden in list / dimmed
  in grid); breaks disappear while the filter is active.
- Clear the search and set language back to `All` → the full schedule returns,
  breaks included, grid undimmed.
- Toggle "My schedule" together with a language filter → only favorited sessions
  in that language show (the two filters compose).
- Switch day tabs → filters still apply to the newly shown day.

## Done criteria

ALL must hold:

- [x] `pnpm typecheck` exits 0, `0 errors`.
- [x] `pnpm lint` exits 0.
- [x] `pnpm build` exits 0.
- [x] Search matches on both session title and speaker names (verified manually
      in Step 5).
- [x] Language filter (`All`/`DE`/`EN`) narrows both views and composes with the
      favorites toggle.
- [x] No nanostore/`localStorage` key added (`git diff 9f0b076 -- src/lib/stores.ts` is empty).
- [x] Only the three in-scope files appear in `git status`.
- [x] `plans/README.md` status row for 002 updated.

## STOP conditions

Stop and report (do not improvise) if:

- The "Current state" excerpts don't match the live code (drift since `9f0b076`)
  — especially if `ScheduleApp`/`ScheduleList`/`ScheduleGrid` already have
  search/filter props (someone may have implemented this).
- Base UI's `ToggleGroup` `onValueChange` does not deliver an array here (the
  reminder-settings usage at `NotificationSettings.tsx:93-108` is the reference;
  if the runtime shape differs, report rather than guess).
- The grid breaks visually when many sessions are dimmed (e.g. the now-line or
  geometry shifts) — that would mean the change touched more than the `dimmed`
  flag.

## Maintenance notes

- Filter state is intentionally **ephemeral**. If a future requirement is "keep
  the language filter across reloads," add a `persistentAtom` in
  `src/lib/stores.ts` mirroring `$favoritesOnly` — that is a deliberate,
  separate change with its own data-shape decision.
- If a **topic/track taxonomy** is later added to session frontmatter, this same
  `matchesFilter` predicate is the place to extend; keep it a single pure
  function so grid and list never diverge.
- Reviewer should confirm the grid still renders all `daySessions` (axis
  integrity) and only the `dimmed` flag changed there.
