import { Clock, HeartOff, MapPin } from "lucide-react"
import { useEffect } from "react"

import { FavoriteButton } from "@/components/FavoriteButton"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { sessionState, useNow, type SessionState } from "@/hooks/use-now"
import { speakerNames, type SessionLite } from "@/lib/types"
import { fmtTime } from "@/lib/time"
import { cn } from "@/lib/utils"
import { venueLabel } from "@/lib/venue"

const SCROLL_KEY = "fun26.scroll.list"

interface ScheduleListProps {
  sessions: SessionLite[]
  favorites: string[]
  favoritesOnly: boolean
}

/** Restore the page scroll position once, then keep saving it. */
function useListScrollMemory() {
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SCROLL_KEY)
      if (saved) window.scrollTo(0, Number(saved))
    } catch {
      // sessionStorage unavailable — start at the top
    }
    let pending = false
    const onScroll = () => {
      if (pending) return
      pending = true
      requestAnimationFrame(() => {
        pending = false
        try {
          sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
        } catch {
          // ignore
        }
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
}

function NowBadge() {
  return (
    <Badge className="gap-1">
      <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />
      Now
    </Badge>
  )
}

function BreakRow({
  session,
  state,
}: {
  session: SessionLite
  state: SessionState | null
}) {
  return (
    <a
      href={`/schedule/${session.slug}`}
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground no-underline",
        state === "live" && "border-primary/50 text-foreground",
        state === "past" && "opacity-50"
      )}
    >
      <span className="font-medium">{session.title}</span>
      <span className="tabular-nums">
        {fmtTime(session.start)} – {fmtTime(session.end)}
      </span>
      <span>· {session.stage}</span>
    </a>
  )
}

function SessionCard({
  session,
  state,
}: {
  session: SessionLite
  state: SessionState | null
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-1 rounded-xl border bg-card p-3 transition-colors hover:border-primary/60",
        state === "live" && "border-primary bg-primary/5",
        state === "past" && "opacity-50"
      )}
    >
      <a
        href={`/schedule/${session.slug}`}
        className="flex min-w-0 flex-1 flex-col gap-1 no-underline"
      >
        <span className="text-[0.95rem] leading-snug font-semibold text-balance">
          {session.title}
        </span>
        {session.speakers.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="flex shrink-0 -space-x-1.5">
              {session.speakers.map((speaker) => (
                <img
                  key={speaker.name}
                  src={speaker.image}
                  alt=""
                  loading="lazy"
                  className="size-5 rounded-full border border-background object-cover"
                />
              ))}
            </span>
            <span className="truncate text-xs text-muted-foreground italic">
              {speakerNames(session)}
            </span>
          </span>
        )}
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {state === "live" && <NowBadge />}
          <span className="inline-flex items-center gap-1 font-medium tabular-nums">
            <Clock className="size-3.5 text-muted-foreground" />
            {fmtTime(session.start)} – {fmtTime(session.end)}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3.5" />
            {session.stage}
            {venueLabel(session.stage) && ` · ${venueLabel(session.stage)}`}
          </span>
          {session.kind === "workshop" && (
            <Badge variant="secondary">Workshop</Badge>
          )}
        </span>
      </a>
      <FavoriteButton slug={session.slug} className="-mt-1 -mr-1 shrink-0" />
    </div>
  )
}

export function ScheduleList({
  sessions,
  favorites,
  favoritesOnly,
}: ScheduleListProps) {
  const now = useNow()
  useListScrollMemory()
  const visible = favoritesOnly
    ? sessions.filter((s) => favorites.includes(s.slug))
    : sessions

  if (visible.length === 0) {
    return (
      <Empty className="border border-dashed">
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

  // Group by full hour: enough structure to scan, without a header per minute.
  const groups = new Map<string, SessionLite[]>()
  for (const session of visible) {
    const key = `${fmtTime(session.start).slice(0, 2)}:00`
    groups.set(key, [...(groups.get(key) ?? []), session])
  }

  return (
    <div className="flex flex-col gap-1 pb-8">
      {[...groups.entries()].map(([hour, group]) => (
        <section key={hour}>
          <h2 className="sticky top-12 z-10 bg-background py-1.5 text-sm font-semibold text-muted-foreground tabular-nums">
            {hour}
          </h2>
          <div className="flex flex-col gap-2 pb-3">
            {group.map((session) => {
              const state = sessionState(session.start, session.end, now)
              return session.kind === "break" ? (
                <BreakRow key={session.slug} session={session} state={state} />
              ) : (
                <SessionCard
                  key={session.slug}
                  session={session}
                  state={state}
                />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
