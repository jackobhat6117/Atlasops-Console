import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  hasActiveFilters,
  parseIncidentListParams,
  serializeIncidentListParams,
  type IncidentListParams,
  type SortField,
  type SortOrder,
} from '@/entities/incident'

type FilterKey = 'status' | 'severity' | 'service'
type FilterValue<K extends FilterKey> = IncidentListParams[K][number]
type Changes = Partial<IncidentListParams> | ((current: IncidentListParams) => Partial<IncidentListParams>)

/**
 * The URL is the single source of truth for list state: search, filters,
 * sort and page. Reload, share, back/forward and returning from a detail
 * page all restore the exact list.
 *
 * Any change other than the page resets to page 1, so the user never lands
 * on an empty page past the end of a smaller result set.
 *
 * Note: React Router's functional setSearchParams sees the URL of the current
 * render, so call one action per event. Separate clicks are always safe.
 */
export function useIncidentListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => parseIncidentListParams(searchParams), [searchParams])

  const update = useCallback(
    (changes: Changes, { replace = false } = {}) => {
      setSearchParams(
        (currentSearch) => {
          const current = parseIncidentListParams(currentSearch)
          const resolved = typeof changes === 'function' ? changes(current) : changes
          return serializeIncidentListParams({ ...current, page: 1, ...resolved })
        },
        { replace },
      )
    },
    [setSearchParams],
  )

  const actions = useMemo(
    () => ({
      // Typing replaces the history entry so Back doesn't step through keystrokes.
      setSearch: (q: string) => update({ q }, { replace: true }),

      toggleFilter: <K extends FilterKey>(key: K, value: FilterValue<K>) =>
        update((current) => {
          const values = current[key] as string[]
          const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
          return { [key]: next } as Partial<IncidentListParams>
        }),

      setFilter: <K extends FilterKey>(key: K, values: FilterValue<K>[]) =>
        update({ [key]: values } as Partial<IncidentListParams>),

      /** Remove one value from a filter, or the whole filter when no value is given. */
      clearFilter: (key: FilterKey, value?: string) =>
        update((current) => {
          const values = current[key] as string[]
          const next = value === undefined ? [] : values.filter((v) => v !== value)
          return { [key]: next } as Partial<IncidentListParams>
        }),

      clearUnassigned: () => update({ unassigned: false }),

      clearAll: () => update({ q: '', status: [], severity: [], service: [], unassigned: false }),

      setSort: (sort: SortField, order: SortOrder) => update({ sort, order }),

      /** `replace` is for corrections (e.g. clamping a page past the end) that shouldn't add history. */
      setPage: (page: number, options?: { replace?: boolean }) => update({ page }, options),

      setPageSize: (pageSize: number) => update({ pageSize }),
    }),
    [update],
  )

  return {
    params,
    /** Canonical list query string, e.g. to link back from a detail page. */
    search: serializeIncidentListParams(params).toString(),
    hasActiveFilters: hasActiveFilters(params),
    ...actions,
  }
}
