import type { SessionLite } from "./types"

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

export async function ensurePermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === "granted") return true
  if (Notification.permission === "denied") return false
  return (await Notification.requestPermission()) === "granted"
}

const timeouts = new Map<string, ReturnType<typeof setTimeout>>()
const FIRED_KEY = "fun26.firedReminders"

function firedSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FIRED_KEY) ?? "[]"))
  } catch {
    return new Set()
  }
}

function markFired(id: string) {
  const fired = firedSet()
  fired.add(id)
  localStorage.setItem(FIRED_KEY, JSON.stringify([...fired]))
}

async function show(session: SessionLite, leadMinutes: number) {
  const title = `Starts in ${leadMinutes} min: ${session.title}`
  const options: NotificationOptions = {
    body: `${formatTime(session.start)} · ${session.stage}`,
    tag: `fun26-${session.slug}`,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: `/schedule/${session.slug}` },
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, options)
      return
    }
  } catch {
    // fall through to page notification
  }
  new Notification(title, options)
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  })
}

/**
 * (Re)schedule reminder timers for the given sessions.
 * Timers only fire while the app is open — this is a hard platform limit for
 * web apps without a push server. We resync on visibility changes so an
 * installed PWA brought back to the foreground catches up.
 */
export function syncReminders(
  sessions: SessionLite[],
  favorites: string[],
  settings: { enabled: boolean; leadMinutes: number }
) {
  for (const t of timeouts.values()) clearTimeout(t)
  timeouts.clear()

  if (!settings.enabled || !notificationsSupported()) return
  if (Notification.permission !== "granted") return

  const now = Date.now()
  const fired = firedSet()
  for (const session of sessions) {
    if (!favorites.includes(session.slug)) continue
    const fireAt =
      new Date(session.start).getTime() - settings.leadMinutes * 60_000
    const id = `${session.slug}@${settings.leadMinutes}`
    if (fired.has(id)) continue
    const delay = fireAt - now
    // Skip reminders more than a minute in the past; fire slightly-late ones.
    if (delay < -60_000) continue
    timeouts.set(
      session.slug,
      setTimeout(
        () => {
          markFired(id)
          void show(session, settings.leadMinutes)
        },
        Math.max(0, delay)
      )
    )
  }
}
