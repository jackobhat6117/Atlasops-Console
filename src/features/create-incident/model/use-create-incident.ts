import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardKeys } from '@/entities/dashboard'
import { createIncident, incidentKeys, type CreateIncidentInput } from '@/entities/incident'
import { notify } from '@/shared/model'

/**
 * Seeds the new incident's detail cache, so navigating to it renders instantly,
 * and invalidates all lists so it shows up in them.
 *
 * Errors are not toasted here: the form shows server field errors next to the
 * fields and a summary, using `error.fieldErrors` from the ApiError.
 */
export function useCreateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['incidents', 'create'],
    mutationFn: (input: CreateIncidentInput) => createIncident(input),

    onSuccess: (incident) => {
      queryClient.setQueryData(incidentKeys.detail(incident.id), incident)
      notify.success(`Created ${incident.id}.`)
      // Background reconcile; not awaited so the mutation settles as soon as the server confirms.
      void queryClient.invalidateQueries({ queryKey: incidentKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
  })
}
