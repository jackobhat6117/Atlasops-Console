import { z } from 'zod'
import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  createIncidentInputSchema,
  type CreateIncidentInput,
} from '@/entities/incident'

export const createIncidentFormSchema = createIncidentInputSchema.extend({
  severity: z.enum(INCIDENT_SEVERITIES, { error: 'Select a severity.' }),
  status: z.enum(INCIDENT_STATUSES, { error: 'Select an initial status.' }),
  service: z.string().min(1, 'Select the affected service.'),
  assigneeId: z.string(),
})

export type CreateIncidentFormInput = z.input<typeof createIncidentFormSchema>
export type CreateIncidentFormValues = z.output<typeof createIncidentFormSchema>

export const CREATE_INCIDENT_FIELDS = ['title', 'description', 'severity', 'service', 'status', 'assigneeId'] as const
export type CreateIncidentField = (typeof CREATE_INCIDENT_FIELDS)[number]

export function toCreateIncidentInput(values: CreateIncidentFormValues): CreateIncidentInput {
  return { ...values, assigneeId: values.assigneeId || null }
}
