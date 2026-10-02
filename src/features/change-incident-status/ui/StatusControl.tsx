import { useRef } from 'react'
import {
  STATUS_TRANSITIONS,
  StatusBadge,
  getTransitionLabel,
  type Incident,
  type IncidentStatus,
} from '@/entities/incident'
import { Button, Spinner } from '@/shared/ui'
import { useChangeIncidentStatus } from '../model/use-change-incident-status'

/**
 * Current status plus the transitions allowed from it. The change is applied
 * optimistically. While it is in flight, the actions are disabled (no
 * duplicate requests) and focus moves to the status, because the clicked
 * button is replaced by the new status's actions.
 */
export function StatusControl({ incident }: { incident: Incident }) {
  const mutation = useChangeIncidentStatus(incident.id)
  const statusRef = useRef<HTMLDivElement>(null)

  const change = (status: IncidentStatus) => {
    if (mutation.isPending) return
    mutation.mutate(status)
    statusRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-subtle uppercase">Status</h3>
      <div ref={statusRef} tabIndex={-1} className="flex items-center gap-2 rounded outline-none">
        <StatusBadge status={incident.status} className="text-sm font-medium" />
        {mutation.isPending && (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Spinner size={12} />
            Saving…
          </span>
        )}
      </div>
      <div role="group" aria-label="Change status" className="flex flex-wrap gap-2">
        {STATUS_TRANSITIONS[incident.status].map((to) => (
          <Button
            key={to}
            size="sm"
            variant={to === 'resolved' ? 'primary' : 'secondary'}
            disabled={mutation.isPending}
            onClick={() => change(to)}
          >
            {getTransitionLabel(incident.status, to)}
          </Button>
        ))}
      </div>
    </div>
  )
}
