import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { IncidentListParams } from '../model/list-params'
import { fetchIncident, fetchIncidentActivity, fetchIncidents } from './incident-api'
import { incidentKeys } from './query-keys'

/**
 * One cache entry per canonical param set. TanStack passes an AbortSignal that
 * fires when the key changes, so an older search can never overwrite a newer one.
 * The previous page stays on screen while the next one loads (`isPlaceholderData`).
 */
export function useIncidentList(params: IncidentListParams) {
  return useQuery({
    queryKey: incidentKeys.list(params),
    queryFn: ({ signal }) => fetchIncidents(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: ({ signal }) => fetchIncident(id, signal),
  })
}

/** Audit history, newest first. Nested under the detail key, so invalidating an incident refreshes it too. */
export function useIncidentActivity(id: string) {
  return useQuery({
    queryKey: incidentKeys.activity(id),
    queryFn: ({ signal }) => fetchIncidentActivity(id, signal),
  })
}
