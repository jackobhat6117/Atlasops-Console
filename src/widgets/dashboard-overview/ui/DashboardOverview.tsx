import { Link } from 'react-router-dom'
import type { DashboardSummary } from '@/entities/dashboard'
import { STATUS_LABELS, type IncidentStatus } from '@/entities/incident'
import { paths } from '@/shared/config'
import { cn, formatNumber, pluralize } from '@/shared/lib'
import { Panel } from '@/shared/ui'
import { AttentionList } from './AttentionList'

const OPEN_STATUS = 'triggered,acknowledged,investigating'

const STATUS_TONE: Record<IncidentStatus, string> = {
  triggered: 'bg-danger',
  acknowledged: 'bg-warning-solid',
  investigating: 'bg-accent',
  resolved: 'bg-success',
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

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1.6fr)_22rem]">
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
            <AttentionList items={summary.attention} />
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
                      service.critical > 0 ? 'bg-danger' : service.open > 0 ? 'bg-warning-solid' : 'bg-success',
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
