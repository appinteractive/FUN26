import { useEffect, useRef } from "react"
import { NotebookPen } from "lucide-react"

import { FavoriteButton } from "@/components/FavoriteButton"
import { Badge } from "@/components/ui/badge"
import { sessionState, useNow, type SessionState } from "@/hooks/use-now"
import { speakerNames, type SessionLite } from "@/lib/types"
import { fmtTime, minutesBetween } from "@/lib/time"
import { cn } from "@/lib/utils"
import { venueLabel } from "@/lib/venue"

import { computeGeometry, HEADER_PX, offsetPx, PX_PER_MIN } from "./geometry"

const SCROLL_KEY = "fun26.scroll.grid"

interface ScheduleGridProps {
  sessions: SessionLite[]
  stages: string[]
  favorites: string[]
  favoritesOnly: boolean
  notedSlugs: string[]
}

function SessionBlock({
  session,
  top,
  height,
  dimmed,
  state,
  hasNote,
}: {
  session: SessionLite
  top: number
  height: number
  dimmed: boolean
  state: SessionState | null
  hasNote: boolean
}) {
  const duration = minutesBetween(session.start, session.end)
  const isBreak = session.kind === "break"

  return (
    <div
      className={cn(
        "absolute inset-x-1 transition-opacity",
        state === "past" && "opacity-45",
        dimmed && "opacity-25"
      )}
      style={{ top: top + 2, height: height - 4 }}
    >
      <a
        href={`/schedule/${session.slug}`}
        className={cn(
          "flex h-full flex-col gap-0.5 overflow-hidden rounded-lg border p-2 no-underline",
          isBreak
            ? "items-center justify-center border-dashed bg-muted/50 text-muted-foreground"
            : "bg-card transition-colors hover:border-primary/60",
          state === "live" && !isBreak && "border-primary bg-primary/5"
        )}
      >
        {isBreak ? (
          <span className="text-center text-xs font-medium">
            {session.title}
          </span>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              {fmtTime(session.start)}
              {state === "live" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-1.5 text-[0.6rem] font-bold tracking-wide text-primary-foreground uppercase">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />
                  Now
                </span>
              )}
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
                {speakerNames(session)}
                {hasNote && (
                  <NotebookPen className="ml-1 inline size-3 align-[-0.1em]" />
                )}
              </span>
            )}
          </>
        )}
      </a>
      {!isBreak && (
        <FavoriteButton
          slug={session.slug}
          size="icon-xs"
          className="absolute top-1 right-1 bg-card/80"
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
  notedSlugs,
}: ScheduleGridProps) {
  const geometry = computeGeometry(sessions)
  const now = useNow()
  const scrollRef = useRef<HTMLDivElement>(null)

  const nowMinutes = now ? minutesBetween(geometry.dayStart, now) : null
  const nowVisible =
    nowMinutes !== null &&
    nowMinutes >= 0 &&
    nowMinutes <= geometry.totalMinutes
  const nowTop =
    nowMinutes !== null ? HEADER_PX + nowMinutes * PX_PER_MIN : null

  // Restore the last scroll position (e.g. when navigating back from a
  // session); fall back to jumping to "now" on a fresh visit.
  const restoredScroll = useRef(false)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    try {
      const saved = sessionStorage.getItem(SCROLL_KEY)
      if (saved) {
        const { l, t } = JSON.parse(saved) as { l: number; t: number }
        el.scrollLeft = l
        el.scrollTop = t
        restoredScroll.current = true
      }
    } catch {
      // sessionStorage unavailable — keep default position
    }
  }, [])

  const scrolledToNow = useRef(false)
  useEffect(() => {
    if (
      !restoredScroll.current &&
      !scrolledToNow.current &&
      nowVisible &&
      nowTop !== null
    ) {
      scrolledToNow.current = true
      scrollRef.current?.scrollTo({ top: Math.max(0, nowTop - 140) })
    }
  }, [nowVisible, nowTop])

  const savePending = useRef(false)
  function handleScroll() {
    if (savePending.current) return
    savePending.current = true
    requestAnimationFrame(() => {
      savePending.current = false
      const el = scrollRef.current
      if (!el) return
      try {
        sessionStorage.setItem(
          SCROLL_KEY,
          JSON.stringify({ l: el.scrollLeft, t: el.scrollTop })
        )
      } catch {
        // ignore
      }
    })
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="relative h-full overflow-auto overscroll-contain border-y bg-background sm:rounded-xl sm:border"
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
              className="sticky top-0 z-20 flex flex-col items-center justify-center gap-0.5 border-b bg-background px-2"
              style={{ height: HEADER_PX }}
            >
              <span className="max-w-full truncate text-xs font-semibold tracking-wide uppercase">
                {stage}
              </span>
              {venueLabel(stage) && (
                <span className="max-w-full truncate text-[0.65rem] text-muted-foreground">
                  {venueLabel(stage)}
                </span>
              )}
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
                    state={sessionState(session.start, session.end, now)}
                    hasNote={notedSlugs.includes(session.slug)}
                  />
                ))}
            </div>
          ))}
        </div>

        {nowVisible && now && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 z-20"
            style={{ top: nowTop ?? 0 }}
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
