import {
  ACTIVITY_EXCERPT_MAX,
  type Incident,
  type IncidentActivity,
  type IncidentSeverity,
  type IncidentStatus,
} from '@/entities/incident'
import { createRandom, SEED, USERS } from './seed'

// Plausible, deterministic history for each seeded incident, derived from its
// current state: created as "triggered", walked through the lifecycle to its
// current status, assigned, plus one entry per seeded note. Each incident uses
// its own random stream, so this never changes the seeded incidents themselves.

const STATUS_PATH: Record<IncidentStatus, IncidentStatus[]> = {
  triggered: [],
  acknowledged: ['acknowledged'],
  investigating: ['acknowledged', 'investigating'],
  resolved: ['acknowledged', 'investigating', 'resolved'],
}

const MINUTE_MS = 60_000

/**
 * How quickly someone first responds (moves the incident out of Triggered), in minutes.
 * More severe incidents are picked up faster, as an on-call rotation would, so the
 * dashboard's response-time metrics look like a real team's.
 */
const FIRST_RESPONSE_MINUTES: Record<IncidentSeverity, [min: number, max: number]> = {
  critical: [2, 10],
  high: [5, 25],
  medium: [10, 60],
  low: [20, 120],
}

export function excerpt(message: string) {
  return message.length > ACTIVITY_EXCERPT_MAX ? `${message.slice(0, ACTIVITY_EXCERPT_MAX - 1)}…` : message
}

/** Oldest first. */
export function generateIncidentActivity(incident: Incident, nextId: () => string): IncidentActivity[] {
  const random = createRandom(SEED ^ Number(incident.id.replace(/\D/g, '')))
  const pickUser = () => USERS[Math.floor(random() * USERS.length)]
  const createdMs = Date.parse(incident.createdAt)
  const updatedMs = Math.max(Date.parse(incident.updatedAt), createdMs + MINUTE_MS)
  const at = (ms: number) => new Date(ms).toISOString()
  const base = { incidentId: incident.id }

  const entries: IncidentActivity[] = [
    {
      ...base,
      id: nextId(),
      type: 'created',
      actor: pickUser(),
      createdAt: incident.createdAt,
      severity: incident.severity,
      status: 'triggered',
      service: incident.service,
      assignee: null,
    },
  ]

  // Owner picks the incident up shortly after it was raised.
  if (incident.assignee) {
    entries.push({
      ...base,
      id: nextId(),
      type: 'assignee_changed',
      actor: random() < 0.6 ? incident.assignee : pickUser(),
      createdAt: at(createdMs + Math.floor(random() * 10 + 1) * MINUTE_MS),
      from: null,
      to: incident.assignee,
    })
  }

  // Status transitions spread across the incident's lifetime, the last one at its final update.
  // The first response follows the severity-based delay, but never after the next step.
  const path = STATUS_PATH[incident.status]
  const [minResponse, maxResponse] = FIRST_RESPONSE_MINUTES[incident.severity]
  const firstResponseMs = createdMs + (minResponse + random() * (maxResponse - minResponse)) * MINUTE_MS
  let previous: IncidentStatus = 'triggered'
  path.forEach((status, index) => {
    const fraction = (index + 1) / path.length
    const spreadMs = createdMs + Math.floor((updatedMs - createdMs) * fraction)
    entries.push({
      ...base,
      id: nextId(),
      type: 'status_changed',
      actor: incident.assignee ?? pickUser(),
      createdAt: at(index === 0 ? Math.min(spreadMs, firstResponseMs) : spreadMs),
      from: previous,
      to: status,
    })
    previous = status
  })

  for (const note of incident.notes) {
    entries.push({
      ...base,
      id: nextId(),
      type: 'note_added',
      actor: note.author,
      createdAt: note.createdAt,
      noteId: note.id,
      excerpt: excerpt(note.message),
    })
  }

  return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
