import { useSyncExternalStore } from "react"

const TICK_MS = 30_000

let current: Date | null = null
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  if (timer === undefined) {
    current = new Date()
    timer = setInterval(() => {
      current = new Date()
      for (const l of listeners) l()
    }, TICK_MS)
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

/**
 * Current time, refreshed every 30s. Returns null on the server and during
 * hydration's first render so time-dependent UI (now line, live and past
 * states) never mismatches the prerendered HTML.
 */
export function useNow(): Date | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null
  )
}

export type SessionState = "past" | "live" | "upcoming"

export function sessionState(
  start: string,
  end: string,
  now: Date | null
): SessionState | null {
  if (!now) return null
  const t = now.getTime()
  if (t >= new Date(end).getTime()) return "past"
  if (t >= new Date(start).getTime()) return "live"
  return "upcoming"
}
