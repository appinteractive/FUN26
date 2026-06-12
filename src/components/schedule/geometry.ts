import type { SessionLite } from "@/lib/types"
import { ceilToHalfHour, floorToHour, minutesBetween } from "@/lib/time"

export const PX_PER_MIN = 3
export const HEADER_PX = 52

export interface GridGeometry {
  dayStart: Date
  dayEnd: Date
  totalMinutes: number
  bodyPx: number
  hourMarks: Date[]
}

export function computeGeometry(sessions: SessionLite[]): GridGeometry {
  const starts = sessions.map((s) => new Date(s.start).getTime())
  const ends = sessions.map((s) => new Date(s.end).getTime())
  const dayStart = floorToHour(new Date(Math.min(...starts)))
  const dayEnd = ceilToHalfHour(new Date(Math.max(...ends)))
  const totalMinutes = minutesBetween(dayStart, dayEnd)

  const hourMarks: Date[] = []
  for (let t = dayStart.getTime(); t <= dayEnd.getTime(); t += 3_600_000) {
    hourMarks.push(new Date(t))
  }
  return {
    dayStart,
    dayEnd,
    totalMinutes,
    bodyPx: totalMinutes * PX_PER_MIN,
    hourMarks,
  }
}

export function offsetPx(geometry: GridGeometry, iso: string | Date): number {
  return minutesBetween(geometry.dayStart, iso) * PX_PER_MIN
}
