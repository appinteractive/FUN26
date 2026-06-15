# Plan 004: Content-integrity check (images + speaker-name linkage)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> "STOP condition" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 9f0b076..HEAD -- src/content package.json docs/content.md src/content.config.ts`
> If the content schema/layout changed materially, re-confirm "Current state"
> before proceeding.

## Status

- **Priority**: P3
- **Effort**: S–M
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction (DX / template robustness)
- **Planned at**: commit `9f0b076`, 2026-06-15

## Why this matters

The repo is the CMS: sessions and speakers are markdown anyone can PR
(`docs/content.md`). Two failures are currently silent:

1. A session/speaker `image:` that doesn't exist in `public/`. The Zod schema
   checks `image` is a *string*, not that the **file exists**, so a typo ships a
   broken `<img>` with no build error.
2. Speakers link to profiles **by exact name string** (`src/lib/speakers.ts:13-16`
   builds `Map<name, profile>`; `src/pages/schedule/[slug].astro:106` does
   `profiles.get(speaker.name)`). `docs/content.md:83-86` warns a misspelled name
   "silently shows an unlinked speaker row." Nothing catches it.

For a template that invites content PRs, a one-command check turns both into
loud, pre-merge failures. Dependency-free Node script — the repo has no test
framework.

## Current state

- Content: `src/content/sessions/*.md`, `src/content/speakers/*.md`.
- Session speaker entries (verified `src/content/sessions/b0cc38-…md:8-12`):
  ```yaml
  speakers:
    - name: "Jan Schlie"
      role: "VP of AI Jimdo"
      image: "/speakers/jan-schlie.jpg"
  ```
- Speaker profile frontmatter: `name`, `role`, `image`, optional
  `linkedin`/`website` + bio body (schema `src/content.config.ts:37-46`).
- **Day-1 speakers intentionally have no profile** and use generated avatars:
  session `image` ends `.svg` (e.g. `src/content/sessions/061619-…md:12` →
  `/speakers/tomas-stiller.svg`); day-2 speakers use `.jpg` photos
  (`docs/content.md:48-53`). So "no profile" is **expected** for `.svg` and a
  **likely mistake** for `.jpg`. Image-existence = hard error; missing-profile =
  warning, only for `.jpg`.
- `package.json` scripts (`:10-18`): `dev`, `build`, `preview`, `astro`, `lint`,
  `format`, `typecheck` — no `test`. `"type": "module"`, Node `>=22.12.0`.
- Image paths are site-relative: `/speakers/x.jpg` → `public/speakers/x.jpg`.

**Conventions:** ESM, Prettier (no semicolons, double quotes).

## Commands you will need

| Purpose       | Command                          | Expected on success          |
|---------------|----------------------------------|------------------------------|
| Run the check | `node scripts/check-content.mjs` | exit 0, `OK:` summary line    |
| Via pnpm      | `pnpm check:content`             | same                          |
| Lint          | `pnpm lint`                      | exit 0                        |
| Typecheck     | `pnpm typecheck`                 | exit 0                        |

## Scope

**In scope** (create/modify):
- `scripts/check-content.mjs` (create)
- `package.json` (add one `scripts` entry: `check:content`)
- `docs/content.md` (append a short "Validation" note)

**Out of scope** (do NOT touch):
- `src/content/**` — the check **reads** content; never edits it. If it finds a
  real broken reference, report — do not "fix" content here.
- `src/content.config.ts` — do not move file-existence checks into Zod.
- Wiring into `pnpm build`/CI — keep it standalone for now.

## Git workflow

- Branch: `advisor/004-content-check`
- Conventional commit, e.g. `chore: add content-integrity check script`. Do not
  mention any AI tool in the message.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Create `scripts/check-content.mjs`

Dependency-free Node ESM. Hard-fails on any `image:` not resolving under
`public/`; warns (non-failing) on `.jpg` session speakers with no profile. Use
this exact implementation:

