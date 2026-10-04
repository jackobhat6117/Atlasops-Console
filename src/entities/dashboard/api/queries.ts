import { useQuery } from '@tanstack/react-query'
import { fetchDashboardSummary, fetchResponseMetrics } from './dashboard-api'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  responseMetrics: (days: number) => [...dashboardKeys.all, 'response-metrics', days] as const,
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

/**
 * Response times change slowly, so a minute between refreshes is plenty. The key sits under
 * `dashboardKeys.all`, which every incident mutation invalidates, so the user's own changes
 * show up immediately.
 */
export function useResponseMetrics(days = 30) {
  return useQuery({
    queryKey: dashboardKeys.responseMetrics(days),
    queryFn: ({ signal }) => fetchResponseMetrics(days, signal),
    refetchInterval: 60_000,
  })
}
