import { event } from "@/event.config"

const TZ = event.timeZone

export function fmtTime(iso: string | Date): string {
  return new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  })
}

/** Calendar day in the event's timezone, e.g. "2026-06-11". */
export function dayKey(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ })
}

/** Short weekday + date label for a day key, e.g. "Thu, June 11". */
export function fmtDay(key: string): string {
  return new Date(`${key}T12:00:00+02:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    timeZone: TZ,
  })
}

export function minutesBetween(a: string | Date, b: string | Date): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60_000)
}

export function floorToHour(d: Date): Date {
  const out = new Date(d)
  out.setUTCMinutes(0, 0, 0)
  return out
}

export function ceilToHalfHour(d: Date): Date {
  const out = new Date(d)
  const ms = 30 * 60_000
  return new Date(Math.ceil(out.getTime() / ms) * ms)
}
