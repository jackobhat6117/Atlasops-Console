import { Link } from 'react-router-dom'
import { paths } from '@/shared/config'
import { useDocumentTitle } from '@/shared/lib'
import { ChevronLeftIcon } from '@/shared/ui'

// Temporary: the create form is a later milestone.
export function CreateIncidentPage() {
  useDocumentTitle('New incident')
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link to={paths.incidents} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg">
        <ChevronLeftIcon />
        Back to incidents
      </Link>
      <h1 className="mt-4 text-xl font-semibold">New incident</h1>
      <p className="mt-2 text-muted">The create form is coming in a later milestone.</p>
    </div>
  )
}
