import type { ReactNode } from 'react'
import { useResponseMetrics, type DurationStats, type ResponseMetrics as Metrics } from '@/entities/dashboard'
import { SeverityBadge } from '@/entities/incident'
import { getErrorMessage } from '@/shared/api'
import { cn, formatDuration, formatNumber } from '@/shared/lib'
import { Button, Panel, RefreshIcon } from '@/shared/ui'

const WINDOW_DAYS = 30

const dayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
const formatDay = (date: string) => dayFormat.format(new Date(`${date}T00:00:00Z`))

/** "2h 14m" with "p90 7h" underneath. Missing values read as "no data", not a dash. */
function DurationCell({ stats, emphasis = false }: { stats: DurationStats; emphasis?: boolean }) {
  if (stats.medianMs === null) {
    return (
      <td className="px-4 py-2.5 text-subtle">
        <span aria-hidden="true">—</span>
        <span className="sr-only">No data yet</span>
      </td>
    )
  }
  return (
    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
      <span className={cn('text-fg', emphasis ? 'font-semibold' : 'font-medium')}>{formatDuration(stats.medianMs)}</span>
      <span className="block text-xs text-muted">p90 {formatDuration(stats.p90Ms)}</span>
    </td>
  )
}

function ResponseTimesTable({ metrics }: { metrics: Metrics }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">
          Response times for incidents created in the last {metrics.window.days} days: median and 90th percentile, by
          severity
        </caption>
        <thead className="bg-surface-muted/80 text-[11px] tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold">
              Severity
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Acknowledge
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Resolve
            </th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">
              Incidents
            </th>
          </tr>
        </thead>
        <tbody>
          {metrics.bySeverity.map((row) => (
            <tr key={row.severity} className="border-t border-line">
              <th scope="row" className="px-4 py-2.5 font-normal">
                <SeverityBadge severity={row.severity} />
              </th>
              <DurationCell stats={row.acknowledge} />
              <DurationCell stats={row.resolve} />
              <td className="px-4 py-2.5 text-right text-muted tabular-nums">{formatNumber(row.incidents)}</td>
            </tr>
          ))}
          <tr className="border-t border-line-strong bg-surface-muted/40">
            <th scope="row" className="px-4 py-2.5 font-semibold text-fg">
              All severities
            </th>
            <DurationCell stats={metrics.overall.acknowledge} emphasis />
            <DurationCell stats={metrics.overall.resolve} emphasis />
            <td className="px-4 py-2.5 text-right font-semibold text-fg tabular-nums">
              {formatNumber(metrics.overall.incidents)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function CreatedVsResolved({ daily }: { daily: Metrics['daily'] }) {
  const created = daily.reduce((sum, day) => sum + day.created, 0)
  const resolved = daily.reduce((sum, day) => sum + day.resolved, 0)
  const net = created - resolved
  const max = Math.max(1, ...daily.flatMap((day) => [day.created, day.resolved]))

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <p className="text-sm text-muted">
        <span className="font-semibold text-fg tabular-nums">{formatNumber(created)}</span> created ·{' '}
        <span className="font-semibold text-fg tabular-nums">{formatNumber(resolved)}</span> resolved ·{' '}
        {net === 0 ? (
          'backlog unchanged'
        ) : (
          <span className={cn('font-medium', net > 0 ? 'text-warning' : 'text-success')}>
            backlog {net > 0 ? 'grew' : 'shrank'} by {formatNumber(Math.abs(net))}
          </span>
        )}
      </p>

      {/* Visual only; the table below carries the same data for assistive technology. */}
      <div aria-hidden="true">
        <div className="flex h-28 items-end gap-1 border-b border-line-strong">
          {daily.map((day) => (
            <div key={day.date} className="flex h-full flex-1 items-end justify-center gap-px" title={`${formatDay(day.date)}: ${day.created} created, ${day.resolved} resolved`}>
              <span className="w-1/2 max-w-2.5 rounded-t-sm bg-accent" style={{ height: `${(day.created / max) * 100}%` }} />
              <span className="w-1/2 max-w-2.5 rounded-t-sm bg-success" style={{ height: `${(day.resolved / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-subtle">
          <span>{formatDay(daily[0].date)}</span>
          <span>Today</span>
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-accent" /> Created
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-success" /> Resolved
          </span>
        </div>
      </div>

      <table className="sr-only">
        <caption>Incidents created and resolved per day, last {daily.length} days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Created</th>
            <th scope="col">Resolved</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((day) => (
            <tr key={day.date}>
              <th scope="row">{formatDay(day.date)}</th>
              <td>{day.created}</td>
              <td>{day.resolved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Response-time metrics (time to acknowledge / resolve, the MTTA / MTTR family) and the
 * created-vs-resolved trend. Loads on its own, so a slow or failed metrics request
 * never blocks the rest of the dashboard.
 */
export function ResponseMetrics() {
  const query = useResponseMetrics(WINDOW_DAYS)
  const { data } = query

  const body = (render: (metrics: Metrics) => ReactNode) =>
    query.isPending ? (
      <div role="status" className="flex animate-pulse flex-col gap-3 p-5">
        <span className="sr-only">Loading response metrics…</span>
        <div aria-hidden="true" className="h-4 w-2/3 rounded bg-surface-muted" />
        <div aria-hidden="true" className="h-24 rounded bg-surface-muted" />
      </div>
    ) : !data ? (
      <div className="flex flex-wrap items-center gap-3 p-5 text-sm text-muted">
        <p>Couldn't load response metrics. {getErrorMessage(query.error)}</p>
        <Button size="sm" onClick={() => query.refetch()} loading={query.isFetching}>
          <RefreshIcon size={14} />
          Retry
        </Button>
      </div>
    ) : (
      render(data)
    )

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <Panel
        title="Response times"
        description={`Created in the last ${WINDOW_DAYS} days · median, with 90th percentile below`}
      >
        {body((metrics) => (
          <ResponseTimesTable metrics={metrics} />
        ))}
      </Panel>
      <Panel title="Created vs resolved" description="Last 14 days">
        {body((metrics) => (
          <CreatedVsResolved daily={metrics.daily} />
        ))}
      </Panel>
    </div>
  )
}
