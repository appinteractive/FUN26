# Plan 001: Extract event identity into a single config (template keystone)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 9f0b076..HEAD -- astro.config.mjs src/layouts/main.astro src/lib/venue.ts src/lib/time.ts src/lib/notifications.ts src/components/ShareSchedule.tsx src/components/NotesOverview.tsx src/pages`
> If any in-scope file changed since this plan was written, compare the "Current
> state" excerpts below against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: direction (template / reusability)
- **Planned at**: commit `9f0b076`, 2026-06-15

## Why this matters

The maintainer wants FUN26 to become a **reusable conference template**. The
schedule data and multi-day handling are already content-driven, but the event's
*identity* — name, tagline, brand color, timezone, venue map, attribution,
manifest text — is hardcoded across ~10 files. Reusing the app for the next
edition (or another event) today means hunting those strings down by grep. This
plan centralizes all of it into one `src/event.config.ts` so adapting the app to
a new event is a single-file edit. It is the keystone of the template trajectory
and should land before the feature plans (002, 003) so they read the config
instead of re-hardcoding strings.

## Current state

Event identity is scattered. Exact locations (verified at `9f0b076`):

- `astro.config.mjs:20-39` — PWA manifest, hardcoded:
  ```js
  manifest: {
    name: "FUN26 Schedule (unofficial)",
    short_name: "FUN26",
    description:
      "Unofficial schedule and personal favorites for the Freelance Unlocked conference, June 12, 2026. Community-built, not affiliated with the organizers.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#E9664C",
    icons: [ /* keep as-is */ ],
  },
  ```
- `src/layouts/main.astro` — the brand header, theme-color meta, footer
  attribution, default title. Key lines:
  - `:14` `const { title = "FUN26 – Freelance Unlocked" } = Astro.props`
  - `:26` `<meta name="theme-color" content="#E9664C" />`
  - `:70-77` header brand: `>FUN26</span>` + `>Freelance Unlocked</span>`
  - `:78-83` the `unofficial` badge
  - `:116-121` footer link `https://www.linkedin.com/in/grzegorz-leoniec` → `Grzegorz Leoniec`
  - `:123` `· unofficial companion app for FUN26`
  - Note `:34` `localStorage.getItem("fun26.theme")` — **leave unchanged** (storage key, out of scope).
- `src/lib/venue.ts:1-13` — the per-stage venue map, hardcoded:
  ```ts
  /** Stage locations from the printed FUN26 conference map. */
  export interface StageVenue {
    kino: number
    level: "Upper Level" | "Ground Level"
  }
  export const STAGE_VENUES: Record<string, StageVenue> = {
    "exali Main Stage": { kino: 10, level: "Upper Level" },
    "Grow & Sell": { kino: 7, level: "Upper Level" },
    "Beyond the hustle": { kino: 9, level: "Upper Level" },
    "freelancermap Stage": { kino: 4, level: "Ground Level" },
    "Workshop Room": { kino: 2, level: "Ground Level" },
  }
  export function venueOf(stage: string): StageVenue | undefined { return STAGE_VENUES[stage] }
  export function venueLabel(stage: string): string | undefined {
    const venue = venueOf(stage)
    return venue && `Kino ${venue.kino} · ${venue.level}`
  }
  ```
- `src/lib/time.ts:1` `const BERLIN = "Europe/Berlin"` — timezone, used in
  `fmtTime`, `dayKey`, `fmtDay`.
- `src/lib/notifications.ts:56` `timeZone: "Europe/Berlin"` — duplicate of the
  same timezone.
- `src/components/ShareSchedule.tsx:108` `title: "My FUN26 schedule"` and `:293`
  `That doesn&apos;t look like a FUN26 schedule link.`
- `src/components/NotesOverview.tsx:22` `["# My FUN26 notes", ""]` and `:71`
  `a.download = "fun26-notes.md"`.
