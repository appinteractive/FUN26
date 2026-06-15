import { event } from "@/event.config"

/** Free-form venue label for a stage (room/hall/screen/...), or undefined. */
export function venueLabel(stage: string): string | undefined {
  return event.venues[stage]
}
