/** Initial-load placeholder that mirrors the list layout to avoid layout shift. */
export function IncidentListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div role="status" className="divide-y divide-line">
      <span className="sr-only">Loading incidents…</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} aria-hidden="true" className="flex animate-pulse items-center gap-4 px-3 py-3.5">
          <div className="h-3 w-16 rounded bg-surface-muted" />
          <div className="h-3 flex-1 rounded bg-surface-muted" />
          <div className="hidden h-3 w-16 rounded bg-surface-muted sm:block" />
          <div className="hidden h-3 w-24 rounded bg-surface-muted md:block" />
          <div className="hidden h-3 w-20 rounded bg-surface-muted md:block" />
        </div>
      ))}
    </div>
  )
}
