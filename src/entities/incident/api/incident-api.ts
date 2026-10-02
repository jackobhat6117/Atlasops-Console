import { request } from '@/shared/api'
import { serializeIncidentListParams, type IncidentListParams } from '../model/list-params'
import {
  incidentListResponseSchema,
  incidentNoteSchema,
  incidentSchema,
  statusUpdateResponseSchema,
  type CreateIncidentInput,
  type UpdateStatusInput,
} from '../model/schemas'

export function fetchIncidents(params: IncidentListParams, signal?: AbortSignal) {
  // Always send page and pageSize explicitly so the request doesn't depend on server defaults.
  const search = serializeIncidentListParams(params)
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  return request(`/incidents?${search}`, { schema: incidentListResponseSchema, signal })
}

export function fetchIncident(id: string, signal?: AbortSignal) {
  return request(`/incidents/${encodeURIComponent(id)}`, { schema: incidentSchema, signal })
}

export function createIncident(input: CreateIncidentInput) {
  return request('/incidents', { method: 'POST', body: input, schema: incidentSchema })
}

export function updateIncidentStatus(id: string, input: UpdateStatusInput) {
  return request(`/incidents/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: input,
    schema: statusUpdateResponseSchema,
  })
}

export function assignIncident(id: string, assigneeId: string | null) {
  return request(`/incidents/${encodeURIComponent(id)}/assignee`, {
    method: 'PATCH',
    body: { assigneeId },
    schema: incidentSchema,
  })
}

export function addIncidentNote(id: string, message: string) {
  return request(`/incidents/${encodeURIComponent(id)}/notes`, {
    method: 'POST',
    body: { message },
    schema: incidentNoteSchema,
  })
}
