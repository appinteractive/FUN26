import { useStore } from "@nanostores/react"
import { Clock, Download, MapPin, NotebookPen } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { useMounted } from "@/hooks/use-mounted"
import { $notes } from "@/lib/stores"
import { dayKey, fmtDay, fmtTime } from "@/lib/time"
import { speakerNames, type SessionLite } from "@/lib/types"

interface NotesOverviewProps {
  sessions: SessionLite[]
}

function notesMarkdown(noted: { session: SessionLite; note: string }[]) {
  const parts = ["# My FUN26 notes", ""]
  for (const { session, note } of noted) {
    parts.push(
      `## ${session.title}`,
      "",
      `${fmtDay(dayKey(session.start))}, ${fmtTime(session.start)} – ${fmtTime(session.end)} · ${session.stage}` +
        (session.speakers.length > 0 ? ` · ${speakerNames(session)}` : ""),
      "",
      note.trim(),
      ""
    )
  }
  return parts.join("\n")
}

export function NotesOverview({ sessions }: NotesOverviewProps) {
  const mounted = useMounted()
  const notes = useStore($notes)

  const noted = mounted
    ? sessions
        .filter((s) => (notes[s.slug] ?? "").trim() !== "")
        .map((session) => ({ session, note: notes[session.slug] }))
    : []

  if (noted.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <NotebookPen />
          </EmptyMedia>
          <EmptyTitle>No notes yet</EmptyTitle>
          <EmptyDescription>
            Open any session and write into "My notes" — everything you jot down
            shows up here. Notes are stored only on this device.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  function downloadAll() {
    const blob = new Blob([notesMarkdown(noted)], {
      type: "text/markdown;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fun26-notes.md"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {noted.length} {noted.length === 1 ? "session" : "sessions"} with
          notes, stored only on this device.
        </p>
        <Button variant="outline" size="sm" onClick={downloadAll}>
          <Download data-icon="inline-start" /> Export .md
        </Button>
      </div>

      {noted.map(({ session, note }) => (
        <article key={session.slug} className="rounded-xl border bg-card p-4">
          <a
            href={`/schedule/${session.slug}`}
            className="font-semibold text-balance no-underline hover:text-primary"
          >
            {session.title}
          </a>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock className="size-3.5" />
              {fmtDay(dayKey(session.start))}, {fmtTime(session.start)} –{" "}
              {fmtTime(session.end)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {session.stage}
            </span>
          </p>
          <p className="mt-3 text-sm whitespace-pre-wrap">{note.trim()}</p>
        </article>
      ))}
    </div>
  )
}
