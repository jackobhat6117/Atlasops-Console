import {
  DEFAULT_LIST_PARAMS,
  parseIncidentListParams,
  serializeIncidentListParams,
  type IncidentListParams,
} from '@/entities/incident'
import { paths } from '@/shared/config'

/** Filters-only query string, so paging and sorting never change which view is "current". */
function filterSearch(params: Partial<IncidentListParams>) {
  const { status, severity, service, unassigned, q } = { ...DEFAULT_LIST_PARAMS, ...params }
  return serializeIncidentListParams({
    ...DEFAULT_LIST_PARAMS,
    status,
    severity,
    service,
    unassigned,
    q,
  }).toString()
}

export type QuickViewCount = 'critical' | 'unassigned' | 'triggered'

export interface QuickView {
  id: string
  label: string
  search: string
  /** Which dashboard total to show next to the label. */
  count: QuickViewCount
}

const OPEN_STATUSES: IncidentListParams['status'] = ['triggered', 'acknowledged', 'investigating']

/** Saved list filters. They are plain URLs, so they work with Back, reload and sharing. */
export const QUICK_VIEWS: readonly QuickView[] = [
  {
    id: 'critical',
    label: 'Critical open',
    search: filterSearch({ status: OPEN_STATUSES, severity: ['critical'] }),
    count: 'critical',
  },
  {
    id: 'unassigned',
    label: 'Unassigned',
    search: filterSearch({ status: OPEN_STATUSES, unassigned: true }),
    count: 'unassigned',
  },
  {
    id: 'triggered',
    label: 'Triggered',
    search: filterSearch({ status: ['triggered'] }),
    count: 'triggered',
  },
]

export function quickViewHref(view: QuickView) {
  return `${paths.incidents}?${view.search}`
}

export interface NavLocation {
  pathname: string
  search: string
}

/** The quick view whose filters exactly match the current list URL, if any. */
export function getActiveQuickView(location: NavLocation): QuickView | null {
  if (location.pathname !== paths.incidents) return null
  const current = filterSearch(parseIncidentListParams(new URLSearchParams(location.search)))
  return QUICK_VIEWS.find((view) => view.search === current) ?? null
}

export function isOverviewActive(location: NavLocation) {
  return location.pathname === paths.dashboard
}

/** "Incidents" covers the list, detail and create pages, except while a quick view is selected. */
export function isIncidentsActive(location: NavLocation) {
  const inIncidents =
    location.pathname === paths.incidents || location.pathname.startsWith(`${paths.incidents}/`)
  return inIncidents && getActiveQuickView(location) === null
}
