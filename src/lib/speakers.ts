import { getCollection } from "astro:content"
import type { CollectionEntry } from "astro:content"

export type SpeakerEntry = CollectionEntry<"speakers">

/** Load all speaker profiles, sorted by name. */
export async function getSpeakerEntries(): Promise<SpeakerEntry[]> {
  const entries = await getCollection("speakers")
  return entries.sort((a, b) => a.data.name.localeCompare(b.data.name))
}

/** Map speaker name → profile entry, for linking from sessions. */
export async function getSpeakersByName(): Promise<Map<string, SpeakerEntry>> {
  const entries = await getSpeakerEntries()
  return new Map(entries.map((entry) => [entry.data.name, entry]))
}

/** All sessions a speaker appears in, sorted by start time. */
export function sessionsOfSpeaker<
  T extends { data: { speakers: { name: string }[]; start: Date } },
>(name: string, sessions: T[]): T[] {
  return sessions
    .filter((session) => session.data.speakers.some((s) => s.name === name))
    .sort((a, b) => a.data.start.getTime() - b.data.start.getTime())
}
