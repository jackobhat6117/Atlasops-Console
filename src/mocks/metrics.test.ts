import { describe, expect, it } from 'vitest'
import type { Incident, IncidentActivity } from '@/entities/incident'
import { computeResponseMetrics, parseWindowDays, percentile, summarizeDurations } from './metrics'

const NOW = Date.parse('2026-10-04T12:00:00.000Z')
const MIN = 60_000
const user = { id: 'usr-1', name: 'Maya Chen', email: 'maya@example.com' }
const iso = (ms: number) => new Date(ms).toISOString()

function incident(id: string, createdMs: number, severity: Incident['severity'] = 'critical'): Incident {
  return {
    id,
    title: 'Elevated error rate on payments',
    description: 'The 5xx error rate has exceeded the alert threshold.',
    status: 'triggered',
    severity,
    service: 'payments-api',
    assignee: null,
    createdAt: iso(createdMs),
    updatedAt: iso(createdMs),
    notes: [],
    version: 1,
  }
}

let n = 0
const created = (inc: Incident, status: Incident['status'] = 'triggered'): IncidentActivity => ({
  id: `a${n++}`,
  incidentId: inc.id,
  actor: user,
  createdAt: inc.createdAt,
  type: 'created',
  severity: inc.severity,
  status,
  service: inc.service,
  assignee: null,
})
const changed = (inc: Incident, atMs: number, from: Incident['status'], to: Incident['status']): IncidentActivity => ({
  id: `a${n++}`,
  incidentId: inc.id,
  actor: user,
  createdAt: iso(atMs),
  type: 'status_changed',
  from,
  to,
})

describe('percentile (nearest rank)', () => {
  it('handles empty, single and typical lists', () => {
    expect(percentile([], 50)).toBeNull()
    expect(percentile([7], 90)).toBe(7)
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    expect(percentile(values, 50)).toBe(5)
    expect(percentile(values, 90)).toBe(9)
  })

  it('the median resists one outlier where the mean does not', () => {
    const stats = summarizeDurations([5, 6, 7, 8, 10_000].map((m) => m * MIN))
    expect(stats.medianMs).toBe(7 * MIN)
    expect(stats.meanMs).toBeGreaterThan(2000 * MIN)
  })
})

describe('computeResponseMetrics', () => {
  it('measures acknowledge from the first move out of triggered, and resolve from the first resolution', () => {
    const a = incident('INC-1', NOW - 10 * 60 * MIN)
    const createdMs = Date.parse(a.createdAt)
    const activity = [
      created(a),
      changed(a, createdMs + 5 * MIN, 'triggered', 'investigating'), 
      changed(a, createdMs + 120 * MIN, 'investigating', 'resolved'),
      changed(a, createdMs + 180 * MIN, 'resolved', 'investigating'), 
      changed(a, createdMs + 300 * MIN, 'investigating', 'resolved'), 
    ]
    const m = computeResponseMetrics([a], activity, { now: NOW })
    const critical = m.bySeverity.find((row) => row.severity === 'critical')!
    expect(critical.acknowledge.medianMs).toBe(5 * MIN)
    expect(critical.resolve.medianMs).toBe(120 * MIN)
    expect(m.overall.incidents).toBe(1)
  })

  it('counts open incidents in the population without inventing durations', () => {
    const open = incident('INC-2', NOW - 30 * MIN, 'low')
    const m = computeResponseMetrics([open], [created(open)], { now: NOW })
    const low = m.bySeverity.find((row) => row.severity === 'low')!
    expect(low.incidents).toBe(1)
    expect(low.acknowledge).toMatchObject({ count: 0, medianMs: null })
  })

  it('excludes incidents outside the window, and ones that were not created as triggered', () => {
    const old = incident('INC-3', NOW - 40 * 24 * 60 * MIN)
    const backfilled = incident('INC-4', NOW - 60 * MIN)
    const m = computeResponseMetrics([old, backfilled], [created(old), created(backfilled, 'resolved')], {
      now: NOW,
      days: 30,
    })
    expect(m.overall.incidents).toBe(0)
  })

  it('builds a 14-day created/resolved trend ending today', () => {
    const today = incident('INC-5', NOW - 60 * MIN)
    const m = computeResponseMetrics([today], [created(today), changed(today, NOW - 10 * MIN, 'triggered', 'resolved')], {
      now: NOW,
    })
    expect(m.daily).toHaveLength(14)
    expect(m.daily.at(-1)).toEqual({ date: '2026-10-04', created: 1, resolved: 1 })
  })

  it('clamps the window from the query string', () => {
    expect(parseWindowDays(null)).toBe(30)
    expect(parseWindowDays('7')).toBe(7)
    expect(parseWindowDays('-1')).toBe(30)
    expect(parseWindowDays('abc')).toBe(30)
    expect(parseWindowDays('365')).toBe(90)
  })
})
