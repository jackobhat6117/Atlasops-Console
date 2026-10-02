import { describe, expect, it } from 'vitest'
import { DEFAULT_LIST_PARAMS, parseIncidentListParams, serializeIncidentListParams } from './list-params'

const parse = (query: string) => parseIncidentListParams(new URLSearchParams(query))

describe('parseIncidentListParams', () => {
  it('returns defaults for an empty URL', () => {
    expect(parse('')).toEqual(DEFAULT_LIST_PARAMS)
  })

  it('parses valid values', () => {
    expect(
      parse('q=db&status=resolved,triggered&severity=high&service=payments-api&sort=severity&order=asc&page=3&pageSize=50'),
    ).toEqual({
      q: 'db',
      status: ['triggered', 'resolved'],
      severity: ['high'],
      service: ['payments-api'],
      unassigned: false,
      sort: 'severity',
      order: 'asc',
      page: 3,
      pageSize: 50,
    })
  })

  it('drops invalid and hostile values instead of throwing', () => {
    expect(
      parse('status=nope,triggered&severity=<script>&service=<img src=x>,ok-svc&sort=__proto__&order=up&page=-1&pageSize=1e9'),
    ).toEqual({
      ...DEFAULT_LIST_PARAMS,
      status: ['triggered'],
      service: ['ok-svc'],
    })
    expect(parse('page=2.5&pageSize=5000')).toMatchObject({ page: 1, pageSize: 100 })
    expect(parse(`q=${'a'.repeat(500)}`).q).toHaveLength(200)
    expect(parse('unassigned=1').unassigned).toBe(true)
    expect(parse('unassigned=true').unassigned).toBe(false)
  })
})

describe('serializeIncidentListParams', () => {
  it('omits defaults', () => {
    expect(serializeIncidentListParams(DEFAULT_LIST_PARAMS).toString()).toBe('')
  })

  it('is canonical: equivalent params produce the same string', () => {
    const a = serializeIncidentListParams({ ...DEFAULT_LIST_PARAMS, status: ['resolved', 'triggered'] })
    const b = serializeIncidentListParams({ ...DEFAULT_LIST_PARAMS, status: ['triggered', 'resolved'] })
    expect(a.toString()).toBe(b.toString())
  })

  it('round-trips through parse', () => {
    const params = { ...DEFAULT_LIST_PARAMS, q: 'latency', severity: ['critical' as const], page: 4 }
    expect(parseIncidentListParams(serializeIncidentListParams(params))).toEqual(params)
  })
})
