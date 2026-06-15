# FUN26 docs

Working knowledge for this project, kept next to the code so it compounds:
every significant decision, research result or convention gets written down
here once, so future sessions (human or AI) don't re-derive it.

- [`content.md`](./content.md) — how to maintain sessions, speaker profiles
  and session resources.
- [`decisions/`](./decisions/) — architecture decision records (ADRs).
  One file per decision, numbered, never rewritten — superseded decisions
  get a new ADR that links back.

## Current architecture in one paragraph

Fully static Astro 6 + React 19 PWA. Sessions and speaker profiles are
markdown content collections compiled at build time; all per-user state
(favorites, reminders, personal notes, theme) lives in localStorage via
persistent nanostores. There is no backend, no accounts and no tracking.
Features that need shared state (live Q&A, ratings, favorite counts,
cross-device sync) are blocked on the backend decision in
[ADR 0001](./decisions/0001-backend-surrealdb-linkedin-auth.md).
