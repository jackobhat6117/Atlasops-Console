import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { SeverityBadge, StatusBadge, useIncident } from '@/entities/incident'
import { getErrorMessage, isApiError } from '@/shared/api'
import { formatDateTime, useDocumentTitle } from '@/shared/lib'
import { AlertOctagonIcon, Banner, Button, RefreshIcon, SearchIcon, StateMessage } from '@/shared/ui'
import { IncidentNotes } from '@/widgets/incident-notes'
import { BackToIncidentsLink } from './BackToIncidentsLink'
import { IncidentDetailSkeleton } from './IncidentDetailSkeleton'
import { IncidentProperties } from './IncidentProperties'

export function IncidentDetailPage() {
  const { incidentId = '' } = useParams()
  const query = useIncident(incidentId)
  const incident = query.data
  useDocumentTitle(incident ? `${incident.id} · ${incident.title}` : incidentId)

  // Move focus to the heading once the incident loads, so keyboard and screen
  // reader users start at the top of the new page (once per incident).
  const headingRef = useRef<HTMLHeadingElement>(null)
  const focusedIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (incident && focusedIdRef.current !== incident.id) {
      focusedIdRef.current = incident.id
      headingRef.current?.focus()
    }
  }, [incident])

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <BackToIncidentsLink incidentId={incidentId} />

      {query.isPending ? (
        <IncidentDetailSkeleton />
      ) : !incident ? (
        isApiError(query.error) && query.error.isNotFound ? (
          <StateMessage
            icon={<SearchIcon size={28} />}
            title="Incident not found"
            description={`There is no incident with the ID “${incidentId}”. It may have been removed, or the link is wrong.`}
          />
        ) : (
          <StateMessage
            role="alert"
            icon={<AlertOctagonIcon size={28} />}
            title="Couldn't load this incident"
            description={getErrorMessage(query.error)}
            action={
              <Button variant="primary" onClick={() => query.refetch()} loading={query.isFetching}>
                <RefreshIcon size={14} />
                Try again
              </Button>
            }
          />
        )
      ) : (
        <>
          {query.isError && (
            <Banner
              tone="warning"
              action={
                <Button size="sm" onClick={() => query.refetch()} loading={query.isFetching}>
                  Retry
                </Button>
              }
            >
              Couldn't refresh this incident. Showing data from {formatDateTime(new Date(query.dataUpdatedAt))}.
            </Banner>
          )}

          <header className="flex flex-col gap-2">
            <p className="font-mono text-xs text-muted">{incident.id}</p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-semibold tracking-tight break-words text-fg outline-none sm:text-2xl"
            >
              {incident.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
              <span className="text-muted">{incident.service}</span>
            </div>
          </header>

          {/* DOM order puts actions before content on phones; on desktop they sit in the right column. */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="lg:col-start-2 lg:row-start-1">
              <IncidentProperties incident={incident} />
            </div>
            <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
              <section
                aria-labelledby="incident-description-heading"
                className="rounded-lg border border-line bg-surface p-4 shadow-sm"
              >
                <h2 id="incident-description-heading" className="text-sm font-semibold text-fg">
                  Description
                </h2>
                <p className="mt-2 break-words whitespace-pre-wrap text-fg">{incident.description}</p>
              </section>
              <IncidentNotes incident={incident} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
