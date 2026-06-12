import { useStore } from "@nanostores/react"
import { useEffect } from "react"

import { syncReminders } from "@/lib/notifications"
import { $favorites, $reminderSettings } from "@/lib/stores"
import type { SessionLite } from "@/lib/types"

/**
 * Invisible island mounted on every page. Keeps reminder timers in sync with
 * favorites and settings, and resyncs when the app returns to the foreground.
 */
export function ReminderManager({ sessions }: { sessions: SessionLite[] }) {
  const favorites = useStore($favorites)
  const settings = useStore($reminderSettings)

  useEffect(() => {
    const sync = () => syncReminders(sessions, favorites, settings)
    sync()
    document.addEventListener("visibilitychange", sync)
    return () => document.removeEventListener("visibilitychange", sync)
  }, [sessions, favorites, settings])

  return null
}
