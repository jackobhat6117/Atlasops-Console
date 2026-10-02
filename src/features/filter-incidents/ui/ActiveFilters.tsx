import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  type IncidentListParams,
  type IncidentSeverity,
  type IncidentStatus,
} from '@/entities/incident'
import { XIcon } from '@/shared/ui'

type FilterKey = 'status' | 'severity' | 'service'

interface ActiveFiltersProps {
  params: IncidentListParams
  onRemoveSearch: () => void
  onRemoveFilter: (key: FilterKey, value: string) => void
  onClearUnassigned: () => void
  onClearAll: () => void
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <li className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface py-0.5 pr-1 pl-2.5 text-xs text-fg">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 text-subtle hover:bg-surface-muted hover:text-fg"
        aria-label={`Remove filter ${label}`}
      >
        <XIcon size={12} />
      </button>
    </li>
  )
}

/** Visible summary of every active filter, each removable on its own, plus "Clear all". */
export function ActiveFilters({
  params,
  onRemoveSearch,
  onRemoveFilter,
  onClearUnassigned,
  onClearAll,
}: ActiveFiltersProps) {
  const chips = [
    ...(params.q ? [{ key: 'q', label: `Search: “${params.q}”`, remove: onRemoveSearch }] : []),
    ...params.status.map((value: IncidentStatus) => ({
      key: `status:${value}`,
      label: `Status: ${STATUS_LABELS[value]}`,
      remove: () => onRemoveFilter('status', value),
    })),
    ...params.severity.map((value: IncidentSeverity) => ({
      key: `severity:${value}`,
      label: `Severity: ${SEVERITY_LABELS[value]}`,
      remove: () => onRemoveFilter('severity', value),
    })),
    ...params.service.map((value) => ({
      key: `service:${value}`,
      label: `Service: ${value}`,
      remove: () => onRemoveFilter('service', value),
    })),
    ...(params.unassigned
      ? [{ key: 'unassigned', label: 'Assignee: Unassigned', remove: onClearUnassigned }]
      : []),
  ]

  if (chips.length === 0) return null

  return (
    <section aria-label="Active filters" className="flex flex-wrap items-center gap-2">
      <ul className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <Chip key={chip.key} label={chip.label} onRemove={chip.remove} />
        ))}
      </ul>
      <button
        type="button"
        onClick={onClearAll}
        className="rounded px-1 text-xs font-medium text-accent underline-offset-2 hover:underline"
      >
        Clear all
      </button>
    </section>
  )
}
