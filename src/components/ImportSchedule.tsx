import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { $favorites } from "@/lib/stores"
import { clearImportHash, parseImportHash } from "@/lib/share"
import type { SessionLite } from "@/lib/types"

const PREVIEW_COUNT = 5

/**
 * Watches for #import=… links (from the QR code / share link) and offers
 * to merge or replace the local favorites with the transferred ones.
 */
export function ImportSchedule({ sessions }: { sessions: SessionLite[] }) {
  const [pending, setPending] = useState<string[] | null>(null)

  useEffect(() => {
    const read = () =>
      setPending(parseImportHash(window.location.hash, sessions))
    read()
    window.addEventListener("hashchange", read)
    return () => window.removeEventListener("hashchange", read)
  }, [sessions])

  if (!pending) return null

  const titles = pending
    .map((slug) => sessions.find((s) => s.slug === slug)?.title)
    .filter((t): t is string => Boolean(t))

  function finish(favorites?: string[]) {
    if (favorites) $favorites.set(favorites)
    clearImportHash()
    setPending(null)
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) finish()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import schedule</DialogTitle>
          <DialogDescription>
            This link carries {pending.length} favorited session
            {pending.length === 1 ? "" : "s"} from another device.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          {titles.slice(0, PREVIEW_COUNT).map((title) => (
            <li key={title}>{title}</li>
          ))}
          {titles.length > PREVIEW_COUNT && (
            <li className="text-muted-foreground">
              and {titles.length - PREVIEW_COUNT} more…
            </li>
          )}
        </ul>

        <DialogFooter>
          <Button variant="ghost" onClick={() => finish()}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              finish([...new Set([...$favorites.get(), ...pending])])
            }
          >
            Merge
          </Button>
          <Button onClick={() => finish(pending)}>Replace mine</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
