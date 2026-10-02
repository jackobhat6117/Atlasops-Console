import { useParams } from 'react-router-dom'
import { useDocumentTitle } from '@/shared/lib'
import { BackToIncidentsLink } from './BackToIncidentsLink'

// Temporary: the full detail screen is the next milestone.
export function IncidentDetailPage() {
  const { incidentId = '' } = useParams()
  useDocumentTitle(incidentId)
  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
      <BackToIncidentsLink incidentId={incidentId} />
      <h1 className="mt-4 text-xl font-semibold">{incidentId}</h1>
      <p className="mt-2 text-muted">Incident details are coming in the next milestone.</p>
    </div>
  )
}
