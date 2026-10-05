import { SeverityBadge, StatusBadge, type IncidentSeverity, type IncidentStatus } from '@/entities/incident'
import { cn } from '@/shared/lib'

interface IncidentPreviewProps {
  title: string
  severity?: IncidentSeverity
  status?: IncidentStatus
  service: string
  assigneeName: string | null
}


export function IncidentPreview({ title, severity, status, service, assigneeName }: IncidentPreviewProps) {
  const trimmed = title.trim()
  return (
    <section aria-labelledby="incident-preview-heading" className="overflow-hidden rounded-xl border border-line bg-surface shadow-panel">
      <header className="flex items-center justify-between border-b border-line bg-surface-muted/60 px-4 py-3">
        <h2 id="incident-preview-heading" className="text-xs font-semibold tracking-wide text-subtle uppercase">
          Preview
        </h2>
        <span className="font-mono text-xs text-subtle">INC-NEW</span>
      </header>
      <div className="flex flex-col gap-3 p-4">
        <p className={cn('break-words', trimmed ? 'font-semibold text-fg' : 'text-subtle italic')}>
          {trimmed || 'Untitled incident'}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {severity ? (
            <SeverityBadge severity={severity} />
          ) : (
            <span className="rounded border border-dashed border-line-strong px-1.5 py-0.5 text-xs text-subtle">
              No severity
            </span>
          )}
          {status && <StatusBadge status={status} />}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-line pt-3 text-sm">
          <dt className="text-muted">Service</dt>
          <dd className={cn('break-all', service ? 'font-medium text-fg' : 'text-subtle')}>{service || 'Not selected'}</dd>
          <dt className="text-muted">Assignee</dt>
          <dd className={assigneeName ? 'font-medium text-fg' : 'text-subtle'}>{assigneeName ?? 'Unassigned'}</dd>
        </dl>
      </div>
    </section>
  )
}
