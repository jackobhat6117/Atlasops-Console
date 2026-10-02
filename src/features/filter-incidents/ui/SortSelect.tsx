import { useId } from 'react'
import type { SortField, SortOrder } from '@/entities/incident'
import { Select } from '@/shared/ui'

const OPTIONS: Array<{ sort: SortField; order: SortOrder; label: string }> = [
  { sort: 'updatedAt', order: 'desc', label: 'Last updated (newest first)' },
  { sort: 'updatedAt', order: 'asc', label: 'Last updated (oldest first)' },
  { sort: 'severity', order: 'desc', label: 'Severity (highest first)' },
  { sort: 'severity', order: 'asc', label: 'Severity (lowest first)' },
  { sort: 'createdAt', order: 'desc', label: 'Created (newest first)' },
  { sort: 'createdAt', order: 'asc', label: 'Created (oldest first)' },
]

/** Sort control that works at every width. On desktop, table headers offer the same choice. */
export function SortSelect({
  sort,
  order,
  onChange,
}: {
  sort: SortField
  order: SortOrder
  onChange: (sort: SortField, order: SortOrder) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm whitespace-nowrap text-muted">
        Sort by
      </label>
      <Select
        id={id}
        value={`${sort}:${order}`}
        onChange={(event) => {
          const [nextSort, nextOrder] = event.target.value.split(':') as [SortField, SortOrder]
          onChange(nextSort, nextOrder)
        }}
      >
        {OPTIONS.map((option) => (
          <option key={`${option.sort}:${option.order}`} value={`${option.sort}:${option.order}`}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  )
}
