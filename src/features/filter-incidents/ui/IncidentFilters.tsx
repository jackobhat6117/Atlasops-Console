import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  SEVERITY_LABELS,
  STATUS_LABELS,
  type IncidentSeverity,
  type IncidentStatus,
} from '@/entities/incident'
import { useServices } from '@/entities/service'
import { MultiSelectMenu } from '@/shared/ui'
import { useIncidentListParams } from '../model/use-incident-list-params'
import { ActiveFilters } from './ActiveFilters'
import { IncidentSearch } from './IncidentSearch'
import { SortSelect } from './SortSelect'

const statusOptions = INCIDENT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))
const severityOptions = INCIDENT_SEVERITIES.map((value) => ({ value, label: SEVERITY_LABELS[value] }))


export function IncidentFilters({ isSearching = false }: { isSearching?: boolean }) {
  const list = useIncidentListParams()
  const services = useServices()

  const serviceOptions = Array.from(new Set([...(services.data ?? []), ...list.params.service]))
    .sort()
    .map((value) => ({ value, label: value }))

  return (
    <section
      aria-label="Incident search and filters"
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-panel"
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <IncidentSearch value={list.params.q} onSearch={list.setSearch} isSearching={isSearching} />
          <div role="group" aria-label="Filters" className="flex flex-wrap gap-2">
            <MultiSelectMenu<IncidentStatus>
              label="Status"
              options={statusOptions}
              selected={list.params.status}
              onToggle={(value) => list.toggleFilter('status', value)}
              onClear={() => list.clearFilter('status')}
            />
            <MultiSelectMenu<IncidentSeverity>
              label="Severity"
              options={severityOptions}
              selected={list.params.severity}
              onToggle={(value) => list.toggleFilter('severity', value)}
              onClear={() => list.clearFilter('severity')}
            />
            <MultiSelectMenu
              label="Service"
              options={serviceOptions}
              selected={list.params.service}
              onToggle={(value) => list.toggleFilter('service', value)}
              onClear={() => list.clearFilter('service')}
              disabled={serviceOptions.length === 0}
            />
          </div>
        </div>
        <SortSelect sort={list.params.sort} order={list.params.order} onChange={list.setSort} />
      </div>

      <ActiveFilters
        params={list.params}
        onRemoveSearch={() => list.setSearch('')}
        onRemoveFilter={list.clearFilter}
        onClearUnassigned={list.clearUnassigned}
        onClearAll={list.clearAll}
      />
    </section>
  )
}
