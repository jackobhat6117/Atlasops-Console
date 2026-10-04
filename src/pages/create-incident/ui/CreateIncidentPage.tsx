import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateIncidentForm } from '@/features/create-incident'
import { paths } from '@/shared/config'
import { useDocumentTitle } from '@/shared/lib'
import { Breadcrumbs, PageHeader } from '@/shared/ui'

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
        <PageHeader
          title="New incident"
          headingRef={headingRef}
          breadcrumbs={<Breadcrumbs items={[{ label: 'Incidents', to: paths.incidents }, { label: 'New incident' }]} />}
          meta={
            <>
              Fields marked <span className="text-danger">*</span> are required
            </>
          }
        />
        {/* Replace the history entry, so Back from the new incident doesn't return to a submitted form. */}
        <CreateIncidentForm onCreated={(incident) => navigate(paths.incident(incident.id), { replace: true })} />
      </div>
    </div>
  )
}
