export interface SpeakerLite {
  name: string
  image: string
}

export interface SessionLite {
  slug: string
  title: string
  /** ISO 8601 with timezone offset */
  start: string
  end: string
  stage: string
  stageOrder: number
  kind: "talk" | "workshop" | "break"
  language?: "de" | "en"
  speakers: SpeakerLite[]
}

export function speakerNames(session: SessionLite): string {
  return session.speakers.map((s) => s.name).join(", ")
}
