import { Spinner } from '@/shared/ui'

/** Shown while the first route's code chunk loads. */
export function PageFallback() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center text-muted">
      <span className="inline-flex items-center gap-2">
        <Spinner />
        Loading…
      </span>
    </div>
  )
}
