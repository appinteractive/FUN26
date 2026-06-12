import type { SessionLite } from "./types"

function icsUtc(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")
}

function escape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

export function buildIcs(sessions: SessionLite[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FUN26//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]
  for (const s of sessions) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.slug}@fun26`,
      `DTSTAMP:${icsUtc(s.start)}`,
      `DTSTART:${icsUtc(s.start)}`,
      `DTEND:${icsUtc(s.end)}`,
      `SUMMARY:${escape(s.title)}`,
      `LOCATION:${escape(s.stage)}`,
      s.speakers.length
        ? `DESCRIPTION:${escape(
            `Speaker: ${s.speakers.map((sp) => sp.name).join(", ")}`
          )}`
        : "DESCRIPTION:",
      "END:VEVENT"
    )
  }
  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

export function downloadIcs(sessions: SessionLite[]) {
  const blob = new Blob([buildIcs(sessions)], {
    type: "text/calendar;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "fun26-favorites.ics"
  a.click()
  URL.revokeObjectURL(url)
}
