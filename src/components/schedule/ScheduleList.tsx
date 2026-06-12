import { HeartOff } from "lucide-react"

import { FavoriteButton } from "@/components/FavoriteButton"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { SessionLite } from "@/lib/types"
import { fmtTime } from "@/lib/time"
import { cn } from "@/lib/utils"

interface ScheduleListProps {
  sessions: SessionLite[]
  favorites: string[]
  favoritesOnly: boolean
}

export function ScheduleList({
  sessions,
  favorites,
  favoritesOnly,
}: ScheduleListProps) {
  const visible = favoritesOnly
    ? sessions.filter((s) => favorites.includes(s.slug))
    : sessions

  if (visible.length === 0) {
    return (
      <Empty className="h-full border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HeartOff />
          </EmptyMedia>
          <EmptyTitle>No favorites yet</EmptyTitle>
          <EmptyDescription>
            Tap the heart on a session to build your personal schedule.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const groups = new Map<string, SessionLite[]>()
  for (const session of visible) {
    const key = fmtTime(session.start)
    groups.set(key, [...(groups.get(key) ?? []), session])
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto pb-6">
      {[...groups.entries()].map(([time, group]) => (
        <section key={time} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground tabular-nums">
            {time}
          </h2>
          {group.map((session) => {
            const isBreak = session.kind === "break"
            const ended = new Date(session.end).getTime() < Date.now()
            return (
              <div key={session.slug} className="relative">
                <a
                  href={`/schedule/${session.slug}`}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 no-underline transition-shadow",
                    isBreak
                      ? "border-dashed bg-muted/50"
                      : "bg-card shadow-xs hover:shadow-md",
                    ended && "opacity-60"
                  )}
                >
                  <span className="w-21 shrink-0 pt-0.5 text-xs font-semibold text-primary tabular-nums">
                    {fmtTime(session.start)} – {fmtTime(session.end)}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span
                      className={cn(
                        "text-sm leading-snug font-semibold",
                        isBreak && "text-muted-foreground"
                      )}
                    >
                      {session.title}
                    </span>
                    {session.speakers.length > 0 && (
                      <span className="text-xs text-muted-foreground italic">
                        {session.speakers.join(", ")}
                      </span>
                    )}
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">{session.stage}</Badge>
                      {session.kind === "workshop" && (
                        <Badge variant="secondary">Workshop</Badge>
                      )}
                    </span>
                  </span>
                </a>
                {!isBreak && (
                  <FavoriteButton
                    slug={session.slug}
                    className="absolute top-2 right-2"
                  />
                )}
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
