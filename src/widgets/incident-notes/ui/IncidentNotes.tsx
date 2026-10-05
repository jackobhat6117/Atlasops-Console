import { NoteList, type Incident } from '@/entities/incident'
import { AddNoteForm } from '@/features/add-incident-note'
import { formatNumber } from '@/shared/lib'


export function IncidentNotes({ incident }: { incident: Incident }) {
  return (
    <section aria-labelledby="incident-notes-heading" className="rounded-xl border border-line bg-surface shadow-panel">
      <h2 id="incident-notes-heading" className="border-b border-line px-5 py-4 text-sm font-semibold text-fg">
        Notes <span className="font-normal text-muted">({formatNumber(incident.notes.length)})</span>
      </h2>
      <div className="px-5 py-4">
        <NoteList notes={incident.notes} />
      </div>
      <div className="rounded-b-xl border-t border-line bg-surface-muted/70 px-5 py-4">
        <AddNoteForm incidentId={incident.id} />
      </div>
    </section>
  )
}
