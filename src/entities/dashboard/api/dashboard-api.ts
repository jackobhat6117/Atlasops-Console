import { request } from '@/shared/api'
import { responseMetricsSchema } from '../model/response-metrics'
import { dashboardSummarySchema } from '../model/schemas'

export function fetchDashboardSummary(signal?: AbortSignal) {
  return request('/dashboard/summary', { schema: dashboardSummarySchema, signal })
}

export function fetchResponseMetrics(days: number, signal?: AbortSignal) {
  return request(`/metrics/response?days=${days}`, { schema: responseMetricsSchema, signal })
}
