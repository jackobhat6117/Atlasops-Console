import { useDashboardSummary } from '@/entities/dashboard'
import { getErrorMessage } from '@/shared/api'
import { formatDateTime, formatRelativeTime, useDocumentTitle } from '@/shared/lib'
import {
  AlertOctagonIcon,
  Banner,
  Button,
  LiveMessage,
  OfflineMessage,
  PageHeader,
  RefreshIcon,
  StateMessage,
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
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.6fr)_22rem]">
        <div className="h-80 rounded-xl border border-line bg-surface" />
        <div className="h-80 rounded-xl border border-line bg-surface" />
      </div>
      <span className="sr-only">Loading dashboard</span>
    </div>
  )
}

export function DashboardPage() {
  useDocumentTitle('Overview')
  const query = useDashboardSummary()
  const { data } = query

  return (
    <div className="page-shell">
      <PageHeader
        title="Overview"
        meta={data ? `Updated ${formatRelativeTime(new Date(query.dataUpdatedAt))}` : undefined}
        actions={
          <Button size="sm" onClick={() => query.refetch()} loading={query.isFetching} disabled={query.isPending}>
            <RefreshIcon size={14} />
            Refresh
          </Button>
        }
      />

      <LiveMessage message={query.isError && data ? "Couldn't refresh the overview. Showing earlier data." : ''} />
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
        query.fetchStatus === 'paused' ? (
          <OfflineMessage what="The overview" />
        ) : (
          <DashboardSkeleton />
        )
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
          <DashboardOverview summary={data} />
        </>
      )}
    </div>
  )
}
