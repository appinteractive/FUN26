import { useEffect, useRef, useState } from "react"

import { FavoriteButton } from "@/components/FavoriteButton"
import { Badge } from "@/components/ui/badge"
import type { SessionLite } from "@/lib/types"
import { fmtTime, minutesBetween } from "@/lib/time"
import { cn } from "@/lib/utils"

import { computeGeometry, HEADER_PX, offsetPx, PX_PER_MIN } from "./geometry"

interface ScheduleGridProps {
  sessions: SessionLite[]
  stages: string[]
  favorites: string[]
  favoritesOnly: boolean
}

function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function SessionBlock({
  session,
  top,
  height,
  dimmed,
}: {
  session: SessionLite
  top: number
  height: number
  dimmed: boolean
}) {
  const duration = minutesBetween(session.start, session.end)
  const isBreak = session.kind === "break"

  return (
    <div
      className={cn(
        "absolute inset-x-1 transition-opacity",
        dimmed && "opacity-30"
      )}
      style={{ top: top + 2, height: height - 4 }}
    >
      <a
        href={`/schedule/${session.slug}`}
        className={cn(
          "flex h-full flex-col gap-0.5 overflow-hidden rounded-lg border p-2 no-underline",
          isBreak
            ? "items-center justify-center border-dashed bg-muted/50 text-muted-foreground"
            : "bg-card shadow-xs transition-shadow hover:shadow-md"
        )}
      >
        {isBreak ? (
          <span className="text-center text-xs font-medium">
            {session.title}
          </span>
        ) : (
          <>
            <div className="flex items-center gap-1 text-xs font-semibold text-primary">
              {fmtTime(session.start)}
              {session.kind === "workshop" && (
                <Badge variant="secondary" className="mr-6 ml-auto">
                  Workshop
                </Badge>
              )}
            </div>
            <span
              className={cn(
                "text-sm leading-tight font-semibold text-balance",
                duration >= 40 ? "line-clamp-3" : "line-clamp-2"
              )}
            >
              {session.title}
            </span>
            {duration >= 35 && session.speakers.length > 0 && (
              <span className="line-clamp-1 text-xs text-muted-foreground italic">
                {session.speakers.join(", ")}
              </span>
            )}
          </>
        )}
      </a>
      {!isBreak && (
        <FavoriteButton
          slug={session.slug}
          size="icon-xs"
          className="absolute top-1 right-1"
        />
      )}
    </div>
  )
}

export function ScheduleGrid({
  sessions,
  stages,
  favorites,
  favoritesOnly,
}: ScheduleGridProps) {
  const geometry = computeGeometry(sessions)
  const now = useNow()
  const scrollRef = useRef<HTMLDivElement>(null)

  const nowMinutes = minutesBetween(geometry.dayStart, now)
  const nowVisible = nowMinutes >= 0 && nowMinutes <= geometry.totalMinutes
  const nowTop = HEADER_PX + nowMinutes * PX_PER_MIN

  useEffect(() => {
    if (nowVisible && scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, nowTop - 140)
    }
    // Only on mount: jump to "now" once, then leave scrolling to the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={scrollRef}
      className="relative h-full overflow-auto overscroll-contain rounded-xl border bg-background"
    >
      <div className="relative w-max min-w-full">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `3rem repeat(${stages.length}, minmax(11rem, 1fr))`,
          }}
        >
          {/* corner cell */}
          <div
            className="sticky top-0 left-0 z-30 border-r border-b bg-background"
            style={{ height: HEADER_PX }}
          />
          {stages.map((stage) => (
            <div
              key={stage}
              className="sticky top-0 z-20 flex items-center justify-center border-b bg-background px-2 text-xs font-semibold tracking-wide uppercase"
              style={{ height: HEADER_PX }}
            >
              <span className="truncate">{stage}</span>
            </div>
          ))}

          {/* time gutter */}
          <div
            className="sticky left-0 z-10 border-r bg-background"
            style={{ height: geometry.bodyPx }}
          >
            {geometry.hourMarks.map((mark) => (
              <span
                key={mark.toISOString()}
                className="absolute right-1.5 -translate-y-1/2 text-[0.65rem] font-medium text-muted-foreground tabular-nums"
                style={{ top: offsetPx(geometry, mark) || 8 }}
              >
                {fmtTime(mark)}
              </span>
            ))}
          </div>

          {/* stage columns */}
          {stages.map((stage) => (
            <div
              key={stage}
              className="relative border-r last:border-r-0"
              style={{ height: geometry.bodyPx }}
            >
              {geometry.hourMarks.map((mark) => {
                const top = offsetPx(geometry, mark)
                if (top <= 0 || top >= geometry.bodyPx) return null
                return (
                  <div
                    key={mark.toISOString()}
                    aria-hidden
                    className="absolute inset-x-0 border-t border-border/60"
                    style={{ top }}
                  />
                )
              })}
              {sessions
                .filter((s) => s.stage === stage)
                .map((session) => (
                  <SessionBlock
                    key={session.slug}
                    session={session}
                    top={offsetPx(geometry, session.start)}
                    height={
                      minutesBetween(session.start, session.end) * PX_PER_MIN
                    }
                    dimmed={favoritesOnly && !favorites.includes(session.slug)}
                  />
                ))}
            </div>
          ))}
        </div>

        {nowVisible && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 z-20"
            style={{ top: nowTop }}
          >
            <div className="border-t-2 border-red-500/80" />
            <span className="absolute -top-2 left-[3.25rem] rounded bg-red-500 px-1 text-[0.6rem] font-semibold text-white tabular-nums">
              {fmtTime(now)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
