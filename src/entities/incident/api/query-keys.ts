import { serializeIncidentListParams, type IncidentListParams } from '../model/list-params'

/**
 * Hierarchical keys so invalidation can be broad or narrow:
 *   ['incidents']                        everything
 *   ['incidents', 'list']                every list page/filter combination
 *   ['incidents', 'list', '<canonical>'] one list
 *   ['incidents', 'detail', id]          one incident
 *   ['incidents', 'detail', id, 'activity'] its audit history (refreshed with the detail)
 * List keys use the canonical query string, so `status=a,b` and `status=b,a`
 * share a cache entry.
 */
export const incidentKeys = {
  all: ['incidents'] as const,
  lists: () => [...incidentKeys.all, 'list'] as const,
  list: (params: IncidentListParams) =>
    [...incidentKeys.lists(), serializeIncidentListParams(params).toString()] as const,
  details: () => [...incidentKeys.all, 'detail'] as const,
  detail: (id: string) => [...incidentKeys.details(), id] as const,
  activity: (id: string) => [...incidentKeys.detail(id), 'activity'] as const,
}

/**
 * Change polling lives outside `incidentKeys.all` on purpose: mutations invalidate that whole tree,
 * and a user's own edit must not make the "someone else changed this view" notice flash.
 * The timestamp is part of the key, so refreshing the list (a newer timestamp) starts a clean count.
 */
export const incidentChangeKeys = {
  since: (params: IncidentListParams, since: number) =>
    ['incident-changes', serializeIncidentListParams(params).toString(), since] as const,
}
