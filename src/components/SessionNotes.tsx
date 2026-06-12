import { useEffect, useRef, useState } from "react"
import { useStore } from "@nanostores/react"
import { NotebookPen } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import { useMounted } from "@/hooks/use-mounted"
import { $notes, setNote } from "@/lib/stores"

interface SessionNotesProps {
  slug: string
}

export function SessionNotes({ slug }: SessionNotesProps) {
  const mounted = useMounted()
  const notes = useStore($notes)
  const [draft, setDraft] = useState<string | null>(null)
  const pending = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const text = draft ?? (mounted ? (notes[slug] ?? "") : "")

  function onChange(value: string) {
    setDraft(value)
    pending.current = value
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setNote(slug, value)
      pending.current = null
    }, 400)
  }

  // Flush a pending debounced save when the page is left or backgrounded.
  useEffect(() => {
    const flush = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      if (pending.current !== null) {
        setNote(slug, pending.current)
        pending.current = null
      }
    }
    document.addEventListener("visibilitychange", flush)
    window.addEventListener("pagehide", flush)
    return () => {
      flush()
      document.removeEventListener("visibilitychange", flush)
      window.removeEventListener("pagehide", flush)
    }
  }, [slug])

  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <NotebookPen className="size-4 text-muted-foreground" /> My notes
      </h2>
      <Textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Jot down takeaways, questions or follow-ups…"
        aria-label="Personal notes for this session"
        className="mt-2"
        disabled={!mounted}
      />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Saved automatically — only on this device.
      </p>
    </section>
  )
}
