/** Stage locations from the printed FUN26 conference map. */
export interface StageVenue {
  kino: number
  level: "Upper Level" | "Ground Level"
}

export const STAGE_VENUES: Record<string, StageVenue> = {
  "exali Main Stage": { kino: 10, level: "Upper Level" },
  "Grow & Sell": { kino: 7, level: "Upper Level" },
  "Beyond the hustle": { kino: 9, level: "Upper Level" },
  "freelancermap Stage": { kino: 4, level: "Ground Level" },
  "Workshop Room": { kino: 2, level: "Ground Level" },
}

export function venueOf(stage: string): StageVenue | undefined {
  return STAGE_VENUES[stage]
}

export function venueLabel(stage: string): string | undefined {
  const venue = venueOf(stage)
  return venue && `Kino ${venue.kino} · ${venue.level}`
}
