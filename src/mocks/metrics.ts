import {
  INCIDENT_SEVERITIES,
  type Incident,
  type IncidentActivity,
  type IncidentSeverity,
} from '@/entities/incident'

const DAY_MS = 24 * 60 * 60 * 1000
export const DEFAULT_WINDOW_DAYS = 30
export const MAX_WINDOW_DAYS = 90
export const TREND_DAYS = 14

export interface DurationStats {

  count: number
  medianMs: number | null
  p90Ms: number | null
  meanMs: number | null
}

/** Nearest-rank percentile of an ascending list. */
export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null
  const rank = Math.ceil((p / 100) * sorted.length)
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1]
}

export function summarizeDurations(values: number[]): DurationStats {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    count: sorted.length,
    medianMs: percentile(sorted, 50),
    p90Ms: percentile(sorted, 90),
    meanMs: sorted.length ? Math.round(sorted.reduce((sum, v) => sum + v, 0) / sorted.length) : null,
  }
}

const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export function parseWindowDays(raw: string | null) {
  const value = Number(raw)
  if (raw === null || !Number.isInteger(value) || value < 1) return DEFAULT_WINDOW_DAYS
  return Math.min(value, MAX_WINDOW_DAYS)
}

export function computeResponseMetrics(
  incidents: Incident[],
  activity: IncidentActivity[],
  { now = Date.now(), days = DEFAULT_WINDOW_DAYS } = {},
) {
  const from = now - days * DAY_MS

  const byIncident = new Map<string, IncidentActivity[]>()
  for (const entry of activity) {
    const list = byIncident.get(entry.incidentId)
    if (list) list.push(entry)
    else byIncident.set(entry.incidentId, [entry])
  }

  const acknowledge = new Map<IncidentSeverity, number[]>(INCIDENT_SEVERITIES.map((s) => [s, []]))
  const resolve = new Map<IncidentSeverity, number[]>(INCIDENT_SEVERITIES.map((s) => [s, []]))
  const population = new Map<IncidentSeverity, number>(INCIDENT_SEVERITIES.map((s) => [s, 0]))

  for (const incident of incidents) {
    const createdMs = Date.parse(incident.createdAt)
    if (createdMs < from || createdMs > now) continue
    const events = [...(byIncident.get(incident.id) ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const created = events.find((e) => e.type === 'created')
    if (!created || created.type !== 'created' || created.status !== 'triggered') continue

    population.set(incident.severity, population.get(incident.severity)! + 1)
    const firstResponse = events.find((e) => e.type === 'status_changed' && e.from === 'triggered')
    const firstResolve = events.find((e) => e.type === 'status_changed' && e.to === 'resolved')
    if (firstResponse) acknowledge.get(incident.severity)!.push(Date.parse(firstResponse.createdAt) - createdMs)
    if (firstResolve) resolve.get(incident.severity)!.push(Date.parse(firstResolve.createdAt) - createdMs)
  }

  // Created vs resolved per UTC day, for the last TREND_DAYS days (today included).
  const trendFrom = now - (TREND_DAYS - 1) * DAY_MS
  const daily = Array.from({ length: TREND_DAYS }, (_, i) => ({
    date: dayKey(trendFrom + i * DAY_MS),
    created: 0,
    resolved: 0,
  }))
  const dayIndex = new Map(daily.map((day, i) => [day.date, i]))
  for (const incident of incidents) {
    const i = dayIndex.get(dayKey(Date.parse(incident.createdAt)))
    if (i !== undefined) daily[i].created++
  }
  for (const entry of activity) {
    if (entry.type !== 'status_changed' || entry.to !== 'resolved') continue
    const i = dayIndex.get(dayKey(Date.parse(entry.createdAt)))
    if (i !== undefined) daily[i].resolved++
  }

  return {
    generatedAt: new Date(now).toISOString(),
    window: { days, from: new Date(from).toISOString(), to: new Date(now).toISOString() },
    overall: {
      incidents: Array.from(population.values()).reduce((sum, n) => sum + n, 0),
      acknowledge: summarizeDurations(Array.from(acknowledge.values()).flat()),
      resolve: summarizeDurations(Array.from(resolve.values()).flat()),
    },
    bySeverity: INCIDENT_SEVERITIES.map((severity) => ({
      severity,
      incidents: population.get(severity)!,
      acknowledge: summarizeDurations(acknowledge.get(severity)!),
      resolve: summarizeDurations(resolve.get(severity)!),
    })),
    daily,
  }
}
