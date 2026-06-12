# FUN26 Schedule

Offline-capable PWA for the Freelance Unlocked conference (June 12, 2026):
parallel-track schedule, personal favorites, and session reminders.

Built with Astro 6, React 19, Tailwind 4, and shadcn/ui on Base UI.

## Features

- **Schedule grid** — five parallel stages on a time grid with sticky
  time gutter and stage headers, live "now" line, plus a chronological
  list view. View choice is remembered.
- **Favorites** — heart any session ("My schedule" filter). Stored in
  `localStorage`, synced across tabs and pages.
- **Reminders** — browser notifications N minutes before favorited
  sessions (5/10/15/30 min lead). Fire while the app is open or installed;
  `.ics` calendar export of favorites as the guaranteed fallback.
- **Offline PWA** — installable, full precache of all pages, styles, and
  speaker photos via Workbox. Works with no connectivity.

## Content

Sessions live as markdown in `src/content/sessions/*.md` — one file per
session with frontmatter (`title`, `start`, `end`, `stage`, `kind`,
`speakers`) and the description as body. Edit or add files there to
change the schedule; everything else derives from it at build time.

Times are stored with explicit `+02:00` offsets and always rendered in
Europe/Berlin time.

## Commands

```bash
pnpm dev        # start dev server
pnpm build      # build static site + service worker to dist/
pnpm preview    # serve the production build
pnpm typecheck  # astro check
pnpm lint       # eslint
```

Note: the service worker is only generated in production builds — test
offline behavior with `pnpm build && pnpm preview`.
