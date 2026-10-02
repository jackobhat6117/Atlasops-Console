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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
      <Link
        to={paths.incidents}
        className="inline-flex items-center gap-1 self-start rounded text-sm font-medium text-muted hover:text-fg"
      >
        <ChevronLeftIcon />
        Back to incidents
      </Link>
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold tracking-tight text-fg outline-none">
          New incident
        </h1>
        <p className="mt-0.5 text-muted">Report a problem so the team can triage and track it.</p>
      </div>
      <div className="rounded-lg border border-line bg-surface p-4 shadow-sm sm:p-6">
        {/* Replace the history entry, so Back from the new incident doesn't return to a submitted form. */}
        <CreateIncidentForm onCreated={(incident) => navigate(paths.incident(incident.id), { replace: true })} />
      </div>
    </div>
  )
}
