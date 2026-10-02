import { request } from '@/shared/api'
import { dashboardSummarySchema } from '../model/schemas'

export function fetchDashboardSummary(signal?: AbortSignal) {
  return request('/dashboard/summary', { schema: dashboardSummarySchema, signal })
}
