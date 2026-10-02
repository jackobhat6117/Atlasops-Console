import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  SEVERITY_RANK,
  SORT_FIELDS,
  type Incident,
  type IncidentSeverity,
  type IncidentStatus,
  type SortField,
  type SortOrder,
} from '../features/incidents/schemas'

// Pure search/filter/sort/paginate logic behind GET /api/incidents.
// Unknown or malformed query values are ignored instead of rejected, so a
// hand-edited URL can never break the list.

export const DEFAULT_PAGE_SIZE = 25
export const MAX_PAGE_SIZE = 100
const MAX_QUERY_LENGTH = 200

export interface IncidentQuery {
  q: string
  status: IncidentStatus[]
  severity: IncidentSeverity[]
  service: string[]
  sort: SortField
  order: SortOrder
  page: number
  pageSize: number
}

function parseList<T extends string>(raw: string | null, allowed?: readonly T[]): T[] {
  if (!raw) return []
  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const unique = Array.from(new Set(values))
  return (allowed ? unique.filter((value) => allowed.includes(value as T)) : unique) as T[]
}

function parsePositiveInt(raw: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER) {
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1) return fallback
  return Math.min(value, max)
}

export function parseIncidentQuery(params: URLSearchParams): IncidentQuery {
  const sort = params.get('sort')
  return {
    q: (params.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH),
    status: parseList(params.get('status'), INCIDENT_STATUSES),
    severity: parseList(params.get('severity'), INCIDENT_SEVERITIES),
    service: parseList(params.get('service')),
    sort: SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : 'updatedAt',
    order: params.get('order') === 'asc' ? 'asc' : 'desc',
    page: parsePositiveInt(params.get('page'), 1),
    pageSize: parsePositiveInt(params.get('pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  }
}

function matchesSearch(incident: Incident, q: string) {
  if (!q) return true
  const needle = q.toLowerCase()
  return (
    incident.id.toLowerCase().includes(needle) ||
    incident.title.toLowerCase().includes(needle) ||
    incident.service.toLowerCase().includes(needle) ||
    (incident.assignee?.name.toLowerCase().includes(needle) ?? false)
  )
}

function incidentNumber(id: string) {
  return Number(id.replace(/\D/g, '')) || 0
}

function compareBy(sort: SortField) {
  return (a: Incident, b: Incident) => {
    switch (sort) {
      case 'severity':
        return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
      case 'createdAt':
        return a.createdAt.localeCompare(b.createdAt)
      case 'updatedAt':
        return a.updatedAt.localeCompare(b.updatedAt)
    }
  }
}

export function queryIncidents(all: Incident[], query: IncidentQuery) {
  const filtered = all.filter(
    (incident) =>
      (query.status.length === 0 || query.status.includes(incident.status)) &&
      (query.severity.length === 0 || query.severity.includes(incident.severity)) &&
      (query.service.length === 0 || query.service.includes(incident.service)) &&
      matchesSearch(incident, query.q),
  )

  const direction = query.order === 'asc' ? 1 : -1
  const compare = compareBy(query.sort)
  // Tie-break on the incident number so the order is total and stable:
  // records can never appear on two pages or be skipped between pages.
  filtered.sort(
    (a, b) =>
      direction * compare(a, b) || direction * (incidentNumber(a.id) - incidentNumber(b.id)),
  )

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
  const start = (query.page - 1) * query.pageSize
  // List items omit notes to keep the payload small; the detail endpoint returns them.
  const items = filtered
    .slice(start, start + query.pageSize)
    .map((incident) => ({ ...incident, notes: [] }))

  return { items, page: query.page, pageSize: query.pageSize, total, totalPages }
}
