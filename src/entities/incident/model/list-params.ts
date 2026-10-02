import { INCIDENT_SEVERITIES, INCIDENT_STATUSES, type IncidentSeverity, type IncidentStatus } from './schemas'

// List state lives in the URL. This module is the only place that converts
// between URLSearchParams and typed params. It is shared by the UI and the mock
// API so both sides sanitize identically. URL input is untrusted: unknown
// values are dropped and numbers are clamped, never thrown on.

export const SORT_FIELDS = ['updatedAt', 'createdAt', 'severity'] as const
export type SortField = (typeof SORT_FIELDS)[number]
export type SortOrder = 'asc' | 'desc'

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const
export const MAX_PAGE_SIZE = 100
const MAX_QUERY_LENGTH = 200
const MAX_SERVICES = 20
const SERVICE_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/i

export interface IncidentListParams {
  q: string
  status: IncidentStatus[]
  severity: IncidentSeverity[]
  service: string[]
  sort: SortField
  order: SortOrder
  page: number
  pageSize: number
}

export const DEFAULT_LIST_PARAMS: IncidentListParams = {
  q: '',
  status: [],
  severity: [],
  service: [],
  sort: 'updatedAt',
  order: 'desc',
  page: 1,
  pageSize: 25,
}

/** Keeps allowed values in a fixed order so equivalent URLs share one cache key. */
function parseEnumList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  const values = new Set((raw ?? '').split(',').map((value) => value.trim()))
  return allowed.filter((value) => values.has(value))
}

function parseServiceList(raw: string | null): string[] {
  const values = (raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => SERVICE_PATTERN.test(value))
  return Array.from(new Set(values)).sort().slice(0, MAX_SERVICES)
}

function parsePositiveInt(raw: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER) {
  if (raw === null || !/^\d+$/.test(raw)) return fallback
  const value = Number(raw)
  return value < 1 ? fallback : Math.min(value, max)
}

export function parseIncidentListParams(search: URLSearchParams): IncidentListParams {
  const sort = search.get('sort')
  return {
    q: (search.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH),
    status: parseEnumList(search.get('status'), INCIDENT_STATUSES),
    severity: parseEnumList(search.get('severity'), INCIDENT_SEVERITIES),
    service: parseServiceList(search.get('service')),
    sort: SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : DEFAULT_LIST_PARAMS.sort,
    order: search.get('order') === 'asc' ? 'asc' : 'desc',
    page: parsePositiveInt(search.get('page'), DEFAULT_LIST_PARAMS.page),
    pageSize: parsePositiveInt(search.get('pageSize'), DEFAULT_LIST_PARAMS.pageSize, MAX_PAGE_SIZE),
  }
}

/** Canonical query string: defaults omitted, lists in a stable order. */
export function serializeIncidentListParams(params: IncidentListParams): URLSearchParams {
  const normalized = parseIncidentListParams(toRawSearchParams(params))
  const search = new URLSearchParams()
  if (normalized.q) search.set('q', normalized.q)
  if (normalized.status.length) search.set('status', normalized.status.join(','))
  if (normalized.severity.length) search.set('severity', normalized.severity.join(','))
  if (normalized.service.length) search.set('service', normalized.service.join(','))
  if (normalized.sort !== DEFAULT_LIST_PARAMS.sort) search.set('sort', normalized.sort)
  if (normalized.order !== DEFAULT_LIST_PARAMS.order) search.set('order', normalized.order)
  if (normalized.page !== DEFAULT_LIST_PARAMS.page) search.set('page', String(normalized.page))
  if (normalized.pageSize !== DEFAULT_LIST_PARAMS.pageSize)
    search.set('pageSize', String(normalized.pageSize))
  return search
}

function toRawSearchParams(params: IncidentListParams) {
  return new URLSearchParams({
    q: params.q,
    status: params.status.join(','),
    severity: params.severity.join(','),
    service: params.service.join(','),
    sort: params.sort,
    order: params.order,
    page: String(params.page),
    pageSize: String(params.pageSize),
  })
}

export function hasActiveFilters(params: IncidentListParams) {
  return (
    params.q !== '' || params.status.length > 0 || params.severity.length > 0 || params.service.length > 0
  )
}
