import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { NotFoundPage } from '@/pages/not-found'
import { paths } from '@/shared/config'
import { AlertOctagonIcon, Button, buttonClassName, StateMessage } from '@/shared/ui'

/**
 * Route-level error boundary: a crash in one page shows a recoverable
 * message inside the app shell instead of a blank screen. Error details
 * appear only in development, never to users.
 */
export function RouteErrorPage() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="sr-only">Something went wrong</h1>
      <StateMessage
        role="alert"
        icon={<AlertOctagonIcon size={28} />}
        title="Something went wrong"
        description="This page hit an unexpected error. Reloading usually fixes it."
        action={
          <>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload page
            </Button>
            <Link to={paths.incidents} className={buttonClassName()}>
              Go to incidents
            </Link>
          </>
        }
      />
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="mt-6 overflow-auto rounded-md bg-surface-muted p-3 text-xs text-muted">{error.stack}</pre>
      )}
    </div>
  )
}