```js
#!/usr/bin/env node
// Content-integrity check — see plans/004 and docs/content.md.
// Hard-fails on missing image files; warns on .jpg speakers without a profile.
import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const sessionsDir = join(root, "src/content/sessions")
const speakersDir = join(root, "src/content/speakers")
const publicDir = join(root, "public")

/** Lines between the first two `---` frontmatter fences. */
function frontmatter(text) {
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== "---") return []
  const end = lines.indexOf("---", 1)
  return end === -1 ? [] : lines.slice(1, end)
}

function readMd(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ name: f, fm: frontmatter(readFileSync(join(dir, f), "utf8")) }))
}

const IMAGE = /^\s*image:\s*["']?([^"'\s]+)["']?\s*$/
const LIST_NAME = /^\s*-\s*name:\s*["']?(.+?)["']?\s*$/
const TOP_NAME = /^\s*name:\s*["']?(.+?)["']?\s*$/

const errors = []
const warnings = []

// (1) Speaker profile names (top-level `name:` in each speaker file).
const speakerFiles = readMd(speakersDir)
const profileNames = new Set()
for (const s of speakerFiles) {
  for (const line of s.fm) {
    const m = line.match(TOP_NAME)
    if (m) profileNames.add(m[1].trim())
  }
}

// (2) Every image: reference (sessions + speakers) must exist in public/.
let imageCount = 0
for (const entry of [...readMd(sessionsDir), ...speakerFiles]) {
  for (const line of entry.fm) {
    const m = line.match(IMAGE)
    if (!m) continue
    const ref = m[1].trim()
    if (!ref.startsWith("/")) continue // skip remote/relative
    imageCount++
    if (!existsSync(join(publicDir, ref.replace(/^\//, "")))) {
      errors.push(`${entry.name}: image not found in public/: ${ref}`)
    }
  }
}

// (3) Session speakers: warn when a .jpg speaker has no profile page.
function maybeWarn(file, sp) {
  if (!sp.name || profileNames.has(sp.name)) return
  if (sp.image && !sp.image.endsWith(".jpg")) return // day-1 .svg avatars: expected
  warnings.push(`${file}: speaker "${sp.name}" has no /speakers profile (renders unlinked)`)
}

for (const sess of readMd(sessionsDir)) {
  let cur = null
  for (const line of sess.fm) {
    const nm = line.match(LIST_NAME)
    if (nm) {
      cur = { name: nm[1].trim(), image: "" }
      const im0 = line.match(IMAGE)
      if (im0) cur.image = im0[1].trim()
      maybeWarn(sess.name, cur)
      continue
    }
    if (cur) {
      const im = line.match(IMAGE)
      if (im) {
        cur.image = im[1].trim()
        maybeWarn(sess.name, cur)
      }
    }
  }
}

for (const w of [...new Set(warnings)]) console.warn("WARN  " + w)
if (errors.length) {
  for (const e of errors) console.error("ERROR " + e)
  console.error(`\nFAILED: ${errors.length} broken image reference(s); ${imageCount} checked.`)
  process.exit(1)
}
console.log(
  `OK: ${imageCount} image refs resolve. ` +
    `${new Set(warnings).size} speaker(s) without a profile (warnings only).`
)
```

> Note on (3): `maybeWarn` may run before `cur.image` is known (when `- name:`
> and `image:` are on separate lines); it runs again on the `image:` line, and
> duplicate warnings are de-duped via `new Set` before printing — so a
> `.jpg`-with-no-profile is reported once and a `.svg` one is suppressed once the
> image line is seen. Intentional; do not "simplify" into a single early call.

**Verify**: `node scripts/check-content.mjs` → exits 0, prints an `OK:` line with
a non-zero image count (sessions reference many `.jpg`/`.svg` images plus 34 in
speaker files; all should resolve). If the image count is 0, the regex/paths are
wrong — STOP.

### Step 2: Prove it catches a broken reference

Temporarily break one `image:` path, confirm the hard-fail, then revert:
- Edit any session's `image:` to a non-existent file →
  `node scripts/check-content.mjs` prints `ERROR …: image not found` and
  `echo $?` → `1`.
- `git checkout -- <that file>` → check exits 0 again; `git status` clean of
  content changes.

### Step 3: Add the `pnpm check:content` script

In `package.json` `scripts` (`:10-18`), add (keep valid JSON):

```json
"check:content": "node scripts/check-content.mjs",
```

**Verify**: `pnpm check:content` → exit 0 with `OK:`. `pnpm lint` → exit 0.
`pnpm typecheck` → exit 0 (an `.mjs` script must not affect `astro check`).

### Step 4: Document it in `docs/content.md`

Append a concise "Validation" subsection, matching the doc's imperative tone:

```markdown
## Validation

Run `pnpm check:content` before committing content changes. It fails if any
session or speaker `image:` points at a file missing from `public/`, and warns
when a session speaker (with a `.jpg` photo) has no matching `/speakers`
profile — the silent "unlinked speaker row" case. Day-1 speakers using generated
`.svg` avatars are expected to have no profile and are not warned about.
```

**Verify**: `pnpm lint` → exit 0.

## Done criteria

ALL must hold:

- [ ] `scripts/check-content.mjs` exists; `node scripts/check-content.mjs` exits
      0 at current content, printing `OK:` with a non-zero image count.
- [ ] Introducing a bad `image:` makes it exit 1 with `ERROR` (Step 2, reverted).
- [ ] `package.json` has `check:content`; `pnpm check:content` works.
- [ ] `docs/content.md` documents the command.
- [ ] `pnpm lint` and `pnpm typecheck` both exit 0.
- [ ] `git diff 9f0b076 -- src/content` is empty (no content modified).
- [ ] Only in-scope files appear in `git status`.
- [ ] `plans/README.md` status row for 004 updated.

## STOP conditions

Stop and report (do not improvise) if:

- The check reports `ERROR` on the **unmodified** repo — that's a real content
  bug to surface, not something this plan fixes. Report the broken references.
- The image count is 0, or warnings flood with `.jpg` speakers — frontmatter
  format may have drifted; re-check regexes against a real file first.
- Frontmatter no longer uses the `- name:` / `image:` shape from "Current state".

## Maintenance notes

- This is a **line-parser**, not a YAML parser — it relies on consistent
  frontmatter (one `image:`/`name:` per line, 2-space list indent). If
  contributors adopt multi-line/flow YAML, switch to Astro's content APIs or add
  a YAML dependency.
- Follow-up (out of scope): gate `pnpm build`/CI on `pnpm check:content` once
  warnings are triaged to zero, making missing profiles hard errors too.
- The `.jpg`-vs-`.svg` heuristic encodes the day-1/day-2 avatar convention
  (`docs/content.md:48-53`); update `maybeWarn` if that changes.
