import { z } from 'zod'
import { incidentSeveritySchema } from '@/entities/incident/@x/dashboard'

const durationMs = z.number().int().nonnegative().nullable()

/** Median / p90 / mean of a set of durations. Null when nothing has been measured yet. */
export const durationStatsSchema = z.object({
  count: z.number().int().nonnegative(),
  medianMs: durationMs,
  p90Ms: durationMs,
  meanMs: durationMs,
})

/**
 * Response-time metrics (GET /api/metrics/response). Definitions:
 * - acknowledge: created → first move out of "triggered" (the MTTA family)
 * - resolve: created → first "resolved" (the MTTR family)
 * - for incidents created in the window that started as "triggered"
 */
export const responseMetricsSchema = z.object({
  generatedAt: z.string(),
  window: z.object({ days: z.number().int().positive(), from: z.string(), to: z.string() }),
  overall: z.object({
    incidents: z.number().int().nonnegative(),
    acknowledge: durationStatsSchema,
    resolve: durationStatsSchema,
  }),
  bySeverity: z.array(
    z.object({
      severity: incidentSeveritySchema,
      incidents: z.number().int().nonnegative(),
      acknowledge: durationStatsSchema,
      resolve: durationStatsSchema,
    }),
  ),
  /** Created vs resolved per UTC day, oldest first. */
  daily: z.array(
    z.object({
      date: z.string(),
      created: z.number().int().nonnegative(),
      resolved: z.number().int().nonnegative(),
    }),
  ),
})

export type DurationStats = z.infer<typeof durationStatsSchema>
export type ResponseMetrics = z.infer<typeof responseMetricsSchema>
