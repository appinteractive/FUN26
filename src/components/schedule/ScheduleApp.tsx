import { useStore } from "@nanostores/react"
import { Heart, LayoutGrid, List } from "lucide-react"

import { NotificationSettings } from "@/components/NotificationSettings"
import { useMounted } from "@/hooks/use-mounted"
import { useNow } from "@/hooks/use-now"
import { fmtTime } from "@/lib/time"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  $favorites,
  $favoritesOnly,
  $scheduleView,
  type ScheduleView,
} from "@/lib/stores"
import type { SessionLite } from "@/lib/types"
import { cn } from "@/lib/utils"

import { ScheduleGrid } from "./ScheduleGrid"
import { ScheduleList } from "./ScheduleList"

interface ScheduleAppProps {
  sessions: SessionLite[]
  stages: string[]
}

export function ScheduleApp({ sessions, stages }: ScheduleAppProps) {
  const mounted = useMounted()
  const now = useNow()
  const storedView = useStore($scheduleView)
  const storedFavoritesOnly = useStore($favoritesOnly)
  const storedFavorites = useStore($favorites)
  // Render with defaults until mounted so SSR markup matches hydration.
  const view = mounted ? storedView : "grid"
  const favoritesOnly = mounted ? storedFavoritesOnly : false
  const favorites = mounted ? storedFavorites : []

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
            <NotificationSettings sessions={sessions} />
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="-mx-3 mt-1 h-[calc(100dvh-4rem)] min-h-96 sm:mx-0">
          <ScheduleGrid
            sessions={sessions}
            stages={stages}
            favorites={favorites}
            favoritesOnly={favoritesOnly}
          />
        </div>
      ) : (
        <div className="mt-1">
          <ScheduleList
            sessions={sessions}
            favorites={favorites}
            favoritesOnly={favoritesOnly}
          />
        </div>
      )}
    </div>
  )
}
