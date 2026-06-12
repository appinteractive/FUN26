const BERLIN = "Europe/Berlin"

export function fmtTime(iso: string | Date): string {
  return new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BERLIN,
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
