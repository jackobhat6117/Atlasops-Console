import { z } from 'zod'
import { userSummarySchema } from '@/entities/user/@x/incident'

// Single source of truth for the incident model (REQUIREMENTS §3).
// Used to validate API responses, the create form, and mock API request bodies.

export const INCIDENT_STATUSES = ['triggered', 'acknowledged', 'investigating', 'resolved'] as const
export const INCIDENT_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const

export const incidentStatusSchema = z.enum(INCIDENT_STATUSES)
export const incidentSeveritySchema = z.enum(INCIDENT_SEVERITIES)

export const incidentNoteSchema = z.object({
  id: z.string(),
  incidentId: z.string(),
  author: userSummarySchema,
  message: z.string(),
  createdAt: z.string(),
})

export const incidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: incidentStatusSchema,
  severity: incidentSeveritySchema,
  service: z.string(),
  assignee: userSummarySchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  notes: z.array(incidentNoteSchema),
  // Extension to the required model: optimistic-concurrency version, bumped on every change.
  version: z.number().int(),
})

export const incidentListResponseSchema = z.object({
  items: z.array(incidentSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
})

/** GET /api/incidents/changes: how many incidents in a filtered view changed after a point in time. */
export const incidentChangesSchema = z.object({ count: z.number().int().nonnegative() })

export const statusUpdateResponseSchema = z.object({
  id: z.string(),
  status: incidentStatusSchema,
  updatedAt: z.string(),
  version: z.number().int(),
})

export const TITLE_MIN = 5
export const TITLE_MAX = 120
export const DESCRIPTION_MIN = 20
export const DESCRIPTION_MAX = 2000
export const NOTE_MAX = 2000

export const createIncidentInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN, `Title must contain at least ${TITLE_MIN} characters.`)
    .max(TITLE_MAX, `Title must contain at most ${TITLE_MAX} characters.`),
  description: z
    .string()
    .trim()
    .min(DESCRIPTION_MIN, `Description must contain at least ${DESCRIPTION_MIN} characters.`)
    .max(DESCRIPTION_MAX, `Description must contain at most ${DESCRIPTION_MAX} characters.`),
  severity: incidentSeveritySchema,
  service: z.string().min(1, 'Select a service.'),
  assigneeId: z.string().nullable().optional(),
  status: incidentStatusSchema,
})

export const updateStatusInputSchema = z.object({
  status: incidentStatusSchema,
  version: z.number().int().optional(),
})

export const assignInputSchema = z.object({
  assigneeId: z.string().nullable(),
})

export const addNoteInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Note cannot be empty.')
    .max(NOTE_MAX, `Note must contain at most ${NOTE_MAX} characters.`),
})

export type IncidentStatus = z.infer<typeof incidentStatusSchema>
export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>
export type IncidentNote = z.infer<typeof incidentNoteSchema>
export type Incident = z.infer<typeof incidentSchema>
export type IncidentChanges = z.infer<typeof incidentChangesSchema>
export type IncidentListResponse = z.infer<typeof incidentListResponseSchema>
export type StatusUpdateResponse = z.infer<typeof statusUpdateResponseSchema>
export type CreateIncidentInput = z.infer<typeof createIncidentInputSchema>
export type UpdateStatusInput = z.infer<typeof updateStatusInputSchema>
export type AssignInput = z.infer<typeof assignInputSchema>
export type AddNoteInput = z.infer<typeof addNoteInputSchema>