- `src/lib/ics.ts:54` `a.download = "fun26-favorites.ics"` — user-facing download
  filename (in scope). **But `:22` `PRODID:-//FUN26//Schedule//EN` and `:29`
  `UID:${s.slug}@fun26` are calendar identifiers — leave unchanged (out of scope).**
- Page title suffixes ` – FUN26`:
  - `src/pages/index.astro:9` `title="Schedule – FUN26"`
  - `src/pages/notes.astro:9` `title="My notes – FUN26"`
  - `src/pages/speakers/index.astro:8` `title="Speakers – FUN26"` and `:12`
    `Everyone on stage at Freelance Unlocked 2026.`
  - `src/pages/schedule/[slug].astro:45` `` title={`${title} – FUN26`} ``
  - `src/pages/speakers/[slug].astro:28` `` title={`${name} – FUN26`} `` and
    `:97` `… at FUN26`

**Conventions to follow:**
- Path alias `@/` → `src/` (see `tsconfig.json` / `components.json`; used as
  `@/lib/...` throughout). New file is importable as `@/event.config`.
- `.astro` files import TS in their frontmatter fence exactly like
  `src/pages/notes.astro:2-4` does (`import { … } from "@/..."`).
- The repo uses Prettier (no semicolons, double quotes) — match surrounding
  style; do not add semicolons.

## Commands you will need

| Purpose   | Command          | Expected on success            |
|-----------|------------------|--------------------------------|
| Install   | `pnpm install`   | exit 0 (deps already installed)|
| Typecheck | `pnpm typecheck` | exit 0, `0 errors`             |
| Lint      | `pnpm lint`      | exit 0, no output              |
| Build     | `pnpm build`     | exit 0, writes `dist/`         |
| Preview   | `pnpm preview`   | serves the build for smoke test|

(There is no `test` script — do not invent one.)

## Scope

**In scope** (modify):
- `src/event.config.ts` (create)
- `astro.config.mjs`
- `src/layouts/main.astro`
- `src/lib/venue.ts`
- `src/lib/time.ts`
- `src/lib/notifications.ts`
- `src/components/ShareSchedule.tsx`
- `src/components/NotesOverview.tsx`
- `src/lib/ics.ts` (only the `a.download` filename on line 54)
- `src/pages/index.astro`, `src/pages/notes.astro`,
  `src/pages/speakers/index.astro`, `src/pages/schedule/[slug].astro`,
  `src/pages/speakers/[slug].astro`

**Out of scope** (do NOT touch):
- Any `fun26.*` `localStorage` / `sessionStorage` key string (in `stores.ts`,
  `main.astro:34`, `ThemeToggle.tsx`, `notifications.ts:15`,
  `ScheduleGrid.tsx`, `ScheduleList.tsx`). Renaming them silently drops existing
  users' favorites, notes and theme. They are a fixed namespace, not branding.
- `src/lib/ics.ts` `PRODID` (`:22`) and `UID` (`:29`) — calendar identifiers,
  not user-visible.
- `notifications.ts:35` `tag: \`fun26-${session.slug}\`` — notification dedupe
  tag, not user-visible.
- The manifest `icons` array, `start_url`, `scope`, `display`,
  `background_color`, and `registerType`/`strategies` in `astro.config.mjs`.
- Any `src/content/**` markdown.

## Git workflow

- Branch: `advisor/001-event-config`
- The repo uses Conventional Commits (see `git log`: `feat: …`, `chore: …`).
  Suggested message: `refactor: centralize event identity in event.config.ts`.
  **Do not mention any AI tool in the commit message.**
- Do NOT push or open a PR unless the operator instructs it.

## Steps

### Step 1: Create `src/event.config.ts`

Create the file with this exact shape (a dependency-free, pure-data module so it
can be imported from both `astro.config.mjs` and app code). Fill the values from
the current hardcoded strings above:

