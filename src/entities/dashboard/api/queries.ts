import { useQuery } from '@tanstack/react-query'
import { fetchDashboardSummary } from './dashboard-api'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
}

/** The overview is a glance view, so it refreshes itself. Pauses in background tabs and offline. */
const DASHBOARD_POLL_INTERVAL_MS = 30_000

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: ({ signal }) => fetchDashboardSummary(signal),
    refetchInterval: DASHBOARD_POLL_INTERVAL_MS,
  })
}
