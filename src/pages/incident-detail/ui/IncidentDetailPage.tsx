import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { SeverityBadge, StatusBadge, useIncident } from '@/entities/incident'
import { getErrorMessage, isApiError } from '@/shared/api'
import { formatDateTime, useDocumentTitle } from '@/shared/lib'
import {
  AlertOctagonIcon,
  Banner,
  Button,
  OfflineMessage,
  RefreshIcon,
  SearchIcon,
  StateMessage,
} from '@/shared/ui'
import { IncidentActivity } from '@/widgets/incident-activity'
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
    <div className="page-shell">
      <BackToIncidentsLink incidentId={incidentId} />

      {query.isPending ? (
        query.fetchStatus === 'paused' ? (
          <OfflineMessage what="This incident" />
        ) : (
          <IncidentDetailSkeleton />
        )
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

          <header className="page-header">
            <div>
              <p className="eyebrow font-mono">{incident.id}</p>
              <h1 ref={headingRef} tabIndex={-1} className="page-title break-words outline-none">
                {incident.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
                <span className="rounded-md bg-surface-muted px-2 py-0.5 text-muted">{incident.service}</span>
              </div>
            </div>
          </header>

          {/* DOM order puts actions before content on phones; on desktop they sit in the right column. */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="lg:col-start-2 lg:row-start-1">
              <IncidentProperties incident={incident} />
            </div>
            <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
              <section
                aria-labelledby="incident-description-heading"
                className="rounded-xl border border-line bg-surface p-5 shadow-panel"
              >
                <h2 id="incident-description-heading" className="text-sm font-semibold text-fg">
                  Description
                </h2>
                <p className="mt-2 break-words whitespace-pre-wrap text-fg">{incident.description}</p>
              </section>
              <IncidentNotes incident={incident} />
              <IncidentActivity incidentId={incident.id} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
