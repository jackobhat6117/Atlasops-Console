import type { Incident, IncidentActivity } from '@/entities/incident'
import { FIRST_INCIDENT_NUMBER, formatIncidentId, generateIncidents } from './seed'
import { generateIncidentActivity } from './seed-activity'

// In-memory "database" for the mock API. It lives in the service worker's page
// context (browser) or the test process (Vitest), and resets on reload.

interface Db {
  incidents: Map<string, Incident>
  /** Audit history per incident, oldest first. */
  activity: Map<string, IncidentActivity[]>
  nextIncidentNumber: number
  nextNoteNumber: number
  nextActivityNumber: number
}

let db: Db = createDb()

function createDb(): Db {
  const incidents = generateIncidents()
  const noteCount = incidents.reduce((sum, incident) => sum + incident.notes.length, 0)
  let activityNumber = 1
  const nextId = () => `act-${activityNumber++}`
  const activity = new Map(incidents.map((incident) => [incident.id, generateIncidentActivity(incident, nextId)]))
  return {
    incidents: new Map(incidents.map((incident) => [incident.id, incident])),
    activity,
    nextIncidentNumber: FIRST_INCIDENT_NUMBER + incidents.length,
    nextNoteNumber: noteCount + 1,
    nextActivityNumber: activityNumber,
  }
}

/** Restore the seeded fixtures. Called before each test for isolation. */
export function resetDb() {
  db = createDb()
}

export function getAllIncidents(): Incident[] {
  return Array.from(db.incidents.values())
}

export function findIncident(id: string): Incident | undefined {
  return db.incidents.get(id)
}

export function saveIncident(incident: Incident) {
  db.incidents.set(incident.id, incident)
}

/** Applies a change and bumps `updatedAt` and `version`, as the server does on every write. */
export function touch(incident: Incident, changes: Partial<Incident>): Incident {
  const updated: Incident = {
    ...incident,
    ...changes,
    updatedAt: new Date().toISOString(),
    version: incident.version + 1,
  }
  saveIncident(updated)
  return updated
}

export function nextIncidentId() {
  return formatIncidentId(db.nextIncidentNumber++)
}

export function nextNoteId() {
  return `note-${db.nextNoteNumber++}`
}

/** Newest first. */
export function getIncidentActivity(incidentId: string): IncidentActivity[] {
  return [...(db.activity.get(incidentId) ?? [])].reverse()
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** Append an audit entry; the id is assigned here, like a database would. */
export function recordActivity(entry: DistributiveOmit<IncidentActivity, 'id'>) {
  const saved = { ...entry, id: `act-${db.nextActivityNumber++}` } as IncidentActivity
  db.activity.set(entry.incidentId, [...(db.activity.get(entry.incidentId) ?? []), saved])
  return saved
}

/** Every audit entry across all incidents, oldest first within each incident. */
export function getAllActivity(): IncidentActivity[] {
  return Array.from(db.activity.values()).flat()
}
