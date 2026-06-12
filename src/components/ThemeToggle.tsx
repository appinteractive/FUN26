import { Moon, Sun } from "lucide-react"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"

const STORAGE_KEY = "fun26.theme"

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function appliedTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function ThemeToggle() {
  // "light" during SSR/hydration; syncs to the actual class after mount.
  const theme = useSyncExternalStore(subscribe, appliedTheme, () => "light")

  function toggle() {
    const next = appliedTheme() === "dark" ? "light" : "dark"
    document.documentElement.classList.toggle("dark", next === "dark")
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // private mode — theme just won't persist
    }
    for (const l of listeners) l()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle dark mode"
      onClick={toggle}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  )
}
