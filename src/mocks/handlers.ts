import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import {
  INCIDENT_STATUSES,
  SEVERITY_RANK,
  addNoteInputSchema,
  assignInputSchema,
  createIncidentInputSchema,
  parseIncidentListParams,
  updateStatusInputSchema,
  type Incident,
  type IncidentNote,
} from '@/entities/incident'
import { mockConfig } from './config'
import {
  findIncident,
  getAllIncidents,
  getIncidentActivity,
  nextIncidentId,
  nextNoteId,
  recordActivity,
  saveIncident,
  touch,
} from './db'
import { countChangedSince, queryIncidents } from './query'
import { CURRENT_USER, SERVICES, USERS } from './seed'
import { excerpt } from './seed-activity'

// MSW request handlers implementing the contract in docs/API.md.

const MAX_DEV_DELAY_MS = 30_000

function errorResponse(
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
) {
  return HttpResponse.json({ code, message, ...extra }, { status })
}

function notFound() {
  return errorResponse(404, 'INCIDENT_NOT_FOUND', 'The requested incident does not exist.')
}

function validationError(fieldErrors: Record<string, string[] | undefined>, message: string) {
  return errorResponse(400, 'VALIDATION_ERROR', message, { fieldErrors })
}

/**
 * Applies latency, dev-control headers and random failures.
 * Returns a response to short-circuit the handler, or null to continue.
 */
async function simulateNetwork(request: Request): Promise<Response | null> {
  const { devControls, minDelayMs, maxDelayMs, failureRate } = mockConfig

  // Only a present, numeric header overrides latency (Number(null) would be 0).
  const delayHeader = devControls ? request.headers.get('X-Mock-Delay') : null
  const delayMs =
    delayHeader !== null && /^\d+$/.test(delayHeader)
      ? Math.min(Number(delayHeader), MAX_DEV_DELAY_MS)
      : minDelayMs + Math.random() * (maxDelayMs - minDelayMs)
  if (delayMs > 0) await delay(delayMs)

  if (devControls) {
    const failure = request.headers.get('X-Mock-Failure')
    if (failure === 'network') return HttpResponse.error()
    const status = Number(failure)
    if (Number.isInteger(status) && status >= 400 && status <= 599) {
      return errorResponse(status, 'SIMULATED_FAILURE', 'Simulated failure (X-Mock-Failure).')
    }
  }

  if (failureRate > 0 && Math.random() < failureRate) {
    return errorResponse(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.')
  }
  return null
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}

function sortedNotes(incident: Incident): Incident {
  return {
    ...incident,
    notes: [...incident.notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }
}

const ATTENTION_LIMIT = 8

function isOpen(incident: Incident) {
  return incident.status !== 'resolved'
}

function dashboardSummary(incidents: Incident[]) {
  const open = incidents.filter(isOpen)
  const services = Array.from(new Set(incidents.map((incident) => incident.service))).sort()
  const attention = [...open]
    .sort(
      (a, b) =>
        SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
        Number(b.assignee === null) - Number(a.assignee === null) ||
        b.updatedAt.localeCompare(a.updatedAt),
    )
    .slice(0, ATTENTION_LIMIT)
    .map((incident) => ({ ...incident, notes: [] }))

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      incidents: incidents.length,
      open: open.length,
      critical: open.filter((incident) => incident.severity === 'critical').length,
      unassigned: open.filter((incident) => incident.assignee === null).length,
      triggered: incidents.filter((incident) => incident.status === 'triggered').length,
    },
    byStatus: INCIDENT_STATUSES.map((status) => ({
      status,
      count: incidents.filter((incident) => incident.status === status).length,
    })),
    services: services
      .map((service) => {
        const rows = open.filter((incident) => incident.service === service)
        return {
          service,
          open: rows.length,
          critical: rows.filter((incident) => incident.severity === 'critical').length,
        }
      })
      .sort((a, b) => b.critical - a.critical || b.open - a.open || a.service.localeCompare(b.service)),
    attention,
  }
}

