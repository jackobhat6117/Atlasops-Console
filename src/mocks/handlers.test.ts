import { describe, expect, it } from 'vitest'
import {
  incidentListResponseSchema,
  incidentNoteSchema,
  incidentSchema,
  statusUpdateResponseSchema,
  type Incident,
} from '@/entities/incident'
import { configureMock } from './config'
import { INCIDENT_COUNT } from './seed'

const api = (path: string) => `${window.location.origin}/api${path}`

async function send(path: string, init: RequestInit = {}) {
  const response = await fetch(api(path), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  return { status: response.status, body: await response.json() }
}

async function list(query = '') {
  const { status, body } = await send(`/incidents${query}`)
  expect(status).toBe(200)
  return incidentListResponseSchema.parse(body)
}

async function getIncident(id: string): Promise<Incident> {
  const { body } = await send(`/incidents/${id}`)
  return incidentSchema.parse(body)
}

describe('GET /api/incidents', () => {
  it('returns the seeded dataset paginated with 25 items by default', async () => {
    const result = await list()
    expect(result.total).toBe(INCIDENT_COUNT)
    expect(result.items).toHaveLength(25)
    expect(result.totalPages).toBe(Math.ceil(INCIDENT_COUNT / 25))
  })

  it('is deterministic across resets', async () => {
    const first = await list('?page=3')
    const second = await list('?page=3')
    expect(second.items.map((i) => i.id)).toEqual(first.items.map((i) => i.id))
  })

  it('searches by id, title, service and assignee name (case-insensitive)', async () => {
    expect((await list('?q=inc-1042')).items.map((i) => i.id)).toContain('INC-1042')

    const byAssignee = await list('?q=maya&pageSize=100')
    expect(byAssignee.total).toBeGreaterThan(0)
    expect(byAssignee.items.every((i) => i.assignee?.name === 'Maya Chen')).toBe(true)

    const byService = await list('?q=CHECKOUT&pageSize=100')
    expect(byService.items.every((i) => i.service === 'checkout-web')).toBe(true)
  })

  it('combines status, severity and service filters', async () => {
    const result = await list(
      '?status=triggered,investigating&severity=critical&service=payments-api&pageSize=100',
    )
    expect(result.total).toBeGreaterThan(0)
    for (const item of result.items) {
      expect(['triggered', 'investigating']).toContain(item.status)
      expect(item.severity).toBe('critical')
      expect(item.service).toBe('payments-api')
    }
  })

  it('ignores invalid filter, sort and paging values instead of failing', async () => {
    const result = await list('?status=bogus&severity=&sort=hack&order=sideways&page=-4&pageSize=9999')
    expect(result.total).toBe(INCIDENT_COUNT)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(100)
  })

  it('sorts by severity with a stable tie-break and no duplicates across pages', async () => {
    const page1 = await list('?sort=severity&order=desc&pageSize=50')
    const page2 = await list('?sort=severity&order=desc&pageSize=50&page=2')
    expect(page1.items[0].severity).toBe('critical')
    const ids = [...page1.items, ...page2.items].map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('sorts by updatedAt descending by default', async () => {
    const { items } = await list()
    const dates = items.map((i) => i.updatedAt)
    expect(dates).toEqual([...dates].sort().reverse())
  })
})

describe('GET /api/incidents/:id', () => {
  it('returns the incident with notes in chronological order', async () => {
    const incident = await getIncident('INC-1042')
    const dates = incident.notes.map((n) => n.createdAt)
    expect(dates).toEqual([...dates].sort())
  })

  it('returns 404 INCIDENT_NOT_FOUND for unknown ids', async () => {
    const { status, body } = await send('/incidents/INC-0')
    expect(status).toBe(404)
    expect(body.code).toBe('INCIDENT_NOT_FOUND')
  })
})

describe('POST /api/incidents', () => {
  const valid = {
    title: 'Checkout latency increased',
    description: 'The 95th percentile latency has exceeded the alert threshold.',
    status: 'triggered',
    severity: 'high',
    service: 'checkout-web',
    assigneeId: 'usr-18',
  }

  it('creates an incident with a new id and returns 201', async () => {
    const { status, body } = await send('/incidents', { method: 'POST', body: JSON.stringify(valid) })
    expect(status).toBe(201)
    const created = incidentSchema.parse(body)
    expect(created.id).toBe(`INC-${1001 + INCIDENT_COUNT}`)
    expect(created.assignee?.name).toBe('Omar Hassan')
    expect((await getIncident(created.id)).title).toBe(valid.title)
  })

  it('returns 400 with field errors for invalid input', async () => {
    const { status, body } = await send('/incidents', {
      method: 'POST',
      body: JSON.stringify({ ...valid, title: 'abc', service: 'unknown-service' }),
    })
    expect(status).toBe(400)
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.fieldErrors.title).toEqual(['Title must contain at least 5 characters.'])
  })
})

describe('PATCH /api/incidents/:id/status', () => {
  it('updates the status and bumps the version', async () => {
    const before = await getIncident('INC-1042')
    const { status, body } = await send('/incidents/INC-1042/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved', version: before.version }),
    })
    expect(status).toBe(200)
    const result = statusUpdateResponseSchema.parse(body)
    expect(result).toMatchObject({ status: 'resolved', version: before.version + 1 })
    expect((await getIncident('INC-1042')).status).toBe('resolved')
  })

  it('returns 409 when the version is stale', async () => {
    const before = await getIncident('INC-1042')
    const { status, body } = await send('/incidents/INC-1042/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved', version: before.version - 1 }),
    })
    expect(status).toBe(409)
    expect(body).toMatchObject({ code: 'INCIDENT_VERSION_CONFLICT', currentVersion: before.version })
  })
})

