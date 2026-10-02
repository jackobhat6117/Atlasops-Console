import { useMemo } from 'react'
import { formatDateTime, formatRelativeTime } from '@/shared/lib'
import type { IncidentNote } from '../model/schemas'

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Chronological timeline (oldest first, so new notes appear at the bottom next
 * to the composer). Messages are rendered as plain text: React escapes them,
 * and line breaks are kept with CSS, never with HTML.
 */
export function NoteList({ notes }: { notes: IncidentNote[] }) {
  const sorted = useMemo(
    () => [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
    [notes],
  )

  if (sorted.length === 0) {
    return <p className="py-4 text-muted">No notes yet. Add the first investigation note below.</p>
  }

  return (
    <ol aria-label="Notes" className="flex flex-col">
      {sorted.map((note) => (
        <li key={note.id} className="relative flex gap-3 pb-5 last:pb-0">
          {/* Timeline rail */}
          <span aria-hidden="true" className="absolute top-8 bottom-0 left-4 w-px bg-line [li:last-child>&]:hidden" />
          <span
            aria-hidden="true"
            className="z-[1] grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-semibold text-muted ring-4 ring-surface"
          >
            {initials(note.author.name)}
          </span>
          <article className="min-w-0 flex-1 pt-1">
            <header className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium text-fg">{note.author.name}</span>
              <time dateTime={note.createdAt} title={formatDateTime(note.createdAt)} className="text-xs text-muted">
                {formatRelativeTime(note.createdAt)}
              </time>
            </header>
            <p className="mt-1 break-words whitespace-pre-wrap text-fg">{note.message}</p>
          </article>
        </li>
      ))}
    </ol>
  )
}
