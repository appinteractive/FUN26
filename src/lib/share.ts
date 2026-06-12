import type { SessionLite } from "./types"

/**
 * Favorites travel between devices as a URL fragment of short slug
 * prefixes (every session slug starts with a unique 6-char hash), e.g.
 * https://fun-26.vercel.app/#import=e407ae,8cdb34 — compact enough for
 * an easily scannable QR code, and nothing ever touches a server.
 */
const PREFIX_LENGTH = 6
const HASH_PARAM = "import"

export function buildShareUrl(favorites: string[]): string {
  const prefixes = favorites.map((slug) => slug.slice(0, PREFIX_LENGTH))
  return `${location.origin}/#${HASH_PARAM}=${prefixes.join(",")}`
}

/** Slugs encoded in the current URL fragment, resolved against known sessions. */
export function parseImportHash(
  hash: string,
  sessions: SessionLite[]
): string[] | null {
  const match = hash.match(new RegExp(`#${HASH_PARAM}=([\\w,-]+)`))
  if (!match) return null
  const prefixes = match[1].split(",").filter(Boolean)
  const resolved = sessions
    .filter((s) => prefixes.includes(s.slug.slice(0, PREFIX_LENGTH)))
    .map((s) => s.slug)
  return resolved.length > 0 ? resolved : null
}

export function clearImportHash() {
  history.replaceState(null, "", location.pathname + location.search)
}
