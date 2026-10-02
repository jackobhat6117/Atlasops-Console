import { Link } from 'react-router-dom'
import { useDashboardSummary } from '@/entities/dashboard'
import { getErrorMessage } from '@/shared/api'
import { paths } from '@/shared/config'
import { formatDateTime, useDocumentTitle } from '@/shared/lib'
import {
  AlertOctagonIcon,
  Banner,
  Button,
  PlusIcon,
  RefreshIcon,
  StateMessage,
  buttonClassName,
} from '@/shared/ui'
import { DashboardOverview } from '@/widgets/dashboard-overview'

function DashboardSkeleton() {
  return (
    <div aria-label="Loading operations overview" role="status" className="flex animate-pulse flex-col gap-5">
      <div className="h-6 w-2/3 rounded bg-surface" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-20 rounded-xl border border-line bg-surface" />
        ))}
      </div>
      <div className="h-24 rounded-xl border border-line bg-surface" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_22rem]">
        <div className="h-80 rounded-xl border border-line bg-surface" />
        <div className="h-80 rounded-xl border border-line bg-surface" />
      </div>
      <span className="sr-only">Loading dashboard</span>
    </div>
  )
}

export function DashboardPage() {
  useDocumentTitle('Operations overview')
  const query = useDashboardSummary()
  const { data } = query

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations center</p>
          <h1 className="page-title">Service health</h1>
          <p className="page-description">What needs a response right now.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => query.refetch()} loading={query.isFetching} disabled={query.isPending}>
            <RefreshIcon />
            Refresh
          </Button>
          <Link to={paths.newIncident} className={buttonClassName({ variant: 'primary' })}>
            <PlusIcon />
            New incident
          </Link>
        </div>
      </header>

      {query.isError && data && (
        <Banner
          tone="warning"
          action={
            <Button size="sm" onClick={() => query.refetch()} loading={query.isFetching}>
              Retry
            </Button>
          }
        >
          Couldn't refresh the overview. Showing data from {formatDateTime(new Date(query.dataUpdatedAt))}.
        </Banner>
      )}

      {query.isPending ? (
        <DashboardSkeleton />
      ) : !data ? (
        <StateMessage
          role="alert"
          icon={<AlertOctagonIcon size={28} />}
          title="Couldn't load the operations overview"
          description={getErrorMessage(query.error)}
          action={
            <Button variant="primary" onClick={() => query.refetch()} loading={query.isFetching}>
              <RefreshIcon />
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <p className="sr-only" aria-live="polite">
            Operations overview updated.
          </p>
          <DashboardOverview summary={data} />
        </>
      )}
    </div>
  )
}
