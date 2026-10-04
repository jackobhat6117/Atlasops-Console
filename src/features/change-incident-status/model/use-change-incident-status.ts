import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardKeys } from '@/entities/dashboard'
import {
  STATUS_LABELS,
  incidentKeys,
  patchIncidentInCache,
  restoreIncidentCache,
  snapshotIncidentCache,
  updateIncidentStatus,
  type Incident,
  type IncidentStatus,
} from '@/entities/incident'
import { getErrorMessage, isApiError } from '@/shared/api'
import { notify } from '@/shared/model'

/**
 * Optimistic status change:
 * 1. onMutate: cancel in-flight incident queries (so a late response can't
 *    overwrite the optimistic value), snapshot the cache, and apply the new
 *    status to the detail and every cached list page.
 * 2. onError: revert only this incident's status fields (guarded against newer data) and
 *    announce a useful error. The full snapshot is a fallback when no detail was cached.
 * 3. onSettled: invalidate so the cache reconciles with the server either way.
 *
 * The incident's `version` is sent so a concurrent edit returns 409 instead
 * of silently overwriting. Mutations for one incident share a scope, so they
 * run one at a time, in order.
 */
export function useChangeIncidentStatus(incidentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['incidents', incidentId, 'status'],
    scope: { id: `incident:${incidentId}` },

    mutationFn: (status: IncidentStatus) => {
      const version = queryClient.getQueryData<Incident>(incidentKeys.detail(incidentId))?.version
      return updateIncidentStatus(incidentId, { status, version })
    },

    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: incidentKeys.all })
      const current = queryClient.getQueryData<Incident>(incidentKeys.detail(incidentId))
      const previous = current && { status: current.status, updatedAt: current.updatedAt, version: current.version }
      const snapshot = snapshotIncidentCache(queryClient)
      patchIncidentInCache(queryClient, incidentId, { status })
      return { previous, snapshot }
    },

    onError: (error, status, context) => {
      if (context?.previous) {
        // Revert only this incident's status fields, and only if nothing newer replaced the
        // optimistic value, so a queued change or a fresher server response isn't overwritten.
        const cached = queryClient.getQueryData<Incident>(incidentKeys.detail(incidentId))
        if (cached?.status === status) patchIncidentInCache(queryClient, incidentId, context.previous)
      } else if (context) {
        restoreIncidentCache(queryClient, context.snapshot)
      }
      notify.error(
        isApiError(error) && error.isConflict
          ? getErrorMessage(error)
          : `Couldn't update the status of ${incidentId}. ${getErrorMessage(error)}`,
      )
    },

    onSuccess: (result) => {
      patchIncidentInCache(queryClient, incidentId, {
        status: result.status,
        updatedAt: result.updatedAt,
        version: result.version,
      })
      notify.success(`${incidentId} is now ${STATUS_LABELS[result.status]}.`)
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
  })
}
