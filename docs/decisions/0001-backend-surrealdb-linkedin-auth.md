# ADR 0001: Backend on SurrealDB, identity via LinkedIn OAuth

- **Status:** proposed (noted 2026-06-12, not yet started)
- **Owner:** —

## Context

The app is intentionally static: markdown content collections, localStorage
for per-user state, no server. That ceiling is reached as soon as a feature
needs *shared* state. The features on the wishlist that need a backend, in
rough priority order:

1. **Live Q&A per session** — submit questions, upvote, moderator view
   (Slido-style; the headline interactive feature).
2. **Session ratings/feedback** — one-tap stars + optional comment after a
   session ends.
3. **Favorite counts / interest signal** — anonymous aggregate of how many
   people favorited a session.
4. **Live announcements** — organizer messages ("room changed"), surfaced
   through the existing notification plumbing.
5. **Cross-device sync** of favorites and notes (the only one that strictly
   needs identity).

## Decision (proposed)

- **Database: SurrealDB.** One system covers document storage, relations
  and **live queries** (websocket subscriptions), which maps directly onto
  Q&A upvote feeds without adding a separate realtime layer. Can run
  embedded/self-hosted or via Surreal Cloud.
- **Identity: LinkedIn OAuth** (OpenID Connect). This is a freelancing
  conference — every attendee has a LinkedIn account, and verified names
  raise the quality of questions/comments. SurrealDB record users +
  `DEFINE ACCESS ... TYPE RECORD` can hold sessions issued after the OAuth
  callback; the callback itself needs a tiny serverless function (the only
  server-side code besides the DB).

## Feature → auth mapping

Keep anonymous paths wherever possible; LinkedIn login is required only
where identity adds value:

| Feature | Anonymous? |
|---|---|
| Q&A: read questions | yes |
| Q&A: submit/upvote | yes (client-generated id), optional named via LinkedIn |
| Ratings | yes |
| Favorite counts | yes |
| Cross-device sync | LinkedIn login required |
| Moderator view | restricted (allowlisted accounts) |

## Consequences / risks

- The app stops being free to operate (DB hosting) and gains an
  availability dependency — the static schedule must keep working fully
  if the backend is down (progressive enhancement, never a hard
  dependency).
- GDPR: LinkedIn login stores personal data → needs privacy policy,
  data deletion path, and a DPA with the DB host. Anonymous features
  should store no PII at all.
- LinkedIn OAuth requires a registered LinkedIn app and verified company
  page; request only `openid profile` scopes.
- Conference-day load is spiky (hundreds of concurrent users for one day,
  then nothing). Sizing/caching should assume that shape; a single small
  SurrealDB instance is plenty.

## Alternatives considered

- **Supabase/Firebase:** more turnkey auth, but a heavier stack than needed
  and less interesting fit for live queries per session record.
- **Cloudflare Workers + Durable Objects:** great latency/cost shape for
  Q&A rooms, but bespoke data modelling; revisit if SurrealDB hosting turns
  out to be a burden.
- **Embedding Slido:** zero build cost; still a valid fallback for Q&A if
  organizers run it, but doesn't solve ratings/sync and breaks the
  one-app experience.
