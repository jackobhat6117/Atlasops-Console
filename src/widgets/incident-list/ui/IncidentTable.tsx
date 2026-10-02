import { memo, useCallback, useMemo, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  SeverityBadge,
  StatusBadge,
  type Incident,
  type SortField,
  type SortOrder,
} from '@/entities/incident'
import { paths, type IncidentListReturnState } from '@/shared/config'
import { cn, formatDateTime, formatRelativeTime } from '@/shared/lib'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from '@/shared/ui'
import { handleRowKeyDown } from '../lib/row-navigation'
import { LastViewedTag } from './LastViewedTag'
import type { IncidentListViewProps } from './types'

const SORT_LABELS: Record<SortField, string> = {
  updatedAt: 'Last updated',
  createdAt: 'Created',
  severity: 'Severity',
}

function SortableHeader({
  field,
  sort,
  order,
  onSortChange,
  className,
}: {
  field: SortField
  sort: SortField
  order: SortOrder
  onSortChange: IncidentListViewProps['onSortChange']
  className?: string
}) {
  const active = sort === field
  const Icon = !active ? ArrowUpDownIcon : order === 'asc' ? ArrowUpIcon : ArrowDownIcon
  return (
    <th
      scope="col"
      aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-3 py-2', className)}
    >
      <button
        type="button"
        // New column: most relevant first (newest / most severe). Same column: flip direction.
        onClick={() => onSortChange(field, active && order === 'desc' ? 'asc' : 'desc')}
        className={cn(
          '-mx-1 inline-flex items-center gap-1 rounded px-1 font-semibold tracking-[inherit] uppercase hover:text-fg',
          active ? 'text-fg' : 'text-muted',
        )}
      >
        {SORT_LABELS[field]}
        <Icon size={12} className={active ? 'text-fg' : 'text-subtle'} />
      </button>
    </th>
  )
}

interface RowProps {
  incident: Incident
  highlighted: boolean
  linkState: IncidentListReturnState
  onRowClick: (event: MouseEvent<HTMLTableRowElement>, incident: Incident) => void
}

const IncidentRow = memo(function IncidentRow({ incident, highlighted, linkState, onRowClick }: RowProps) {
  return (
    <tr
      onClick={(event) => onRowClick(event, incident)}
      className={cn(
        'cursor-pointer border-t border-line align-top transition-colors hover:bg-accent-soft/45',
        highlighted && 'bg-accent-soft shadow-[inset_3px_0_0_var(--color-accent)]',
      )}
    >
      <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap text-muted">{incident.id}</td>
      <td className="max-w-0 px-3 py-3.5">
        <Link
          to={paths.incident(incident.id)}
          state={{ ...linkState, lastViewedId: incident.id } satisfies IncidentListReturnState}
          data-row-link
          data-id={incident.id}
          aria-current={highlighted ? 'true' : undefined}
          className="line-clamp-2 rounded-sm font-medium text-fg hover:text-accent hover:underline"
        >
          {incident.title}
        </Link>
        {highlighted && <LastViewedTag />}
        <span className="mt-0.5 block truncate text-xs text-muted lg:hidden">{incident.service}</span>
      </td>
      <td className="px-3 py-3.5">
        <SeverityBadge severity={incident.severity} />
      </td>
      <td className="px-3 py-3.5">
        <StatusBadge status={incident.status} />
      </td>
      <td className="hidden px-3 py-3.5 whitespace-nowrap text-muted lg:table-cell">{incident.service}</td>
      <td className="truncate px-3 py-3.5">
        {incident.assignee ? incident.assignee.name : <span className="text-subtle italic">Unassigned</span>}
      </td>
      <td className="hidden px-3 py-3.5 whitespace-nowrap text-muted xl:table-cell">
        <time dateTime={incident.createdAt} title={formatDateTime(incident.createdAt)}>
          {formatRelativeTime(incident.createdAt)}
        </time>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-muted">
        <time dateTime={incident.updatedAt} title={formatDateTime(incident.updatedAt)}>
          {formatRelativeTime(incident.updatedAt)}
        </time>
      </td>
    </tr>
  )
})

/** Desktop and tablet (≥768px) view: semantic table with sortable headers. */
export function IncidentTable({
  items,
  sort,
  order,
  onSortChange,
  listSearch,
  highlightedId,
  isStale,
}: IncidentListViewProps) {
  const navigate = useNavigate()
  // Stable object so memoized rows don't re-render when unrelated state changes.
  const linkState = useMemo<IncidentListReturnState>(() => ({ listSearch }), [listSearch])

  // Mouse convenience: clicking anywhere on a row opens it. Keyboard and
  // assistive tech use the real link in the title cell.
  const onRowClick = useCallback(
    (event: MouseEvent<HTMLTableRowElement>, incident: Incident) => {
      if ((event.target as HTMLElement).closest('a, button')) return
      if (window.getSelection()?.toString()) return // allow selecting text
      navigate(paths.incident(incident.id), {
        state: { listSearch, lastViewedId: incident.id } satisfies IncidentListReturnState,
      })
    },
    [navigate, listSearch],
  )

  return (
    <div className="overflow-x-auto">
      <table
        className={cn('w-full table-fixed text-left text-sm', isStale && 'opacity-60 transition-opacity')}
        aria-busy={isStale || undefined}
        onKeyDown={handleRowKeyDown}
      >
        <caption className="sr-only">
          Incidents, sorted by {SORT_LABELS[sort].toLowerCase()},{' '}
          {order === 'desc' ? 'descending' : 'ascending'}. Use arrow keys to move between incidents.
        </caption>
        <thead className="bg-surface-muted/80 text-[11px] tracking-wide uppercase">
          <tr>
            <th scope="col" className="w-24 px-3 py-2 font-semibold text-muted">
              ID
            </th>
            <th scope="col" className="px-3 py-2 font-semibold text-muted">
              Title
            </th>
            <SortableHeader field="severity" sort={sort} order={order} onSortChange={onSortChange} className="w-28" />
            <th scope="col" className="w-36 px-3 py-2 font-semibold text-muted">
              Status
            </th>
            <th scope="col" className="hidden w-40 px-3 py-2 font-semibold text-muted lg:table-cell">
              Service
            </th>
            <th scope="col" className="w-36 px-3 py-2 font-semibold text-muted">
              Assignee
            </th>
            <SortableHeader
              field="createdAt"
              sort={sort}
              order={order}
              onSortChange={onSortChange}
              className="hidden w-32 xl:table-cell"
            />
            <SortableHeader field="updatedAt" sort={sort} order={order} onSortChange={onSortChange} className="w-32" />
          </tr>
        </thead>
        <tbody>
          {items.map((incident) => (
            <IncidentRow
              key={incident.id}
              incident={incident}
              highlighted={incident.id === highlightedId}
              linkState={linkState}
              onRowClick={onRowClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
