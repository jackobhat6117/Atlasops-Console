import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { IncidentListParams } from '../model/list-params'
import { fetchIncident, fetchIncidentActivity, fetchIncidentChanges, fetchIncidents } from './incident-api'
import { incidentChangeKeys, incidentKeys } from './query-keys'

/** How often to ask whether the visible list is out of date. Pauses in background tabs and offline. */
export const CHANGE_POLL_INTERVAL_MS = 15_000

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

/**
 * Number of incidents matching the list's filters that changed after `since` (epoch ms),
 * e.g. the moment the list was loaded. Pass `null` while there is nothing loaded to compare with.
 * Errors are deliberately ignored: this is a hint, and the list has its own error handling.
 */
export function useIncidentChanges(params: IncidentListParams, since: number | null) {
  const query = useQuery({
    queryKey: incidentChangeKeys.since(params, since ?? 0),
    queryFn: ({ signal }) => fetchIncidentChanges(params, since ?? 0, signal),
    enabled: since !== null,
    refetchInterval: CHANGE_POLL_INTERVAL_MS,
    // Always ask the server: a cached answer would defeat the point of polling.
    staleTime: 0,
  })
  return since === null ? 0 : (query.data?.count ?? 0)
}
