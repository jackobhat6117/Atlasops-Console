import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardKeys } from '@/entities/dashboard'
import { assignIncident, incidentKeys } from '@/entities/incident'
import { getErrorMessage } from '@/shared/api'
import { notify } from '@/shared/model'

/**
 * Pessimistic on purpose: the UI shows progress and applies the server's
 * response, which is the full updated incident. Status changes cover the
 * optimistic requirement; assignment is less frequent and depends on
 * server-side user validation.
 */
export function useAssignIncident(incidentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['incidents', incidentId, 'assignee'],
    scope: { id: `incident:${incidentId}` },
    mutationFn: (assigneeId: string | null) => assignIncident(incidentId, assigneeId),

    onSuccess: (incident) => {
      queryClient.setQueryData(incidentKeys.detail(incidentId), incident)
      notify.success(
        incident.assignee
          ? `${incidentId} assigned to ${incident.assignee.name}.`
          : `${incidentId} is now unassigned.`,
      )
      // Background reconcile; not awaited so the mutation settles as soon as the server confirms.
      void queryClient.invalidateQueries({ queryKey: incidentKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: incidentKeys.activity(incidentId) })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },

    onError: (error) => {
      notify.error(`Couldn't change the assignee of ${incidentId}. ${getErrorMessage(error)}`)
    },
  })
}
