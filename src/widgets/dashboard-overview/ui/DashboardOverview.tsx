import { Link } from 'react-router-dom'
import type { DashboardSummary } from '@/entities/dashboard'
import { STATUS_LABELS, SeverityBadge, StatusBadge, type IncidentStatus } from '@/entities/incident'
import { paths } from '@/shared/config'
import { cn, formatNumber, formatRelativeTime, pluralize } from '@/shared/lib'
import { Panel } from '@/shared/ui'

const OPEN_STATUS = 'triggered,acknowledged,investigating'

const STATUS_TONE: Record<IncidentStatus, string> = {
  triggered: 'bg-red-600',
  acknowledged: 'bg-amber-500',
  investigating: 'bg-blue-600',
  resolved: 'bg-emerald-600',
}

function incidentsHref(query: Record<string, string>) {
  return `${paths.incidents}?${new URLSearchParams(query).toString()}`
}

function situation(summary: DashboardSummary) {
  const { critical, unassigned } = summary.totals
  const criticalSentence =
    critical === 0
      ? 'No critical incidents are open.'
      : `${formatNumber(critical)} critical ${critical === 1 ? 'incident is' : 'incidents are'} open.`
  const ownerSentence =
    unassigned === 0
      ? 'Every open incident has an owner.'
      : `${formatNumber(unassigned)} ${unassigned === 1 ? 'has' : 'have'} no owner.`
  return `${criticalSentence} ${ownerSentence}`
}

function serviceHealth(open: number, critical: number) {
  if (open === 0) return 'Clear'
  if (critical === 0) return pluralize(open, 'open incident')
  return `${formatNumber(critical)} critical · ${formatNumber(open)} open`
}

export function DashboardOverview({ summary }: { summary: DashboardSummary }) {
  const total = summary.totals.incidents
  const counts = [
    { label: 'Open', value: summary.totals.open, href: incidentsHref({ status: OPEN_STATUS }), tone: 'accent' },
    {
      label: 'Critical',
      value: summary.totals.critical,
      href: incidentsHref({ status: OPEN_STATUS, severity: 'critical' }),
      tone: 'danger',
    },
    {
      label: 'Unassigned',
      value: summary.totals.unassigned,
      href: incidentsHref({ status: OPEN_STATUS, unassigned: '1' }),
      tone: 'warning',
    },
    {
      label: 'Triggered',
      value: summary.totals.triggered,
      href: incidentsHref({ status: 'triggered' }),
      tone: 'neutral',
    },
  ] as const

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base font-medium text-fg">{situation(summary)}</p>

      <ul aria-label="Queues" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {counts.map((item) => (
          <li key={item.label}>
            <Link
              to={item.href}
              className={cn(
                'block rounded-xl border bg-surface px-4 py-3 shadow-panel hover:border-line-strong',
                item.tone === 'danger' && item.value > 0 && 'border-danger/30',
                item.tone === 'warning' && item.value > 0 && 'border-warning/30',
                item.tone !== 'danger' && item.tone !== 'warning' && 'border-line',
              )}
            >
              <span className="text-xs font-semibold tracking-wide text-muted uppercase">{item.label}</span>
              <span className="mt-1 block text-3xl font-semibold tracking-tight text-fg">
                {formatNumber(item.value)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-label="Incidents by status" className="rounded-xl border border-line bg-surface p-4 shadow-panel">
        <h2 className="text-sm font-semibold text-fg">Status</h2>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
          {summary.byStatus.map((item) =>
            item.count === 0 ? null : (
              <span
                key={item.status}
                className={STATUS_TONE[item.status]}
                style={{ flexGrow: item.count, flexBasis: 0 }}
              />
            ),
          )}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {summary.byStatus.map((item) => (
            <li key={item.status}>
              <Link
                to={incidentsHref({ status: item.status })}
                className="inline-flex items-center gap-2 rounded text-sm hover:underline"
              >
                <span aria-hidden="true" className={cn('size-2 rounded-full', STATUS_TONE[item.status])} />
                <span className="text-muted">{STATUS_LABELS[item.status]}</span>
                <span className="font-semibold text-fg">{formatNumber(item.count)}</span>
                <span className="sr-only">
                  {total === 0 ? '' : `, ${Math.round((item.count / total) * 100)} percent`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_22rem]">
        <Panel
          title="Needs attention"
          description="Unresolved incidents, most severe and unowned first"
          action={
            <Link to={incidentsHref({ status: OPEN_STATUS, severity: 'critical' })} className="text-xs font-semibold text-accent hover:underline">
              All critical
            </Link>
          }
        >
          {summary.attention.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted">Nothing needs attention. The open queue is clear.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Unresolved incidents that need a response</caption>
                <thead className="bg-surface-muted/80 text-[11px] tracking-wide text-muted uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-semibold">Incident</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold md:table-cell">Service</th>
                    <th scope="col" className="hidden px-3 py-2 font-semibold sm:table-cell">Assignee</th>
                    <th scope="col" className="px-4 py-2 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.attention.map((incident) => (
                    <tr key={incident.id} className="border-t border-line">
                      <td className="max-w-0 px-4 py-3">
                        <Link to={paths.incident(incident.id)} className="block rounded-sm hover:text-accent">
                          <span className="flex items-center gap-2">
                            <SeverityBadge severity={incident.severity} />
                            <span className="font-mono text-xs text-muted">{incident.id}</span>
                          </span>
                          <span className="mt-1 block truncate font-medium text-fg">{incident.title}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={incident.status} />
                      </td>
                      <td className="hidden px-3 py-3 whitespace-nowrap text-muted md:table-cell">{incident.service}</td>
                      <td className="hidden px-3 py-3 sm:table-cell">
                        {incident.assignee ? (
                          incident.assignee.name
                        ) : (
                          <span className="font-medium text-warning">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted">
                        <time dateTime={incident.updatedAt}>{formatRelativeTime(incident.updatedAt)}</time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Service posture" description="Open work by service, not historical volume">
          <ul className="divide-y divide-line">
            {summary.services.map((service) => (
              <li key={service.service}>
                <Link
                  to={incidentsHref({ status: OPEN_STATUS, service: service.service })}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-fg">{service.service}</span>
                    <span className="text-xs text-muted">{serviceHealth(service.open, service.critical)}</span>
                  </span>
                  <span
                    className={cn(
                      'size-2.5 shrink-0 rounded-full',
                      service.critical > 0 ? 'bg-red-600' : service.open > 0 ? 'bg-amber-500' : 'bg-emerald-600',
                    )}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
