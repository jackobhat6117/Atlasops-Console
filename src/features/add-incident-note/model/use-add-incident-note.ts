import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardKeys } from '@/entities/dashboard'
import { addIncidentNote, incidentKeys, type Incident } from '@/entities/incident'
import { getErrorMessage } from '@/shared/api'
import { notify } from '@/shared/model'

/**
 * Not optimistic: the note form keeps the user's text until the server
 * confirms, so a failed submission never loses what they typed. Call it with
 * `mutateAsync` and clear the form only after it resolves.
 */
export function useAddIncidentNote(incidentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['incidents', incidentId, 'notes'],
    scope: { id: `incident:${incidentId}` },
    mutationFn: (message: string) => addIncidentNote(incidentId, message.trim()),

    onSuccess: (note) => {
      // Append immediately (oldest-first order), then reconcile updatedAt/version from the server.
      queryClient.setQueryData<Incident>(incidentKeys.detail(incidentId), (incident) =>
        incident && !incident.notes.some((existing) => existing.id === note.id)
          ? { ...incident, notes: [...incident.notes, note] }
          : incident,
      )
      notify.success('Note added.')
      // Background reconcile; not awaited so the mutation settles as soon as the server confirms.
      void queryClient.invalidateQueries({ queryKey: incidentKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },

    onError: (error) => {
      notify.error(`Couldn't add the note. ${getErrorMessage(error)}`)
    },
  })
}
