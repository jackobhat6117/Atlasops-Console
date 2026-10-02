export function IncidentDetailSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading incident…</span>
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-3 w-20 rounded bg-surface-muted" />
        <div className="mt-3 h-6 w-2/3 rounded bg-surface-muted" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="h-64 rounded-lg bg-surface-muted" />
          <div className="h-64 rounded-lg bg-surface-muted" />
        </div>
      </div>
    </div>
  )
}
