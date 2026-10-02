import type { Incident } from '@/entities/incident'
import { FIRST_INCIDENT_NUMBER, formatIncidentId, generateIncidents } from './seed'

// In-memory "database" for the mock API. It lives in the service worker's page
// context (browser) or the test process (Vitest), and resets on reload.

interface Db {
  incidents: Map<string, Incident>
  nextIncidentNumber: number
  nextNoteNumber: number
}

let db: Db = createDb()

function createDb(): Db {
  const incidents = generateIncidents()
  const noteCount = incidents.reduce((sum, incident) => sum + incident.notes.length, 0)
  return {
    incidents: new Map(incidents.map((incident) => [incident.id, incident])),
    nextIncidentNumber: FIRST_INCIDENT_NUMBER + incidents.length,
    nextNoteNumber: noteCount + 1,
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

export function nextIncidentId() {
  return formatIncidentId(db.nextIncidentNumber++)
}

export function nextNoteId() {
  return `note-${db.nextNoteNumber++}`
}
