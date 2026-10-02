import { useMemo, useState } from 'react'
import { ActivityTimeline, useIncidentActivity, type IncidentActivityType } from '@/entities/incident'
import { getErrorMessage } from '@/shared/api'
import { cn, formatNumber } from '@/shared/lib'
import { Button, RefreshIcon, Spinner } from '@/shared/ui'

const FILTERS: Array<{ value: string; label: string; types: IncidentActivityType[] | null; empty: string }> = [
  { value: 'all', label: 'All', types: null, empty: 'No activity yet.' },
  { value: 'status', label: 'Status', types: ['status_changed'], empty: 'No status changes yet.' },
  { value: 'assignment', label: 'Assignment', types: ['assignee_changed'], empty: 'No assignment changes yet.' },
  { value: 'notes', label: 'Notes', types: ['note_added'], empty: 'No notes yet.' },
]

const INITIAL_VISIBLE = 8

/**
 * Server-recorded audit history for one incident: who changed what, and when.
 * It refetches after every mutation on the incident, so new entries appear as
 * soon as the server confirms. The filter and expand state are local UI state.
 */
export function IncidentActivity({ incidentId }: { incidentId: string }) {
  const query = useIncidentActivity(incidentId)
  const [filterValue, setFilterValue] = useState('all')
  const [expanded, setExpanded] = useState(false)

  const filter = FILTERS.find((option) => option.value === filterValue) ?? FILTERS[0]
  const entries = useMemo(() => query.data ?? [], [query.data])
  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((option) => [
          option.value,
          option.types ? entries.filter((entry) => option.types!.includes(entry.type)).length : entries.length,
        ]),
      ),
    [entries],
  )
  const filtered = useMemo(
    () => (filter.types ? entries.filter((entry) => filter.types!.includes(entry.type)) : entries),
    [entries, filter],
  )
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE)

  return (
    <section aria-labelledby="incident-activity-heading" className="rounded-xl border border-line bg-surface shadow-panel">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 id="incident-activity-heading" className="flex items-center gap-2 text-sm font-semibold text-fg">
          Activity
          {query.data && <span className="font-normal text-muted">({formatNumber(entries.length)})</span>}
          {query.isFetching && !query.isPending && (
            <span className="inline-flex items-center gap-1 text-xs font-normal text-muted">
              <Spinner size={12} />
              Updating…
            </span>
          )}
        </h2>
        <div role="group" aria-label="Filter activity" className="flex flex-wrap gap-1 rounded-lg bg-surface-muted p-1 ring-1 ring-line">
          {FILTERS.map((option) => {
            const active = option.value === filter.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilterValue(option.value)
                  setExpanded(false)
                }}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs transition-colors',
                  active ? 'bg-surface font-medium text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg',
                )}
              >
                {option.label}
                {query.data && <span className="ml-1 text-subtle tabular-nums">{counts[option.value]}</span>}
              </button>
            )
          })}
        </div>
      </header>

      <div className="px-5 py-4">
        {query.isPending ? (
          <div role="status" className="flex flex-col gap-4">
            <span className="sr-only">Loading activity…</span>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} aria-hidden="true" className="flex animate-pulse gap-3">
                <div className="size-7 rounded-full bg-surface-muted" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-2/3 rounded bg-surface-muted" />
                  <div className="h-2.5 w-20 rounded bg-surface-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : !query.data ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <p>Couldn't load the activity log. {getErrorMessage(query.error)}</p>
            <Button size="sm" onClick={() => query.refetch()} loading={query.isFetching}>
              <RefreshIcon size={14} />
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-2 text-sm text-muted">{filter.empty}</p>
        ) : (
          <>
            <ActivityTimeline entries={visible} />
            {filtered.length > INITIAL_VISIBLE && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className="mt-4 rounded text-sm font-medium text-accent hover:underline"
              >
                {expanded ? 'Show fewer' : `Show all ${formatNumber(filtered.length)} entries`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
