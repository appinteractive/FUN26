import { Check, Copy, Share2 } from "lucide-react"
import QRCode from "qrcode"
import { useEffect, useRef, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useMounted } from "@/hooks/use-mounted"
import { buildShareLink, decodeFavParam, parseShareLink } from "@/lib/share"
import { addFavorites, replaceFavorites } from "@/lib/stores"
import type { SessionLite } from "@/lib/types"

type Notice =
  | { kind: "imported"; added: number; total: number }
  | {
      kind: "invalid"
    }

export function ShareSchedule({
  sessions,
  favorites,
}: {
  sessions: SessionLite[]
  favorites: string[]
}) {
  const mounted = useMounted()
  const [open, setOpen] = useState(false)
  const [linkText, setLinkText] = useState("")
  /** Slugs awaiting the user's add/replace decision. */
  const [pending, setPending] = useState<string[] | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // A share link opened in the browser lands here as ?fav=… — offer the
  // import once and clean the URL so reloads don't re-trigger it.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("fav")
    if (raw === null) return
    window.history.replaceState(null, "", window.location.pathname)
    const slugs = decodeFavParam(raw, sessions)
    if (slugs.length > 0) {
      // One-time sync from the URL — can't be derived during render
      // because the location is only readable after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPending(slugs)
      setOpen(true)
    }
  }, [sessions])

  const shareLink =
    mounted && favorites.length > 0 ? buildShareLink(favorites) : ""
  const canShare = mounted && typeof navigator.share === "function"

  // Render the share link as a scannable QR code so another device can
  // import the favorites with its camera — no typing or pasting.
  const [qr, setQr] = useState<{ link: string; dataUrl: string } | null>(null)
  useEffect(() => {
    if (!shareLink) return
    let cancelled = false
    QRCode.toDataURL(shareLink, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((dataUrl) => {
        if (!cancelled) setQr({ link: shareLink, dataUrl })
      })
      .catch(() => {
        // QR stays hidden; the link and copy button still work.
      })
    return () => {
      cancelled = true
    }
  }, [shareLink])
  // Only show the code once it matches the current link, so a stale QR is
  // never shown for newly changed favorites.
  const qrSrc = qr && qr.link === shareLink ? qr.dataUrl : null

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — the link stays selectable in the input.
    }
  }

  async function shareNative() {
    try {
      await navigator.share({ title: "My FUN26 schedule", url: shareLink })
    } catch {
      // User dismissed the share sheet.
    }
  }

  function previewPasted() {
    const slugs = parseShareLink(linkText, sessions)
    if (slugs.length > 0) {
      setPending(slugs)
      setNotice(null)
    } else {
      setNotice({ kind: "invalid" })
    }
  }

  function applyImport(mode: "add" | "replace") {
    if (!pending) return
    const added =
      mode === "replace"
        ? pending.length
        : pending.filter((s) => !favorites.includes(s)).length
    if (mode === "replace") replaceFavorites(pending)
    else addFavorites(pending)
    setNotice({ kind: "imported", added, total: pending.length })
    setPending(null)
    setLinkText("")
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setPending(null)
      setNotice(null)
      setLinkText("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="Share or import schedule"
          >
            <Share2 />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share schedule</DialogTitle>
          <DialogDescription>
            Move your favorites to another device or share them with a friend.
          </DialogDescription>
        </DialogHeader>

        {pending ? (
          <>
            <Alert>
              <AlertTitle>
                Import {pending.length} session
                {pending.length === 1 ? "" : "s"}?
              </AlertTitle>
              <AlertDescription>
                Add them to your favorites, or replace your current schedule (
                {favorites.length} favorite
                {favorites.length === 1 ? "" : "s"}).
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => applyImport("add")}>
                Add to my schedule
              </Button>
              <Button variant="outline" onClick={() => applyImport("replace")}>
                Replace
              </Button>
              <Button variant="ghost" onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            {notice?.kind === "imported" && (
              <Alert>
                <AlertTitle>Schedule imported</AlertTitle>
                <AlertDescription>
                  {notice.added === 0
                    ? `All ${notice.total} sessions were already in your favorites.`
                    : `${notice.added} of ${notice.total} session${
                        notice.total === 1 ? "" : "s"
                      } added to your favorites.`}
                </AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="share-link">
                  Share your favorites
                </FieldLabel>
                {qrSrc && (
                  // Wrapper takes Field's *:w-full so the image stays square.
                  <div className="flex justify-center">
                    <img
                      src={qrSrc}
                      alt={`QR code transferring ${favorites.length} favorited session${
                        favorites.length === 1 ? "" : "s"
                      }`}
                      className="size-44 rounded-lg border bg-white p-2"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    id="share-link"
                    readOnly
                    value={shareLink}
                    placeholder="Favorite a few sessions first"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Copy link"
                    disabled={favorites.length === 0}
                    onClick={() => void copyLink()}
                  >
                    {copied ? <Check /> : <Copy />}
                  </Button>
                  {canShare && (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Share link"
                      disabled={favorites.length === 0}
                      onClick={() => void shareNative()}
                    >
                      <Share2 />
                    </Button>
                  )}
                </div>
                <FieldDescription>
                  Scan the code with another device, or open this link there, to
                  import your favorites.
                </FieldDescription>
              </Field>

              <Separator />

              <Field>
                <FieldLabel htmlFor="import-link">
                  Import from a link
                </FieldLabel>
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    previewPasted()
                  }}
                >
                  <Input
                    id="import-link"
                    value={linkText}
                    onChange={(event) => {
                      setLinkText(event.target.value)
                      setNotice(null)
                    }}
                    placeholder="Paste a shared schedule link"
                    inputMode="url"
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={linkText.trim() === ""}
                  >
                    Import
                  </Button>
                </form>
                {notice?.kind === "invalid" && (
                  <p className="text-xs text-destructive">
                    That doesn&apos;t look like a FUN26 schedule link.
                  </p>
                )}
                <FieldDescription>
                  The installed app has no address bar — paste a shared link
                  here instead of opening it.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