describe('PATCH /api/incidents/:id/assignee', () => {
  it('assigns and unassigns', async () => {
    const assigned = await send('/incidents/INC-1042/assignee', {
      method: 'PATCH',
      body: JSON.stringify({ assigneeId: 'usr-12' }),
    })
    expect(incidentSchema.parse(assigned.body).assignee?.name).toBe('Maya Chen')

    const unassigned = await send('/incidents/INC-1042/assignee', {
      method: 'PATCH',
      body: JSON.stringify({ assigneeId: null }),
    })
    expect(incidentSchema.parse(unassigned.body).assignee).toBeNull()
  })

  it('rejects unknown users', async () => {
    const { status } = await send('/incidents/INC-1042/assignee', {
      method: 'PATCH',
      body: JSON.stringify({ assigneeId: 'usr-nope' }),
    })
    expect(status).toBe(400)
  })
})

describe('POST /api/incidents/:id/notes', () => {
  it('adds a trimmed note authored by the current user, appended last', async () => {
    const { status, body } = await send('/incidents/INC-1042/notes', {
      method: 'POST',
      body: JSON.stringify({ message: '  Restarted the worker pool.  ' }),
    })
    expect(status).toBe(201)
    const note = incidentNoteSchema.parse(body)
    expect(note).toMatchObject({ message: 'Restarted the worker pool.', author: { id: 'usr-current' } })
    expect((await getIncident('INC-1042')).notes.at(-1)?.id).toBe(note.id)
  })

  it('rejects whitespace-only notes', async () => {
    const { status } = await send('/incidents/INC-1042/notes', {
      method: 'POST',
      body: JSON.stringify({ message: '   ' }),
    })
    expect(status).toBe(400)
  })
})

describe('reference data', () => {
  it('lists users and services', async () => {
    expect((await send('/users')).body.items.length).toBeGreaterThan(0)
    expect((await send('/services')).body.items).toContain('payments-api')
  })
})

describe('failure simulation', () => {
  it('honors X-Mock-Failure', async () => {
    const { status, body } = await send('/incidents', { headers: { 'X-Mock-Failure': '500' } })
    expect(status).toBe(500)
    expect(body).not.toHaveProperty('stack')
  })

  it('honors X-Mock-Conflict on status updates', async () => {
    const { status } = await send('/incidents/INC-1042/status', {
      method: 'PATCH',
      headers: { 'X-Mock-Conflict': 'true' },
      body: JSON.stringify({ status: 'resolved' }),
    })
    expect(status).toBe(409)
  })

  it('ignores dev headers when dev controls are disabled', async () => {
    configureMock({ devControls: false })
    const { status } = await send('/incidents', { headers: { 'X-Mock-Failure': '500' } })
    expect(status).toBe(200)
  })

  it('applies the configured latency when no delay header is sent', async () => {
    configureMock({ minDelayMs: 150, maxDelayMs: 150 })
    const start = performance.now()
    await send('/services')
    expect(performance.now() - start).toBeGreaterThanOrEqual(140)
  })

  it('fails randomly at the configured rate', async () => {
    configureMock({ failureRate: 1 })
    const { status, body } = await send('/incidents')
    expect(status).toBe(500)
    expect(body.code).toBe('INTERNAL_ERROR')
  })
})