```ts
export interface EventConfig {
  /** Human event name, e.g. used as the header tagline and in titles. */
  name: string
  /** Short brand/abbreviation, e.g. header logo + PWA short_name + title suffix. */
  shortName: string
  /** Primary brand color as a hex string; drives <meta theme-color> + manifest. */
  themeColor: string
  /** IANA timezone all session times render in. */
  timeZone: string
  /** Whether this is a community/unofficial build (renders the "unofficial" badge + copy). */
  unofficial: boolean
  /** Footer attribution. */
  author: { name: string; url: string }
  /** PWA manifest text. */
  manifest: { name: string; description: string }
  /**
   * Per-stage venue location, shown next to the stage name.
   * Key = exact stage name used in session frontmatter; value = a FREE-FORM
   * label the deployer fully controls (a cinema screen, a room, a hall, a
   * floor — whatever this event uses). No venue terminology is baked into the
   * code. Stages with no entry simply render without a venue label.
   */
  venues: Record<string, string>
}

export const event: EventConfig = {
  name: "Freelance Unlocked",
  shortName: "FUN26",
  themeColor: "#E9664C",
  timeZone: "Europe/Berlin",
  unofficial: true,
  author: {
    name: "Grzegorz Leoniec",
    url: "https://www.linkedin.com/in/grzegorz-leoniec",
  },
  manifest: {
    name: "FUN26 Schedule (unofficial)",
    description:
      "Unofficial schedule and personal favorites for the Freelance Unlocked conference, June 12, 2026. Community-built, not affiliated with the organizers.",
  },
  // FUN26 is held in a cinema, so its labels read "Kino N · Level" — but that
  // wording lives only here in the data, not in any code. Another event would
  // write "Room 4", "Main Hall", "Floor 2 · East", etc.
  venues: {
    "exali Main Stage": "Kino 10 · Upper Level",
    "Grow & Sell": "Kino 7 · Upper Level",
    "Beyond the hustle": "Kino 9 · Upper Level",
    "freelancermap Stage": "Kino 4 · Ground Level",
    "Workshop Room": "Kino 2 · Ground Level",
  },
}
```

**Verify**: `pnpm typecheck` → exit 0, `0 errors` (the file compiles; nothing
imports it yet).

### Step 2: Point `src/lib/venue.ts` at the config

Replace the whole file. The venue label is now a free-form per-stage string in
the config, so `venue.ts` shrinks to a single lookup — and the word "Kino" no
longer appears anywhere in code. Keep the `venueLabel` signature
(`(stage: string) => string | undefined`) identical, because every caller uses
it (verified — `ScheduleList.tsx:171`, `ScheduleGrid.tsx:243-245`,
`schedule/[slug].astro:90`, `speakers/[slug].astro:116-117`):

```ts
import { event } from "@/event.config"

/** Free-form venue label for a stage (room/hall/screen/…), or undefined. */
export function venueLabel(stage: string): string | undefined {
  return event.venues[stage]
}
```

Drop `StageVenue`, `STAGE_VENUES`, and `venueOf` entirely — nothing else imports
them (verified at `9f0b076`: `grep -rn "venueOf\|StageVenue\|STAGE_VENUES" src`
returns only `venue.ts`). The label format (`Kino N · Level`) is preserved
because the full strings now live in the config's `venues` values, not in code.

**Verify**: `grep -rn "STAGE_VENUES\|StageVenue\|venueOf" src` → no matches.
Then `pnpm typecheck` → exit 0.

### Step 3: Route the timezone through the config

- `src/lib/time.ts:1`: replace `const BERLIN = "Europe/Berlin"` with
  `import { event } from "@/event.config"` and use `event.timeZone` wherever
  `BERLIN` was referenced (in `fmtTime`, `dayKey`, `fmtDay`). The simplest edit
  keeps a local alias: `const TZ = event.timeZone` and replace `BERLIN` → `TZ`.
