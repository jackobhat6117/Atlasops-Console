import { z } from 'zod'
import { incidentSchema, incidentStatusSchema } from '@/entities/incident/@x/dashboard'

const countSchema = z.number().int().nonnegative()

export const dashboardSummarySchema = z.object({
  generatedAt: z.string(),
  totals: z.object({
    incidents: countSchema,
    open: countSchema,
    critical: countSchema,
    unassigned: countSchema,
    triggered: countSchema,
  }),
  byStatus: z.array(z.object({ status: incidentStatusSchema, count: countSchema })),
  services: z.array(
    z.object({
      service: z.string(),
      open: countSchema,
      critical: countSchema,
    }),
  ),
  /** Unresolved incidents, most severe and unowned first. */
  attention: z.array(incidentSchema),
})

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>
