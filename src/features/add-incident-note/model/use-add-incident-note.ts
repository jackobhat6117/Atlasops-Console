import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardKeys } from '@/entities/dashboard'
import { addIncidentNote, incidentKeys, type Incident } from '@/entities/incident'
import { getErrorMessage } from '@/shared/api'
import { notify } from '@/shared/model'


export function useAddIncidentNote(incidentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['incidents', incidentId, 'notes'],
    scope: { id: `incident:${incidentId}` },
    mutationFn: (message: string) => addIncidentNote(incidentId, message.trim()),

    onSuccess: (note) => {
    
      queryClient.setQueryData<Incident>(incidentKeys.detail(incidentId), (incident) =>
        incident && !incident.notes.some((existing) => existing.id === note.id)
          ? { ...incident, notes: [...incident.notes, note] }
          : incident,
      )
      notify.success('Note added.')
   
      void queryClient.invalidateQueries({ queryKey: incidentKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },

    onError: (error) => {
      notify.error(`Couldn't add the note. ${getErrorMessage(error)}`)
    },
  })
}
