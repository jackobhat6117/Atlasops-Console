import { NoteList, type Incident } from '@/entities/incident'
import { AddNoteForm } from '@/features/add-incident-note'
import { formatNumber } from '@/shared/lib'

/** Investigation timeline plus the composer that appends to it. */
export function IncidentNotes({ incident }: { incident: Incident }) {
  return (
    <section aria-labelledby="incident-notes-heading" className="rounded-lg border border-line bg-surface shadow-sm">
      <h2 id="incident-notes-heading" className="border-b border-line px-4 py-3 text-sm font-semibold text-fg">
        Notes <span className="font-normal text-muted">({formatNumber(incident.notes.length)})</span>
      </h2>
      <div className="px-4 py-4">
        <NoteList notes={incident.notes} />
      </div>
      <div className="border-t border-line bg-canvas/50 px-4 py-4">
        <AddNoteForm incidentId={incident.id} />
      </div>
    </section>
  )
}
