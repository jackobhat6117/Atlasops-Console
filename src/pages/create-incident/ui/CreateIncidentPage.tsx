import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreateIncidentForm } from '@/features/create-incident'
import { paths } from '@/shared/config'
import { useDocumentTitle } from '@/shared/lib'
import { ChevronLeftIcon } from '@/shared/ui'

export function CreateIncidentPage() {
  useDocumentTitle('New incident')
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="page-shell">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <Link
          to={paths.incidents}
          className="inline-flex items-center gap-1 self-start rounded text-sm font-medium text-muted hover:text-fg"
        >
          <ChevronLeftIcon />
          Back to incidents
        </Link>
        <header className="page-header">
          <div>
            <p className="eyebrow">Incident intake</p>
            <h1 ref={headingRef} tabIndex={-1} className="page-title outline-none">
              New incident
            </h1>
            <p className="page-description">
              Report an operational issue so the response team can triage and own it. Fields marked{' '}
              <span className="text-danger">*</span> are required.
            </p>
          </div>
        </header>
        {/* Replace the history entry, so Back from the new incident doesn't return to a submitted form. */}
        <CreateIncidentForm onCreated={(incident) => navigate(paths.incident(incident.id), { replace: true })} />
      </div>
    </div>
  )
}
