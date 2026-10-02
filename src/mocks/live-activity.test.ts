import { describe, expect, it } from 'vitest'
import { findIncident, getAllIncidents, getIncidentActivity } from './db'
import { simulateTeammateActivity } from './live-activity'
import { createRandom, USERS } from './seed'

describe('simulateTeammateActivity', () => {
  it('changes one open incident like a real write: version, timestamp and audit entry', () => {
    const open = getAllIncidents().filter((incident) => incident.status !== 'resolved')
    const versions = new Map(open.map((incident) => [incident.id, incident.version]))

    const updated = simulateTeammateActivity(createRandom(1))

    expect(updated).not.toBeNull()
    expect(versions.has(updated!.id)).toBe(true)
    expect(updated!.version).toBe(versions.get(updated!.id)! + 1)
    expect(findIncident(updated!.id)).toEqual(updated)

    const [latest] = getIncidentActivity(updated!.id)
    expect(latest.createdAt).toBe(updated!.updatedAt)
    // Always a teammate, never the signed-in user, so the change visibly comes from someone else.
    expect(USERS.map((user) => user.id)).toContain(latest.actor.id)
  })

  it('never touches resolved incidents', () => {
    const resolved = new Map(
      getAllIncidents()
        .filter((incident) => incident.status === 'resolved')
        .map((incident) => [incident.id, incident.version]),
    )
    const random = createRandom(7)
    for (let i = 0; i < 200; i++) simulateTeammateActivity(random)

    // Incidents that were already resolved must keep their original version.
    for (const [id, version] of resolved) expect(findIncident(id)!.version).toBe(version)
  })
})
