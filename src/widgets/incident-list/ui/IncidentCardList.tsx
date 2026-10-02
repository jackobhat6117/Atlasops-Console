import { memo } from 'react'
import { Link } from 'react-router-dom'
import { SeverityBadge, StatusBadge, type Incident } from '@/entities/incident'
import { paths, type IncidentListReturnState } from '@/shared/config'
import { cn, formatDateTime, formatRelativeTime } from '@/shared/lib'
import { handleRowKeyDown } from '../lib/row-navigation'
import { LastViewedTag } from './LastViewedTag'
import type { IncidentListViewProps } from './types'

const IncidentCard = memo(function IncidentCard({
  incident,
  highlighted,
  listSearch,
}: {
  incident: Incident
  highlighted: boolean
  listSearch: string
}) {
  return (
    <li
      className={cn(
        'relative border-t border-line px-4 py-4 first:border-t-0 hover:bg-accent-soft/45',
        highlighted && 'bg-accent-soft shadow-[inset_3px_0_0_var(--color-accent)]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted">
          {incident.id}
          {highlighted && <LastViewedTag />}
        </span>
        <SeverityBadge severity={incident.severity} />
      </div>
      {/* The whole card is clickable through the link's stretched ::after area. */}
      <Link
        to={paths.incident(incident.id)}
        state={{ listSearch, lastViewedId: incident.id } satisfies IncidentListReturnState}
        data-row-link
        data-id={incident.id}
        aria-current={highlighted ? 'true' : undefined}
        className="mt-1.5 block text-[15px] font-semibold text-fg after:absolute after:inset-0 after:content-['']"
      >
        {incident.title}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <StatusBadge status={incident.status} />
        <span>{incident.service}</span>
        <span>{incident.assignee ? incident.assignee.name : <span className="italic">Unassigned</span>}</span>
        <span>
          Updated{' '}
          <time dateTime={incident.updatedAt} title={formatDateTime(incident.updatedAt)}>
            {formatRelativeTime(incident.updatedAt)}
          </time>
        </span>
      </div>
    </li>
  )
})

/** Phone view (<768px): one card per incident. Sorting uses the toolbar's Sort control. */
export function IncidentCardList({ items, listSearch, highlightedId, isStale }: IncidentListViewProps) {
  return (
    <ul
      aria-label="Incidents"
      aria-busy={isStale || undefined}
      onKeyDown={handleRowKeyDown}
      className={cn(isStale && 'opacity-60 transition-opacity')}
    >
      {items.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          highlighted={incident.id === highlightedId}
          listSearch={listSearch}
        />
      ))}
    </ul>
  )
}
