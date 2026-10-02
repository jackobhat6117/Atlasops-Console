import { Link } from 'react-router-dom'
import { paths } from '@/shared/config'
import { useDocumentTitle } from '@/shared/lib'
import { buttonClassName, StateMessage } from '@/shared/ui'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="sr-only">Page not found</h1>
      <StateMessage
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={
          <Link to={paths.incidents} className={buttonClassName({ variant: 'primary' })}>
            Go to incidents
          </Link>
        }
      />
    </div>
  )
}
