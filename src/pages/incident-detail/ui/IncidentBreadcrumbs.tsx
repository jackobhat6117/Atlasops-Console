import { useLocation } from 'react-router-dom'
import { paths, type IncidentListReturnState } from '@/shared/config'
import { Breadcrumbs } from '@/shared/ui'

/**
 * "Incidents / INC-1042". The Incidents crumb returns to the exact list the user
 * came from (search, filters, sort, page) and tells the list which incident to
 * focus. Opened directly (deep link, new tab), it falls back to the default list.
 */
export function IncidentBreadcrumbs({ incidentId }: { incidentId: string }) {
  const state = useLocation().state as IncidentListReturnState | null
  const search = state?.listSearch ? `?${state.listSearch}` : ''
  return (
    <Breadcrumbs
      items={[
        {
          label: 'Incidents',
          to: `${paths.incidents}${search}`,
          state: { lastViewedId: incidentId } satisfies IncidentListReturnState,
        },
        { label: incidentId, mono: true },
      ]}
    />
  )
}
