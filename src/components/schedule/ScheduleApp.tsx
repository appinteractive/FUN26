import { useStore } from "@nanostores/react"
import { Heart, LayoutGrid, List } from "lucide-react"

import { NotificationSettings } from "@/components/NotificationSettings"
import { useMounted } from "@/hooks/use-mounted"
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
  const storedView = useStore($scheduleView)
  const storedFavoritesOnly = useStore($favoritesOnly)
  const storedFavorites = useStore($favorites)
  // Render with defaults until mounted so SSR markup matches hydration.
  const view = mounted ? storedView : "grid"
  const favoritesOnly = mounted ? storedFavoritesOnly : false
  const favorites = mounted ? storedFavorites : []

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <Tabs
          value={view}
          onValueChange={(value) => $scheduleView.set(value as ScheduleView)}
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
          My schedule
          <Badge
            variant={favoritesOnly ? "default" : "secondary"}
            className="tabular-nums"
          >
            {favorites.length}
          </Badge>
        </Button>

        <div className="ml-auto">
          <NotificationSettings sessions={sessions} />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {view === "grid" ? (
          <ScheduleGrid
            sessions={sessions}
            stages={stages}
            favorites={favorites}
            favoritesOnly={favoritesOnly}
          />
        ) : (
          <ScheduleList
            sessions={sessions}
            favorites={favorites}
            favoritesOnly={favoritesOnly}
          />
        )}
      </div>
    </div>
  )
}
