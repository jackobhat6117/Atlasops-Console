import type { Incident, SortField, SortOrder } from '@/entities/incident'

export interface IncidentListViewProps {
  items: Incident[]
  sort: SortField
  order: SortOrder
  onSortChange: (sort: SortField, order: SortOrder) => void
  /** Current list query string, carried into detail links so "Back" restores the list. */
  listSearch: string
  /** Incident the user just returned from: marked and focused. */
  highlightedId?: string
  /** True while newer results load behind the current ones. */
  isStale?: boolean
}
