
export const paths = {
  root: '/',
  dashboard: '/',
  incidents: '/incidents',
  newIncident: '/incidents/new',
  incident: (id: string) => `/incidents/${encodeURIComponent(id)}`,
} as const


export interface IncidentListReturnState {
  listSearch?: string
  lastViewedId?: string
}
