import { z } from 'zod'
import { userSummarySchema } from '@/entities/user/@x/incident'
import { incidentSeveritySchema, incidentStatusSchema } from './schemas'

// Audit history: one server-recorded entry per change to an incident.
// A discriminated union, so each entry type carries exactly the data it needs.

const activityBase = {
  id: z.string(),
  incidentId: z.string(),
  actor: userSummarySchema,
  createdAt: z.string(),
}

export const incidentActivitySchema = z.discriminatedUnion('type', [
  z.object({
    ...activityBase,
    type: z.literal('created'),
    severity: incidentSeveritySchema,
    status: incidentStatusSchema,
    service: z.string(),
    assignee: userSummarySchema.nullable(),
  }),
  z.object({
    ...activityBase,
    type: z.literal('status_changed'),
    from: incidentStatusSchema,
    to: incidentStatusSchema,
  }),
  z.object({
    ...activityBase,
    type: z.literal('assignee_changed'),
    from: userSummarySchema.nullable(),
    to: userSummarySchema.nullable(),
  }),
  z.object({
    ...activityBase,
    type: z.literal('note_added'),
    noteId: z.string(),
    excerpt: z.string(),
  }),
])

/** Newest first. */
export const incidentActivityListSchema = z.object({
  items: z.array(incidentActivitySchema),
})

export type IncidentActivity = z.infer<typeof incidentActivitySchema>
export type IncidentActivityType = IncidentActivity['type']

/** Excerpt length stored with note entries. The full note lives in the notes timeline. */
export const ACTIVITY_EXCERPT_MAX = 140
