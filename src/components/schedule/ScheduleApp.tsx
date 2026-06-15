import { useStore } from "@nanostores/react"
import { useState } from "react"
import Fuse from "fuse.js"
import { Heart, LayoutGrid, List, Search } from "lucide-react"

import { NotificationSettings } from "@/components/NotificationSettings"
import { ShareSchedule } from "@/components/ShareSchedule"
import { useMounted } from "@/hooks/use-mounted"
import { useNow } from "@/hooks/use-now"
import { fmtTime } from "@/lib/time"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  $favorites,
  $favoritesOnly,
  $notes,
  $scheduleDay,
  $scheduleView,
  type ScheduleView,
} from "@/lib/stores"
import { dayKey, fmtDay } from "@/lib/time"
import type { SessionLite } from "@/lib/types"
import { cn } from "@/lib/utils"

import { ScheduleGrid } from "./ScheduleGrid"
import { ScheduleList } from "./ScheduleList"

interface ScheduleAppProps {
  sessions: SessionLite[]
}

function stagesOf(sessions: SessionLite[]): string[] {
  return [...new Map(sessions.map((s) => [s.stageOrder, s.stage])).entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, name]) => name)
}

export function ScheduleApp({ sessions }: ScheduleAppProps) {
  const mounted = useMounted()
  const now = useNow()
  const [query, setQuery] = useState("")
  const [language, setLanguage] = useState<"all" | "de" | "en">("all")
  const storedView = useStore($scheduleView)
  const storedFavoritesOnly = useStore($favoritesOnly)
  const storedFavorites = useStore($favorites)
  const storedNotes = useStore($notes)
  const storedDay = useStore($scheduleDay)
  // Render with defaults until mounted so SSR markup matches hydration.
  const view = mounted ? storedView : "grid"
  const favoritesOnly = mounted ? storedFavoritesOnly : false
  const favorites = mounted ? storedFavorites : []
  const notedSlugs = mounted ? Object.keys(storedNotes) : []

  const days = [...new Set(sessions.map((s) => dayKey(s.start)))].sort()
  // Stored day if valid, else today (during the event), else the first day.
  const fallbackDay = days.includes(dayKey(new Date()))
    ? dayKey(new Date())
    : days[0]
  const day =
    mounted && storedDay && days.includes(storedDay) ? storedDay : fallbackDay

  const daySessions = sessions.filter((s) => dayKey(s.start) === day)
  const stages = stagesOf(daySessions)
  const q = query.trim()
  const filtersActive = q !== "" || language !== "all"

  // Fuzzy index over the current day's sessions. Weights title above speaker
  // names. React Compiler memoizes this across renders.
  const fuse = new Fuse(daySessions, {
    keys: [
      { name: "title", weight: 2 },
      { name: "speakers.name", weight: 1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
  })

  function passesNonQueryFilters(s: SessionLite): boolean {
    if (filtersActive && s.kind === "break") return false
    if (language !== "all" && s.language !== language) return false
    return true
  }

  const matchedSlugs = new Set(
    (q === ""
      ? daySessions
      : fuse.search(q).map((result) => result.item)
    )
      .filter(passesNonQueryFilters)
      .map((s) => s.slug)
  )

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-30 -mx-3 bg-background px-3 py-2 sm:-mx-4 sm:px-4">
        <div className="flex items-center gap-2">
          <Tabs
            value={view}
            onValueChange={(value) => {
              $scheduleView.set(value as ScheduleView)
              // Each view restores its own remembered position from here.
              window.scrollTo(0, 0)
            }}
          >
            <TabsList>
              <TabsTrigger value="grid">
                <LayoutGrid /> Grid
              </TabsTrigger>
              <TabsTrigger value="list">
                <List /> List
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            aria-pressed={favoritesOnly}
            onClick={() => $favoritesOnly.set(!favoritesOnly)}
            className={cn(favoritesOnly && "border-primary text-primary")}
          >
            <Heart
              data-icon="inline-start"
              className={cn(favoritesOnly && "fill-primary stroke-primary")}
            />
            <span className="hidden sm:inline">My schedule</span>
            <Badge
              variant={favoritesOnly ? "default" : "secondary"}
              className="tabular-nums"
            >
              {favorites.length}
            </Badge>
          </Button>

          <div className="ml-auto flex items-center gap-2">
            {now && (
              <span
                aria-label="Current time"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold tabular-nums"
              >
                <span className="size-1.5 rounded-full bg-primary" />
                {fmtTime(now)}
              </span>
            )}
            <ShareSchedule sessions={sessions} favorites={favorites} />
            <NotificationSettings sessions={sessions} />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search talks or speakers..."
              aria-label="Search sessions"
              className="pl-8"
            />
          </div>
          <ToggleGroup
            value={[language]}
            onValueChange={(value: unknown[]) => {
              const pick = String(value[0] ?? "all")
              setLanguage(pick === "de" || pick === "en" ? pick : "all")
            }}
            variant="outline"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="de">DE</ToggleGroupItem>
            <ToggleGroupItem value="en">EN</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {days.length > 1 && (
          <Tabs
            value={day}
            onValueChange={(value) => {
              $scheduleDay.set(value)
              window.scrollTo(0, 0)
            }}
            className="mt-2"
          >
            <TabsList className="w-full">
              {days.map((d) => (
                <TabsTrigger key={d} value={d} className="flex-1">
                  {fmtDay(d)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      {view === "grid" ? (
        <div className="-mx-3 mt-1 h-[calc(100dvh-4rem)] min-h-96 sm:mx-0">
          <ScheduleGrid
            sessions={daySessions}
            stages={stages}
            favorites={favorites}
            favoritesOnly={favoritesOnly}
            notedSlugs={notedSlugs}
            matchedSlugs={matchedSlugs}
            filtersActive={filtersActive}
          />
        </div>
      ) : (
        <div className="mt-1">
          <ScheduleList
            sessions={daySessions}
            favorites={favorites}
            favoritesOnly={favoritesOnly}
            notedSlugs={notedSlugs}
            matchedSlugs={matchedSlugs}
            filtersActive={filtersActive}
          />
        </div>
      )}
    </div>
  )
}
