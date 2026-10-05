import {
  SEVERITY_RANK,
  type Incident,
  type IncidentListParams,
  type SortField,
} from '@/entities/incident'



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

function matchesFilters(incident: Incident, query: IncidentListParams) {
  return (
    (query.status.length === 0 || query.status.includes(incident.status)) &&
    (query.severity.length === 0 || query.severity.includes(incident.severity)) &&
    (query.service.length === 0 || query.service.includes(incident.service)) &&
    (!query.unassigned || incident.assignee === null) &&
    matchesSearch(incident, query.q)
  )
}

/** How many incidents matching the list filters were created or updated after `since` (epoch ms). */
export function countChangedSince(all: Incident[], query: IncidentListParams, since: number) {
  return all.filter((incident) => matchesFilters(incident, query) && Date.parse(incident.updatedAt) > since).length
}

export function queryIncidents(all: Incident[], query: IncidentListParams) {
  const filtered = all.filter((incident) => matchesFilters(incident, query))

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
