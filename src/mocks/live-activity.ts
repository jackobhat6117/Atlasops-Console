import type { Incident, IncidentNote, IncidentStatus } from '@/entities/incident'
import { getAllIncidents, nextNoteId, recordActivity, touch } from './db'
import { NOTE_MESSAGES, USERS } from './seed'
import { excerpt } from './seed-activity'



const NEXT_STATUS: Record<IncidentStatus, IncidentStatus | null> = {
  triggered: 'acknowledged',
  acknowledged: 'investigating',
  investigating: 'resolved',
  resolved: null,
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]
}

export function simulateTeammateActivity(random: () => number = Math.random): Incident | null {
  const open = getAllIncidents().filter((incident) => incident.status !== 'resolved')
  if (open.length === 0) return null

  const incident = pick(open, random)
  const actor = pick(USERS, random)
  const roll = random()

  if (incident.assignee === null && roll < 0.5) {
    const updated = touch(incident, { assignee: actor })
    recordActivity({
      type: 'assignee_changed',
      incidentId: incident.id,
      actor,
      createdAt: updated.updatedAt,
      from: null,
      to: actor,
    })
    return updated
  }

  const nextStatus = NEXT_STATUS[incident.status]
  if (nextStatus && roll < 0.8) {
    const updated = touch(incident, { status: nextStatus })
    recordActivity({
      type: 'status_changed',
      incidentId: incident.id,
      actor,
      createdAt: updated.updatedAt,
      from: incident.status,
      to: nextStatus,
    })
    return updated
  }

  const note: IncidentNote = {
    id: nextNoteId(),
    incidentId: incident.id,
    author: actor,
    message: pick(NOTE_MESSAGES, random),
    createdAt: new Date().toISOString(),
  }
  const updated = touch(incident, { notes: [...incident.notes, note] })
  recordActivity({
    type: 'note_added',
    incidentId: incident.id,
    actor,
    createdAt: note.createdAt,
    noteId: note.id,
    excerpt: excerpt(note.message),
  })
  return updated
}

let timer: ReturnType<typeof setInterval> | undefined

/** Starts the simulation (idempotent). Ticks are skipped while the tab is hidden. */
export function startLiveActivity(intervalMs: number) {
  if (timer !== undefined) return
  timer = setInterval(() => {
    if (!document.hidden) simulateTeammateActivity()
  }, intervalMs)
}

export function stopLiveActivity() {
  clearInterval(timer)
  timer = undefined
}
