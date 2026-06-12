import type { SessionLite } from "./types"

/**
 * Favorites travel as a `?fav=` query of short session ids (the hex prefix
 * of each slug), e.g. `https://…/?fav=017e81,213560`. Opening such a link
 * in a browser imports them; the installed PWA has no address bar, so the
 * same link can be pasted into the import field instead.
 */

/** Short unique id of a session: the hex prefix of its slug. */
function idOf(slug: string): string {
  return slug.split("-")[0]
}

/** Absolute link that imports the given favorites when opened or pasted. */
export function buildShareLink(favorites: string[]): string {
  const url = new URL("/", window.location.origin)
  // Assign raw — searchParams.set would percent-encode the commas.
  url.search = `?fav=${favorites.map(idOf).join(",")}`
  return url.toString()
}

/** Resolve a `fav` parameter value to known session slugs. */
export function decodeFavParam(raw: string, sessions: SessionLite[]): string[] {
  const ids = new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  )
  return sessions
    .filter((s) => ids.has(idOf(s.slug)) || ids.has(s.slug))
    .map((s) => s.slug)
}

/** Extract favorites from pasted text: a share link, a query string, or a bare id list. */
export function parseShareLink(
  text: string,
  sessions: SessionLite[]
): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  let raw: string | null
  try {
    raw = new URL(trimmed).searchParams.get("fav")
  } catch {
    // Not a full URL — accept a "fav=…" fragment or a bare id list.
    raw = /fav=([^&\s]*)/.exec(trimmed)?.[1] ?? trimmed
  }
  if (!raw) return []
  try {
    raw = decodeURIComponent(raw)
  } catch {
    // Malformed percent-encoding — match the ids as pasted.
  }
  return decodeFavParam(raw, sessions)
}
