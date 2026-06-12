import { getCollection } from "astro:content"
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
      speakers: entry.data.speakers.map((s) => ({
        name: s.name,
        image: s.image,
      })),
    }))
    .sort(
      (a, b) => a.start.localeCompare(b.start) || a.stageOrder - b.stageOrder
    )
}

/** Stage names in display order. */
export function stagesOf(sessions: SessionLite[]): string[] {
  return [...new Map(sessions.map((s) => [s.stageOrder, s.stage])).entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, name]) => name)
}
