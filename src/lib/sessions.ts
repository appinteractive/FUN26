import { getCollection } from "astro:content"
import { dayKey, fmtDay } from "./time"
import type { SessionLite } from "./types"

/** Load all sessions as plain serializable objects, sorted by start time. */
export async function getSessionsLite(): Promise<SessionLite[]> {
  const entries = await getCollection("sessions")
  return entries
    .map((entry) => ({
      slug: entry.id,
      title: entry.data.title,
      start: entry.data.start.toISOString(),
      end: entry.data.end.toISOString(),
      stage: entry.data.stage,
      stageOrder: entry.data.stageOrder,
      kind: entry.data.kind,
      language: entry.data.language,
      speakers: entry.data.speakers.map((s) => ({
        name: s.name,
        image: s.image,
      })),
    }))
    .sort(
      (a, b) => a.start.localeCompare(b.start) || a.stageOrder - b.stageOrder
    )
}

/** Header label spanning all event days, e.g. "June 11–12, 2026". */
export function dayRangeLabel(sessions: SessionLite[]): string {
  const days = [...new Set(sessions.map((s) => dayKey(s.start)))].sort()
  const year = days[0]?.slice(0, 4) ?? ""
  if (days.length <= 1) {
    return days[0] ? `${fmtDay(days[0]).replace(/^\w+, /, "")}, ${year}` : ""
  }
  const first = days[0].slice(8).replace(/^0/, "")
  const last = days[days.length - 1].slice(8).replace(/^0/, "")
  const month = fmtDay(days[0])
    .replace(/^\w+, /, "")
    .split(" ")[0]
  return `${month} ${first}–${last}, ${year}`
}

/** Stage names in display order. */
export function stagesOf(sessions: SessionLite[]): string[] {
  return [...new Map(sessions.map((s) => [s.stageOrder, s.stage])).entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, name]) => name)
}
