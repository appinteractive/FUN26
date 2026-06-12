import { Check, Copy, Share2 } from "lucide-react"
import QRCode from "qrcode"
import { useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { buildShareUrl } from "@/lib/share"

export function ShareSchedule({ favorites }: { favorites: string[] }) {
  const url = useMemo(
    () =>
      typeof window === "undefined" || favorites.length === 0
        ? ""
        : buildShareUrl(favorites),
    [favorites]
  )

  const [qr, setQr] = useState<{ url: string; dataUrl: string } | null>(null)
  useEffect(() => {
    if (!url) return
    let cancelled = false
    QRCode.toDataURL(url, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((dataUrl) => {
        if (!cancelled) setQr({ url, dataUrl })
      })
      .catch(() => {
        // QR stays hidden; the link buttons still work
      })
    return () => {
      cancelled = true
    }
  }, [url])
  const qrSrc = qr && qr.url === url ? qr.dataUrl : null

  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(copyTimer.current), [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked — the QR code remains as fallback
    }
  }

  async function shareLink() {
    try {
      await navigator.share({ title: "My FUN26 schedule", url })
    } catch {
      // user cancelled the share sheet
    }
  }

  if (favorites.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Favorite some sessions first, then transfer them to another device here.
      </p>
    )
  }

  const canShare = typeof navigator !== "undefined" && "share" in navigator

  return (
    <div className="flex flex-col items-center gap-3">
      {qrSrc && (
        <img
          src={qrSrc}
          alt={`QR code transferring ${favorites.length} favorited sessions`}
          className="size-44 rounded-lg border bg-white p-2"
        />
      )}
      <p className="text-center text-xs text-muted-foreground">
        Scan with the other device's camera — your {favorites.length} favorite
        {favorites.length === 1 ? "" : "s"} import there with one tap. Or send
        the link:
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => void copyLink()}>
          {copied ? (
            <Check data-icon="inline-start" />
          ) : (
            <Copy data-icon="inline-start" />
          )}
          {copied ? "Copied" : "Copy link"}
        </Button>
        {canShare && (
          <Button variant="outline" size="sm" onClick={() => void shareLink()}>
            <Share2 data-icon="inline-start" />
            Share…
          </Button>
        )}
      </div>
    </div>
  )
}
