import { SeverityBadge, type Incident } from '@/entities/incident'
import { AssigneeSelect } from '@/features/assign-incident'
import { StatusControl } from '@/features/change-incident-status'
import { formatDateTime, formatRelativeTime } from '@/shared/lib'

function DateValue({ value }: { value: string }) {
  return (
    <>
      <time dateTime={value}>{formatDateTime(value)}</time>
      <span className="block text-xs text-muted">{formatRelativeTime(value)}</span>
    </>
  )
}

/** Sidebar: the two actionable properties (status, assignee) first, then read-only facts. */
export function IncidentProperties({ incident }: { incident: Incident }) {
  return (
    <aside
      aria-labelledby="incident-properties-heading"
      className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 shadow-panel"
    >
      <h2 id="incident-properties-heading" className="sr-only">
        Properties and actions
      </h2>
      <StatusControl incident={incident} />
      <AssigneeSelect incident={incident} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
        <dt className="text-muted">Severity</dt>
        <dd>
          <SeverityBadge severity={incident.severity} />
        </dd>
        <dt className="text-muted">Service</dt>
        <dd className="font-medium break-all text-fg">{incident.service}</dd>
        <dt className="text-muted">Created</dt>
        <dd className="text-fg">
          <DateValue value={incident.createdAt} />
        </dd>
        <dt className="text-muted">Last updated</dt>
        <dd className="text-fg">
          <DateValue value={incident.updatedAt} />
        </dd>
      </dl>
    </aside>
  )
}
