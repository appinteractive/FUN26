import { useStore } from "@nanostores/react"
import { Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted"
import { $favorites, toggleFavorite } from "@/lib/stores"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  slug: string
  size?: "icon-xs" | "icon-sm" | "icon"
  className?: string
}

export function FavoriteButton({
  slug,
  size = "icon-sm",
  className,
}: FavoriteButtonProps) {
  const mounted = useMounted()
  const favorites = useStore($favorites)
  const active = mounted && favorites.includes(slug)

  return (
    <Button
      variant="ghost"
      size={size}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={active}
      className={cn("rounded-full", className)}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleFavorite(slug)
      }}
    >
      <Heart
        className={cn(
          "transition-colors",
          active ? "fill-primary stroke-primary" : "stroke-muted-foreground"
        )}
      />
    </Button>
  )
}
