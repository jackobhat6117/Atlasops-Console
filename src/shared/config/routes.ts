/** Single registry of app URLs, so paths are never hard-coded across the codebase. */
export const paths = {
  root: '/',
  incidents: '/incidents',
  newIncident: '/incidents/new',
  incident: (id: string) => `/incidents/${encodeURIComponent(id)}`,
} as const

/**
 * History state passed when navigating from the list to a detail page, so the
 * detail page can return to the exact list URL and the list can restore focus.
 */
export interface IncidentListReturnState {
  listSearch?: string
  lastViewedId?: string
}
