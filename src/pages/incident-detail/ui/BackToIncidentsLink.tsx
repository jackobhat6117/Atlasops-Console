import { Link, useLocation } from 'react-router-dom'
import { paths, type IncidentListReturnState } from '@/shared/config'
import { ChevronLeftIcon } from '@/shared/ui'

/**
 * Returns to the exact list the user came from (search, filters, sort, page),
 * and tells the list which incident to focus. Opened directly (deep link,
 * new tab), it falls back to the default list.
 */
export function BackToIncidentsLink({ incidentId }: { incidentId: string }) {
  const state = useLocation().state as IncidentListReturnState | null
  const search = state?.listSearch ? `?${state.listSearch}` : ''
  return (
    <Link
      to={`${paths.incidents}${search}`}
      state={{ lastViewedId: incidentId } satisfies IncidentListReturnState}
      className="inline-flex items-center gap-1 rounded text-sm font-medium text-muted hover:text-fg"
    >
      <ChevronLeftIcon />
      Back to incidents
    </Link>
  )
}
