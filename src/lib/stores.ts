import { persistentAtom } from "@nanostores/persistent"

function jsonCodec<T>(fallback: T) {
  return {
    encode: JSON.stringify,
    decode: (value: string): T => {
      try {
        return JSON.parse(value) as T
      } catch {
        return fallback
      }
    },
  }
}

/** Slugs of favorited sessions. Synced across tabs and islands. */
export const $favorites = persistentAtom<string[]>(
  "fun26.favorites",
  [],
  jsonCodec<string[]>([])
)

export function toggleFavorite(slug: string) {
  const current = $favorites.get()
  $favorites.set(
    current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug]
  )
}

export function addFavorites(slugs: string[]) {
  const current = $favorites.get()
  $favorites.set([...current, ...slugs.filter((s) => !current.includes(s))])
}

export function replaceFavorites(slugs: string[]) {
  $favorites.set([...slugs])
}

export interface ReminderSettings {
  enabled: boolean
  leadMinutes: number
}

export const $reminderSettings = persistentAtom<ReminderSettings>(
  "fun26.reminderSettings",
  { enabled: false, leadMinutes: 10 },
  jsonCodec<ReminderSettings>({ enabled: false, leadMinutes: 10 })
)

export type ScheduleView = "grid" | "list"

export const $scheduleView = persistentAtom<ScheduleView>(
  "fun26.scheduleView",
  "grid"
)

export const $favoritesOnly = persistentAtom<boolean>(
  "fun26.favoritesOnly",
  false,
  jsonCodec<boolean>(false)
)

/** Selected schedule day (day key like "2026-06-11"); empty = auto. */
export const $scheduleDay = persistentAtom<string>("fun26.scheduleDay", "")

/** Personal notes per session, keyed by session slug. Stored only on device. */
export const $notes = persistentAtom<Record<string, string>>(
  "fun26.notes",
  {},
  jsonCodec<Record<string, string>>({})
)

export function setNote(slug: string, text: string) {
  const current = $notes.get()
  if (text.trim() === "") {
    if (!(slug in current)) return
    const next = { ...current }
    delete next[slug]
    $notes.set(next)
  } else {
    $notes.set({ ...current, [slug]: text })
  }
}
