import { AlertOctagonIcon, Button, StateMessage } from '@/shared/ui'

// Shown when the mock API (MSW service worker) cannot start, e.g. in browsers
// or private modes that block service workers. Never shows raw error details.
export function ApiUnavailable() {
  return (
    <main className="mx-auto max-w-xl px-4 py-[15vh]">
      <h1 className="sr-only">AtlasOps is unavailable</h1>
      <StateMessage
        role="alert"
        icon={<AlertOctagonIcon size={32} />}
        title="AtlasOps can't reach its API"
        description="This demo runs its API inside your browser using a service worker, and it could not be started. Service workers may be blocked by private browsing or browser settings. Try reloading, or open the app in a regular window of a current browser."
        action={
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        }
      />
    </main>
  )
}