- `src/lib/notifications.ts:52-58`: the `formatTime` helper hardcodes
  `timeZone: "Europe/Berlin"`. Import the config and use `event.timeZone`.

**Verify**: `grep -rn "Europe/Berlin" src` → no matches. Then `pnpm typecheck` →
exit 0.

### Step 4: Drive `astro.config.mjs` manifest from the config

`astro.config.mjs` is loaded by Astro through esbuild and can import a TS module.
Add at the top (with the other imports):

```js
import { event } from "./src/event.config.ts"
```

Then replace the three hardcoded manifest fields:

```js
manifest: {
  name: event.manifest.name,
  short_name: event.shortName,
  description: event.manifest.description,
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: event.themeColor,
  icons: [ /* unchanged */ ],
},
```

**Verify**: `pnpm build` → exit 0. Then confirm the generated manifest still has
the right values:
`grep -o '"theme_color":"[^"]*"' dist/manifest.webmanifest` → `"theme_color":"#E9664C"`.
(If the manifest filename differs, `ls dist/*.webmanifest` to find it.)

> If `pnpm build` fails with a module-resolution error on the
> `./src/event.config.ts` import, this is a STOP condition (see below) — do not
> work around it by duplicating the values back into the config.

### Step 5: Replace branding in `src/layouts/main.astro`

In the frontmatter fence, add `import { event } from "@/event.config"`. Then:
- `:14` default title → `` const { title = `${event.shortName} – ${event.name}` } = Astro.props ``
- `:26` theme-color meta → `<meta name="theme-color" content={event.themeColor} />`
- `:70-77` header brand: render `{event.shortName}` and `{event.name}` instead of
  the literal `FUN26` / `Freelance Unlocked`.
- `:78-83` `unofficial` badge: wrap in `{event.unofficial && ( … )}` so a
  non-community deployment can hide it.
- `:116-123` footer: use `{event.author.url}`, `{event.author.name}`, and for the
  trailing copy `· {event.unofficial ? "unofficial companion app" : "companion app"} for {event.shortName}`.
- **Leave `:34` `localStorage.getItem("fun26.theme")` exactly as is.**

**Verify**: `pnpm typecheck` → exit 0. `grep -n "FUN26\|Freelance Unlocked\|E9664C\|grzegorz-leoniec" src/layouts/main.astro` → only the `fun26.theme` storage key on line ~34 remains.

### Step 6: Replace remaining user-facing strings

- `src/components/ShareSchedule.tsx`: import `{ event }` from `@/event.config`;
  `:108` → `` title: `My ${event.shortName} schedule` ``; `:293` →
  `` That doesn't look like a {event.shortName} schedule link. `` (keep it valid
  JSX; the existing `&apos;` can become a normal apostrophe inside the braces or
  stay as text — match the surrounding JSX).
- `src/components/NotesOverview.tsx`: import `{ event }`; `:22` →
  `` const parts = [`# My ${event.shortName} notes`, ""] ``; `:71` →
  `` a.download = `${event.shortName.toLowerCase()}-notes.md` ``.
- `src/lib/ics.ts:54` only: `` a.download = `${event.shortName.toLowerCase()}-favorites.ics` `` (add the import). **Do not change `PRODID` or `UID`.**
- Page titles — add `import { event } from "@/event.config"` to each frontmatter
  and swap the literal:
  - `index.astro:9` → `` title={`Schedule – ${event.shortName}`} ``
  - `notes.astro:9` → `` title={`My notes – ${event.shortName}`} ``
  - `speakers/index.astro:8` → `` title={`Speakers – ${event.shortName}`} ``;
    `:12` → `Everyone on stage at {event.name}.`
  - `schedule/[slug].astro:45` → `` title={`${title} – ${event.shortName}`} ``
  - `speakers/[slug].astro:28` → `` title={`${name} – ${event.shortName}`} ``;
    `:97` → `… at {event.shortName}` (keep the surrounding markup).

