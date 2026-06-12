export interface SessionLite {
  slug: string
  title: string
  /** ISO 8601 with timezone offset */
  start: string
  end: string
  stage: string
  stageOrder: number
  kind: "talk" | "workshop" | "break"
  speakers: string[]
}

export const DAY_LABEL = "June 12, 2026"
