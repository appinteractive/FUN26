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
