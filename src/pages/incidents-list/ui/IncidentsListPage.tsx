import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useIncidentChanges, useIncidentList } from '@/entities/incident'
import { IncidentFilters, useIncidentListParams } from '@/features/filter-incidents'
import { getErrorMessage } from '@/shared/api'
import { paths, type IncidentListReturnState } from '@/shared/config'
import { formatDateTime, pluralize, useDocumentTitle } from '@/shared/lib'
import {
  AlertOctagonIcon,
  Banner,
  Button,
  buttonClassName,
  InboxIcon,
  OfflineMessage,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  Spinner,
  StateMessage,
} from '@/shared/ui'
import { IncidentList, IncidentListSkeleton } from '@/widgets/incident-list'
import { ListFooter } from './ListFooter'

export function IncidentsListPage() {
  useDocumentTitle('Incidents')
  const list = useIncidentListParams()
  const query = useIncidentList(list.params)
  const { data } = query
  const location = useLocation()
  const lastViewedId = (location.state as IncidentListReturnState | null)?.lastViewedId
  const resultsRef = useRef<HTMLElement>(null)

  // A page past the end (hand-edited URL, or results shrank) is corrected
  // without adding a history entry.
  const { page } = list.params
  const { setPage } = list
  useEffect(() => {
    if (data && !query.isPlaceholderData && data.total > 0 && page > data.totalPages) {
      setPage(data.totalPages, { replace: true })
    }
  }, [data, page, query.isPlaceholderData, setPage])

  const changePage = (nextPage: number) => {
    setPage(nextPage)
    resultsRef.current?.scrollIntoView({ block: 'start' })
  }

  // Changes made by others show up as a notice, never as rows moving under the user's cursor.
  // The count compares against the moment the visible data was loaded.
  const changedCount = useIncidentChanges(
    list.params,
    data && !query.isPlaceholderData ? query.dataUpdatedAt : null,
  )

  const isRefreshing = query.isFetching && !query.isPending
  const isLoadingNewResults = query.isFetching && query.isPlaceholderData

  // Announced to screen readers once results settle (not on every keystroke).
  const announcement = data && !query.isFetching ? `${pluralize(data.total, 'incident')} found.` : ''

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Incident operations</p>
          <h1 className="page-title">Incidents</h1>
          <p className="page-description">
            {data
              ? `${pluralize(data.total, 'incident')} across monitored services`
              : 'Monitor, triage and resolve service incidents.'}
          </p>
        </div>
        <Link to={paths.newIncident} className={buttonClassName({ variant: 'primary' })}>
          <PlusIcon />
          New incident
        </Link>
      </header>

      <IncidentFilters isSearching={isLoadingNewResults} />

      <section
        ref={resultsRef}
        aria-labelledby="incident-results-heading"
        className="scroll-mt-4 overflow-hidden rounded-xl border border-line bg-surface shadow-panel"
      >
        <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-muted/60 px-4 py-3">
          <h2 id="incident-results-heading" className="text-sm font-semibold text-fg">
            Results
          </h2>
          {isRefreshing && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Spinner size={12} />
              Updating…
            </span>
          )}
        </div>
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>

        {changedCount > 0 && (
          <Banner
            className="m-3"
            action={
              <Button size="sm" onClick={() => query.refetch()} loading={query.isFetching}>
                <RefreshIcon size={14} />
                Refresh
              </Button>
            }
          >
            {pluralize(changedCount, 'incident')} in this view {changedCount === 1 ? 'has' : 'have'} changed since
            you loaded it.
          </Banner>
        )}

        {query.isError && data && (
          <Banner
            tone="warning"
            className="m-3"
            action={
              <Button size="sm" onClick={() => query.refetch()} loading={query.isFetching}>
                <RefreshIcon size={14} />
                Retry
              </Button>
            }
          >
            Couldn't refresh incidents. Showing results from {formatDateTime(new Date(query.dataUpdatedAt))}.
          </Banner>
        )}

        {query.isPending ? (
          query.fetchStatus === 'paused' ? (
            <OfflineMessage what="Incidents" />
          ) : (
            <IncidentListSkeleton rows={Math.min(list.params.pageSize, 10)} />
          )
        ) : !data ? (
          <StateMessage
            role="alert"
            icon={<AlertOctagonIcon size={28} />}
            title="Couldn't load incidents"
            description={getErrorMessage(query.error)}
            action={
              <Button variant="primary" onClick={() => query.refetch()} loading={query.isFetching}>
                <RefreshIcon size={14} />
                Try again
              </Button>
            }
          />
        ) : data.total === 0 ? (
          list.hasActiveFilters ? (
            <StateMessage
              icon={<SearchIcon size={28} />}
              title="No incidents match your filters"
              description="Try a different search term, or remove some filters."
              action={<Button onClick={list.clearAll}>Clear all filters</Button>}
            />
          ) : (
            <StateMessage
              icon={<InboxIcon size={28} />}
              title="No incidents yet"
              description="New incidents will appear here as soon as they are created."
              action={
                <Link to={paths.newIncident} className={buttonClassName({ variant: 'primary' })}>
                  <PlusIcon />
                  New incident
                </Link>
              }
            />
          )
        ) : (
          <>
            <IncidentList
              items={data.items}
              sort={list.params.sort}
              order={list.params.order}
              onSortChange={list.setSort}
              listSearch={list.search}
              highlightedId={lastViewedId}
              isStale={isLoadingNewResults}
            />
            <ListFooter
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              totalPages={data.totalPages}
              itemCount={data.items.length}
              onPageChange={changePage}
              onPageSizeChange={list.setPageSize}
              disabled={isLoadingNewResults}
            />
          </>
        )}
      </section>
    </div>
  )
}