export const handlers = [
  http.get('/api/dashboard/summary', async ({ request }) => {
    const simulated = await simulateNetwork(request)
    if (simulated) return simulated
    return HttpResponse.json(dashboardSummary(getAllIncidents()))
  }),

  http.get('/api/incidents', async ({ request }) => {
    const simulated = await simulateNetwork(request)
    if (simulated) return simulated
    const query = parseIncidentListParams(new URL(request.url).searchParams)
    return HttpResponse.json(queryIncidents(getAllIncidents(), query))
  }),

  // Registered before `/:incidentId`, which would otherwise treat "changes" as an incident ID.
  http.get('/api/incidents/changes', async ({ request }) => {
    const simulated = await simulateNetwork(request)
    if (simulated) return simulated
    const url = new URL(request.url)
    const since = Date.parse(url.searchParams.get('since') ?? '')
    if (Number.isNaN(since)) {
      return validationError({ since: ['Must be an ISO 8601 timestamp.'] }, 'The since parameter is invalid.')
    }
    // Same filters as the list, so the count describes exactly the view the user is looking at.
    const filters = parseIncidentListParams(url.searchParams)
    return HttpResponse.json({ count: countChangedSince(getAllIncidents(), filters, since) })
  }),

  http.get('/api/incidents/:incidentId', async ({ request, params }) => {
    const simulated = await simulateNetwork(request)
    if (simulated) return simulated
    const incident = findIncident(String(params.incidentId))
    return incident ? HttpResponse.json(sortedNotes(incident)) : notFound()
  }),

  http.get('/api/incidents/:incidentId/activity', async ({ request, params }) => {
    const simulated = await simulateNetwork(request)
    if (simulated) return simulated
    const incident = findIncident(String(params.incidentId))
    return incident ? HttpResponse.json({ items: getIncidentActivity(incident.id) }) : notFound()
  }),

  http.post('/api/incidents', async ({ request }) => {
    const simulated = await simulateNetwork(request)
    if (simulated) return simulated

    const parsed = createIncidentInputSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return validationError(
        z.flattenError(parsed.error).fieldErrors,
        'The submitted incident is invalid.',
      )
    }
    const input = parsed.data
    if (!SERVICES.includes(input.service as (typeof SERVICES)[number])) {
      return validationError({ service: ['Unknown service.'] }, 'The submitted incident is invalid.')
    }
    const assignee = input.assigneeId ? USERS.find((user) => user.id === input.assigneeId) : null
    if (assignee === undefined) {
      return validationError({ assigneeId: ['Unknown user.'] }, 'The submitted incident is invalid.')
    }

    const now = new Date().toISOString()
    const incident: Incident = {
      id: nextIncidentId(),
      title: input.title,
      description: input.description,
      status: input.status,
      severity: input.severity,
      service: input.service,
      assignee,
      createdAt: now,
      updatedAt: now,
      notes: [],
      version: 1,
    }
    saveIncident(incident)
    recordActivity({
      type: 'created',
      incidentId: incident.id,
      actor: CURRENT_USER,
      createdAt: now,
      severity: incident.severity,
      status: incident.status,
      service: incident.service,
      assignee,
    })
    return HttpResponse.json(incident, { status: 201 })
  }),

  http.patch('/api/incidents/:incidentId/status', async ({ request, params }) => {
    const simulated = await simulateNetwork(request)
    if (simulated) return simulated
    const incident = findIncident(String(params.incidentId))
    if (!incident) return notFound()

    const parsed = updateStatusInputSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return validationError(z.flattenError(parsed.error).fieldErrors, 'The status update is invalid.')
    }
    const forcedConflict =
      mockConfig.devControls && request.headers.get('X-Mock-Conflict') === 'true'
    const staleVersion =
      parsed.data.version !== undefined && parsed.data.version !== incident.version
    if (forcedConflict || staleVersion) {
      return errorResponse(409, 'INCIDENT_VERSION_CONFLICT', 'The incident was changed by another user.', {
        currentVersion: incident.version,
      })
    }

    const updated = touch(incident, { status: parsed.data.status })
    if (incident.status !== updated.status) {
      recordActivity({
        type: 'status_changed',
        incidentId: incident.id,
        actor: CURRENT_USER,
        createdAt: updated.updatedAt,
        from: incident.status,
        to: updated.status,
      })
    }
    return HttpResponse.json({
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt,
      version: updated.version,
    })
  }),

  http.patch('/api/incidents/:incidentId/assignee', async ({ request, params }) => {
    const simulated = await simulateNetwork(request)
    if (simulated) return simulated
    const incident = findIncident(String(params.incidentId))
    if (!incident) return notFound()

    const parsed = assignInputSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return validationError(z.flattenError(parsed.error).fieldErrors, 'The assignment is invalid.')
    }
    const { assigneeId } = parsed.data
    const assignee = assigneeId === null ? null : USERS.find((user) => user.id === assigneeId)
    if (assignee === undefined) {
      return validationError({ assigneeId: ['Unknown user.'] }, 'The assignment is invalid.')
    }

    const updated = touch(incident, { assignee })
    if (incident.assignee?.id !== assignee?.id) {
      recordActivity({
        type: 'assignee_changed',
        incidentId: incident.id,
        actor: CURRENT_USER,
        createdAt: updated.updatedAt,
        from: incident.assignee,
        to: assignee,
      })
    }
    return HttpResponse.json(sortedNotes(updated))
  }),

  http.post('/api/incidents/:incidentId/notes', async ({ request, params }) => {
    const simulated = await simulateNetwork(request)
    if (simulated) return simulated
    const incident = findIncident(String(params.incidentId))
    if (!incident) return notFound()

    const parsed = addNoteInputSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return validationError(z.flattenError(parsed.error).fieldErrors, 'The note is invalid.')
    }

    const note: IncidentNote = {
      id: nextNoteId(),
      incidentId: incident.id,
      author: CURRENT_USER,
      message: parsed.data.message,
      createdAt: new Date().toISOString(),
    }
    touch(incident, { notes: [...incident.notes, note] })
    recordActivity({
      type: 'note_added',
      incidentId: incident.id,
      actor: CURRENT_USER,
      createdAt: note.createdAt,
      noteId: note.id,
      excerpt: excerpt(note.message),
    })
    return HttpResponse.json(note, { status: 201 })
  }),

  http.get('/api/users', async ({ request }) => {
    const simulated = await simulateNetwork(request)
    if (simulated) return simulated
    return HttpResponse.json({ items: USERS })
  }),

  http.get('/api/services', async ({ request }) => {
    const simulated = await simulateNetwork(request)
    if (simulated) return simulated
    return HttpResponse.json({ items: SERVICES })
  }),
]
