import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { Incident, IncidentListResponse } from '../model/schemas'
import { incidentKeys } from './query-keys'

export type IncidentCacheSnapshot = Array<[QueryKey, unknown]>

/** Capture every cached incident list and detail so a failed mutation can roll back. */
export function snapshotIncidentCache(queryClient: QueryClient): IncidentCacheSnapshot {
  return queryClient.getQueriesData({ queryKey: incidentKeys.all })
}

export function restoreIncidentCache(queryClient: QueryClient, snapshot: IncidentCacheSnapshot) {
  for (const [key, data] of snapshot) queryClient.setQueryData(key, data)
}

/** Apply the same change to an incident's detail entry and to every list page that contains it. */
export function patchIncidentInCache(
  queryClient: QueryClient,
  id: string,
  changes: Partial<Omit<Incident, 'id' | 'notes'>>,
) {
  queryClient.setQueryData<Incident>(incidentKeys.detail(id), (incident) =>
    incident ? { ...incident, ...changes } : incident,
  )
  queryClient.setQueriesData<IncidentListResponse>({ queryKey: incidentKeys.lists() }, (list) =>
    list
      ? { ...list, items: list.items.map((item) => (item.id === id ? { ...item, ...changes } : item)) }
      : list,
  )
}
