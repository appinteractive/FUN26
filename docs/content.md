# Maintaining content

All content is markdown with frontmatter, validated by Zod schemas in
`src/content.config.ts`. The build fails on schema violations, so typos
surface immediately.

## Sessions (`src/content/sessions/*.md`)

One file per session. Frontmatter: `title`, `start`/`end` (ISO with
`+02:00` offset), `stage`, `stageOrder`, `kind` (`talk` | `workshop` |
`break`), `speakers` (inline name/role/image). The markdown body is the
session description.

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

Speakers/attendees can PR these — the repo is the CMS.

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