**Verify**: `pnpm typecheck && pnpm lint` → both exit 0.

### Step 7: Full build + grep sweep + manual smoke test

**Verify (automated)**:
- `pnpm build` → exit 0.
- `grep -rn "FUN26" src | grep -v "fun26\." | grep -v "ics.ts"` → returns
  nothing (every user-facing `FUN26` now comes from the config; the only
  remaining literal `FUN26` tokens are the `PRODID`/`UID` in `ics.ts`, which are
  out of scope, and lowercased `fun26.` storage keys).
- `grep -rn "Europe/Berlin\|E9664C" src` → no matches.

**Verify (manual)**: run `pnpm preview`, open the served URL, and confirm:
- Header still shows `FUN26` + `Freelance Unlocked` and the `unofficial` badge.
- Times still render in Europe/Berlin (e.g. a 14:00 session reads `14:00`).
- A session detail page shows its venue as `Kino N · … Level`.
- Dark/light theme toggle still works (storage key untouched).

## Done criteria

ALL must hold:

- [ ] `src/event.config.ts` exists and exports `event` typed as `EventConfig`.
- [ ] `pnpm typecheck` exits 0 with `0 errors`.
- [ ] `pnpm lint` exits 0.
- [ ] `pnpm build` exits 0; `dist/*.webmanifest` contains `"theme_color":"#E9664C"` and `"short_name":"FUN26"`.
- [ ] `grep -rn "Europe/Berlin\|E9664C" src` → no matches.
- [ ] `grep -rn "STAGE_VENUES\|StageVenue\|venueOf" src` → no matches.
- [ ] No "Kino" (or any venue-type term) remains in code — only in the config's
      `venues` values: `grep -rn "Kino" src | grep -v event.config` → no matches.
- [ ] No `fun26.*` storage key, nor `ics.ts` `PRODID`/`UID`, was modified
      (`git diff 9f0b076 -- src/lib/stores.ts src/components/ThemeToggle.tsx` is empty;
      `git diff 9f0b076 -- src/lib/ics.ts` shows only the `a.download` line changed).
- [ ] Only files in the In-scope list appear in `git status`.
- [ ] `plans/README.md` status row for 001 updated.

## STOP conditions

Stop and report (do not improvise) if:

- The "Current state" excerpts don't match the live code (drift since `9f0b076`).
- `pnpm build` fails on importing `./src/event.config.ts` into `astro.config.mjs`
  (module resolution / TS-in-config issue). Report the exact error — the
  fallback (renaming to `astro.config.ts`, or a JSON config) is a design choice
  for the operator, not something to guess.
- Changing a string forces you to touch an out-of-scope storage key to keep
  things working.
- After Step 7, the manual smoke test shows wrong times, missing venue labels,
  or lost theme state.

## Maintenance notes

- **For the next event**, `src/event.config.ts` is now the single edit point for
  name, brand color, timezone, attribution, manifest text, and the venue map.
  Stages in `venues` must match the `stage` strings in session frontmatter
  exactly (same matching contract as today).
- **Venue labels are deliberately free-form strings.** The code no longer knows
  what a venue *is* — "Kino 10 · Upper Level" is just data. Another event writes
  "Room 4", "Main Hall", etc. If a future feature needs *structured* venue data
  (e.g. grouping stages by floor), reintroduce a typed shape in the config and
  derive the label from it — don't hardcode the structure back into `venue.ts`.
- A reviewer should confirm no `localStorage`/`sessionStorage` key changed
  (data-loss risk) and that the manifest still validates.
- **Deferred on purpose** (future plan, not this one): parameterizing the
  `fun26.` storage namespace and the `.ics` `PRODID`/`UID` behind the config.
  These need a migration story for existing users' saved data, so they were left
  out to keep this refactor zero-risk for current users. The event dates remain
  derived from session content (see `dayRangeLabel` in `src/lib/sessions.ts`) —
  do not add a hardcoded date to the config.
