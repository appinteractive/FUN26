# Maintaining content

All content is markdown with frontmatter, validated by Zod schemas in
`src/content.config.ts`. The build fails on schema violations, so typos
surface immediately.

## Sessions (`src/content/sessions/*.md`)

One file per session. Frontmatter: `title`, `start`/`end` (ISO with
`+02:00` offset), `stage`, `stageOrder`, `kind` (`talk` | `workshop` |
`break`), optional `language` (`de` | `en`), `speakers` (inline
name/role/image). The markdown body is the session description.

The schedule UI derives the event days from the session start dates — a
day switcher appears automatically as soon as sessions span more than one
calendar day (Europe/Berlin), and the header date range follows along.
Stages are computed per day, so the two days can have different stage
layouts.

Language provenance: the `language` tags were inferred from the talk
titles (German title → `de`), since the official schedule's language
labels are not reachable from this environment (freelanceunlocked.com
serves HTTP 403 to non-browser clients). Verify against
https://freelanceunlocked.com/en/schedule when possible — especially
English-titled talks, which could still be held in German.

### Session resources (slides, links, …)

Add a `resources` list to a session's frontmatter to show a
"Slides & resources" section on its detail page — e.g. after the talk,
when speakers publish their material:

```yaml
resources:
  - label: "Slides (PDF)"
    url: "https://example.com/talk.pdf"
    kind: slides # slides | video | code | link (icon only; default: link)
  - label: "Companion repo"
    url: "https://github.com/example/repo"
    kind: code
```

Speakers/attendees can PR these — the repo is the CMS. For files hosted
by the app itself (e.g. a speaker's handout PDF), put the file in
`public/resources/` and use a site-relative `url` like
`/resources/the-beautiful-mosaic-handout.pdf`.

## Speaker profiles (`src/content/speakers/*.md`)

One file per speaker; the filename is the slug used at `/speakers/<slug>`
and must match the photo in `public/speakers/<slug>.jpg`. Frontmatter:
`name`, `role`, `image`, optional `linkedin` and `website` URLs. The
markdown body is the bio shown on the profile page.

Profiles are matched to sessions **by exact `name` string** — if a name is
spelled differently in a session file, the session page silently shows an
unlinked speaker row. When adding a session or speaker, keep names
identical in both places.

Provenance: the initial LinkedIn/website links were researched from public
sources (June 2026). Lower-confidence entries to double-check with the
speakers themselves: Daniel Herken (common name), Lukas Fehling (LinkedIn
handle), Sophie Vaessen, Sherin Kharabish (no personal LinkedIn found;
links to freelancermap.de). Rainer Schlegel and Lilian Tschan link to
their official government profile pages instead of a personal site.

## Personal notes

Notes are per-session, stored only in `localStorage`
(`fun26.notes`, keyed by session slug) via a persistent nanostore in
`src/lib/stores.ts`. No server involved; clearing site data deletes them.
All notes are collected on the `/notes` page (linked in the header),
which also offers a markdown export; sessions with notes show a small
pen icon in the schedule list and grid.
